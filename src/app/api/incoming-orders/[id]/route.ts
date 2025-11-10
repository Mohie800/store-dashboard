import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Schema for updating incoming order
const updateIncomingOrderSchema = z.object({
  supplierId: z.string().cuid().optional(),
  supplierInvoice: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  items: z
    .array(
      z.object({
        id: z.string().cuid().optional(), // For existing items
        itemId: z.string().cuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, "يجب إضافة عنصر واحد على الأقل")
    .optional(),
});

// GET - Get single incoming order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const order = await prisma.incomingOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "الطلبية غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching incoming order:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الطلبية" },
      { status: 500 }
    );
  }
}

// PUT - Update incoming order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateIncomingOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { supplierId, supplierInvoice, notes, status, items } =
      validation.data;

    // Check if order exists
    const existingOrder = await prisma.incomingOrder.findUnique({
      where: { id },
      include: { items: true, treasuryLog: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "الطلبية غير موجودة" },
        { status: 404 }
      );
    }

    // Check if order can be modified
    if (
      existingOrder.status === "COMPLETED" ||
      existingOrder.status === "CANCELLED"
    ) {
      return NextResponse.json(
        { error: "لا يمكن تعديل طلبية مكتملة أو ملغية" },
        { status: 400 }
      );
    }

    // Verify supplier exists if provided
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId, isActive: true },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "المورد غير موجود أو غير نشط" },
          { status: 404 }
        );
      }
    }

    let totalAmount = existingOrder.totalAmount;

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update items if provided
      if (items) {
        // Verify all items exist
        const itemIds = items.map((item) => item.itemId);
        const existingItems = await tx.item.findMany({
          where: { id: { in: itemIds }, isActive: true },
        });

        if (existingItems.length !== itemIds.length) {
          throw new Error("بعض العناصر غير موجودة أو غير نشطة");
        }

        // Delete existing items
        await tx.incomingOrderItem.deleteMany({
          where: { orderId: id },
        });

        // Calculate new total
        totalAmount = new Decimal(
          items.reduce((sum, item) => {
            return sum + item.quantity * item.unitPrice;
          }, 0)
        );

        // Create new items
        await tx.incomingOrderItem.createMany({
          data: items.map((item) => ({
            orderId: id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        });
      }

      // Update order
      const updatedOrder = await tx.incomingOrder.update({
        where: { id },
        data: {
          ...(supplierId && { supplierId }),
          ...(supplierInvoice !== undefined && { supplierInvoice }),
          ...(notes !== undefined && { notes }),
          ...(status && { status }),
          ...(items && { totalAmount }),
        },
      });

      // If status is being changed to COMPLETED, create inventory logs
      if (status === "COMPLETED" && existingOrder.status !== "COMPLETED") {
        const orderItems = await tx.incomingOrderItem.findMany({
          where: { orderId: id },
          include: {
            item: {
              select: {
                id: true,
                nameAr: true,
              },
            },
          },
        });

        // Create inventory logs for each item
        for (const orderItem of orderItems) {
          // Calculate current stock before this transaction
          const existingLogs = await tx.inventoryLog.findMany({
            where: { itemId: orderItem.itemId },
            orderBy: { createdAt: "asc" },
          });

          let currentStock = 0;
          for (const log of existingLogs) {
            if (log.type === "IN") {
              currentStock += log.quantity;
            } else if (log.type === "OUT") {
              currentStock -= log.quantity;
            } else if (log.type === "ADJUSTMENT") {
              currentStock = log.currentStock;
            }
          }

          // If there are existing logs, use the most recent currentStock
          if (existingLogs.length > 0) {
            currentStock = existingLogs[existingLogs.length - 1].currentStock;
          }

          const newStock = currentStock + orderItem.quantity;

          await tx.inventoryLog.create({
            data: {
              itemId: orderItem.itemId,
              type: "IN",
              quantity: orderItem.quantity,
              currentStock: newStock,
              provision: `طلبية واردة رقم ${updatedOrder.orderNumber}`,
              notes: `استقبال ${orderItem.item.nameAr} من الطلبية الواردة`,
              userId: session.user.id,
              orderId: id,
            },
          });
        }

        // Create treasury log for the expense only if it doesn't already exist
        if (!existingOrder.treasuryLog) {
          const currentTreasuryBalance = await tx.treasuryLog.findFirst({
            orderBy: { createdAt: "desc" },
          });

          const treasuryBalance = currentTreasuryBalance
            ? Number(currentTreasuryBalance.currentBalance)
            : 0;
          const newTreasuryBalance =
            treasuryBalance - Number(updatedOrder.totalAmount);

          await tx.treasuryLog.create({
            data: {
              type: "OUT",
              amount: Number(updatedOrder.totalAmount),
              currentBalance: newTreasuryBalance,
              provision: `طلبية شراء رقم ${updatedOrder.orderNumber}`,
              description: `دفع قيمة الطلبية الواردة من المورد`,
              userId: session.user.id,
              incomingOrderId: id,
            },
          });
        }
      }

      // Return updated order with all relations
      return await tx.incomingOrder.findUnique({
        where: { id },
        include: {
          supplier: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                  sku: true,
                  unit: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating incoming order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "حدث خطأ في تحديث الطلبية",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete incoming order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const order = await prisma.incomingOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "الطلبية غير موجودة" },
        { status: 404 }
      );
    }

    // Check if order can be deleted
    if (order.status === "COMPLETED") {
      return NextResponse.json(
        { error: "لا يمكن حذف طلبية مكتملة" },
        { status: 400 }
      );
    }

    // Check if there are inventory logs related to this order
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: { orderId: id },
    });

    if (inventoryLogs.length > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف الطلبية، توجد حركات مخزون مرتبطة بها" },
        { status: 400 }
      );
    }

    // Delete order (items will be deleted due to cascade)
    await prisma.incomingOrder.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف الطلبية بنجاح" });
  } catch (error) {
    console.error("Error deleting incoming order:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الطلبية" },
      { status: 500 }
    );
  }
}
