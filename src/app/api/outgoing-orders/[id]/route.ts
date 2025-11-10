import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const UpdateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

// GET - Fetch single outgoing order
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

    const order = await prisma.outgoingOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                unit: true,
                sku: true,
              },
            },
          },
        },
        treasuryLog: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching outgoing order:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع البيانات" },
      { status: 500 }
    );
  }
}

// PUT - Update outgoing order
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
    const validatedData = UpdateOrderSchema.parse(body);

    // Check if order exists
    const existingOrder = await prisma.outgoingOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            item: true,
          },
        },
        treasuryLog: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // If changing status to CANCELLED, need to reverse inventory changes
    if (
      validatedData.status === "CANCELLED" &&
      existingOrder.status !== "CANCELLED"
    ) {
      await prisma.$transaction(async (tx) => {
        // Reverse inventory changes
        for (const orderItem of existingOrder.items) {
          // Get current stock
          const latestLog = await tx.inventoryLog.findFirst({
            where: { itemId: orderItem.itemId },
            orderBy: { createdAt: "desc" },
          });

          const currentStock = latestLog ? latestLog.currentStock : 0;
          const newStock = currentStock + orderItem.quantity;

          // Create inventory log (returning stock)
          await tx.inventoryLog.create({
            data: {
              itemId: orderItem.itemId,
              userId: session.user.id,
              type: "IN",
              quantity: orderItem.quantity,
              currentStock: newStock,
              provision: `إلغاء طلب صادر رقم ${existingOrder.orderNumber}`,
              orderId: existingOrder.id,
              notes: `إرجاع المخزون بسبب إلغاء الطلب`,
            },
          });
        }

        const refundAmount = Number(existingOrder.finalAmount);

        if (existingOrder.treasuryLog) {
          const baseTreasuryLogUpdate = {
            provision: `مبيعات ملغاة - طلب رقم ${existingOrder.orderNumber}`,
            description: `إلغاء مبيعات - ${
              existingOrder.customer?.nameAr || ""
            }`,
          };

          await tx.treasuryLog.update({
            where: { id: existingOrder.treasuryLog.id },
            data:
              refundAmount > 0
                ? { ...baseTreasuryLogUpdate, outgoingOrderId: null }
                : baseTreasuryLogUpdate,
          });

          if (refundAmount > 0) {
            const latestTreasuryLog = await tx.treasuryLog.findFirst({
              orderBy: { createdAt: "desc" },
            });

            const currentBalance = latestTreasuryLog
              ? Number(latestTreasuryLog.currentBalance)
              : 0;
            const newBalance = currentBalance - refundAmount;

            if (newBalance < 0) {
              throw new Error("الرصيد الحالي غير كاف لإرجاع المبلغ");
            }

            await tx.treasuryLog.create({
              data: {
                type: "OUT",
                amount: refundAmount,
                currentBalance: newBalance,
                provision: `استرجاع مبلغ طلب رقم ${existingOrder.orderNumber}`,
                description: existingOrder.customer
                  ? `استرجاع مبلغ للعميل: ${existingOrder.customer.nameAr}`
                  : `استرجاع مبلغ طلب رقم ${existingOrder.orderNumber}`,
                userId: session.user.id,
                outgoingOrderId: existingOrder.id,
              },
            });
          }
        }

        // Update order status
        await tx.outgoingOrder.update({
          where: { id },
          data: validatedData,
        });
      });
    } else if (
      validatedData.status === "COMPLETED" &&
      existingOrder.status !== "COMPLETED"
    ) {
      // Order is being completed - need to create inventory logs
      await prisma.$transaction(async (tx) => {
        // Create inventory logs for each item (outgoing stock)
        for (const orderItem of existingOrder.items) {
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

          const newStock = currentStock - orderItem.quantity;

          // Check if there's enough stock
          if (newStock < 0) {
            throw new Error(`المخزون غير كافي للصنف: ${orderItem.item.nameAr}`);
          }

          await tx.inventoryLog.create({
            data: {
              itemId: orderItem.itemId,
              type: "OUT",
              quantity: orderItem.quantity,
              currentStock: newStock,
              provision: `طلبية صادرة رقم ${existingOrder.orderNumber}`,
              notes: `صرف ${orderItem.item.nameAr} للطلبية الصادرة`,
              userId: session.user.id,
              orderId: id,
            },
          });
        }

        // Create treasury log for the income only if it doesn't already exist
        if (!existingOrder.treasuryLog) {
          const currentTreasuryBalance = await tx.treasuryLog.findFirst({
            orderBy: { createdAt: "desc" },
          });

          const treasuryBalance = currentTreasuryBalance
            ? Number(currentTreasuryBalance.currentBalance)
            : 0;
          const newTreasuryBalance =
            treasuryBalance + Number(existingOrder.finalAmount);

          await tx.treasuryLog.create({
            data: {
              type: "IN",
              amount: Number(existingOrder.finalAmount),
              currentBalance: newTreasuryBalance,
              provision: `مبيعات طلبية رقم ${existingOrder.orderNumber}`,
              description: `إيرادات من بيع للعميل: ${existingOrder.customer.nameAr}`,
              userId: session.user.id,
              outgoingOrderId: id,
            },
          });
        }

        // Update order status
        await tx.outgoingOrder.update({
          where: { id },
          data: validatedData,
        });
      });
    } else {
      // Regular update without inventory changes
      await prisma.outgoingOrder.update({
        where: { id },
        data: validatedData,
      });
    }

    // Fetch updated order
    const updatedOrder = await prisma.outgoingOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                unit: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating outgoing order:", error);
    return NextResponse.json({ error: "خطأ في تحديث الطلب" }, { status: 500 });
  }
}

// DELETE - Delete outgoing order
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

    // Check if order exists and can be deleted
    const existingOrder = await prisma.outgoingOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Only allow deletion of PENDING orders
    if (existingOrder.status !== "PENDING") {
      return NextResponse.json(
        { error: "لا يمكن حذف طلب تم تأكيده أو إنجازه" },
        { status: 400 }
      );
    }

    // Delete order and reverse inventory changes in transaction
    await prisma.$transaction(async (tx) => {
      // Reverse inventory changes
      for (const orderItem of existingOrder.items) {
        // Get current stock
        const latestLog = await tx.inventoryLog.findFirst({
          where: { itemId: orderItem.itemId },
          orderBy: { createdAt: "desc" },
        });

        const currentStock = latestLog ? latestLog.currentStock : 0;
        const newStock = currentStock + orderItem.quantity;

        // Create inventory log (returning stock)
        await tx.inventoryLog.create({
          data: {
            itemId: orderItem.itemId,
            userId: session.user.id,
            type: "IN",
            quantity: orderItem.quantity,
            currentStock: newStock,
            provision: `حذف طلب صادر رقم ${existingOrder.orderNumber}`,
            orderId: existingOrder.id,
            notes: `إرجاع المخزون بسبب حذف الطلب`,
          },
        });
      }

      // Delete treasury log
      await tx.treasuryLog.deleteMany({
        where: { outgoingOrderId: existingOrder.id },
      });

      // Delete order items
      await tx.outgoingOrderItem.deleteMany({
        where: { orderId: existingOrder.id },
      });

      // Delete order
      await tx.outgoingOrder.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "تم حذف الطلب بنجاح" });
  } catch (error) {
    console.error("Error deleting outgoing order:", error);
    return NextResponse.json({ error: "خطأ في حذف الطلب" }, { status: 500 });
  }
}
