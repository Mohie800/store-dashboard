import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for outgoing order
const OutgoingOrderItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  quantity: z.number().min(1, "الكمية يجب أن تكون أكبر من 0"),
  unitPrice: z.number().min(0, "سعر الوحدة يجب أن يكون موجب"),
});

const OutgoingOrderSchema = z.object({
  customerId: z.string().min(1, "العميل مطلوب"),
  items: z
    .array(OutgoingOrderItemSchema)
    .min(1, "يجب إضافة صنف واحد على الأقل"),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Generate order number
function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-6);
  return `OUT-${year}${month}${day}-${time}`;
}

// GET - Fetch all outgoing orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status
      ? {
          status: status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED",
        }
      : {};

    const orders = await prisma.outgoingOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            phone: true,
          },
        },
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
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching outgoing orders:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع البيانات" },
      { status: 500 }
    );
  }
}

// POST - Create new outgoing order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = OutgoingOrderSchema.parse(body);

    const { customerId, items, discount = 0, notes } = validatedData;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    // Check if all items exist and have sufficient stock
    const itemIds = items.map((item) => item.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: {
        inventoryLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (dbItems.length !== items.length) {
      return NextResponse.json(
        { error: "بعض الأصناف غير موجودة" },
        { status: 404 }
      );
    }

    // Check stock availability
    for (const orderItem of items) {
      const dbItem = dbItems.find((item) => item.id === orderItem.itemId);
      if (!dbItem) continue;

      // Get current stock from latest inventory log
      const currentStock =
        dbItem.inventoryLogs.length > 0
          ? dbItem.inventoryLogs[0].currentStock
          : 0;

      if (currentStock < orderItem.quantity) {
        return NextResponse.json(
          {
            error: `المخزون غير كافي للصنف ${dbItem.nameAr}. المتاح: ${currentStock}, المطلوب: ${orderItem.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const finalAmount = totalAmount - discount;

    // Create order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.outgoingOrder.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId,
          userId: session.user.id,
          totalAmount,
          discount,
          finalAmount,
          notes,
          status: "PENDING",
        },
      });

      // Create order items and update inventory
      for (const orderItem of items) {
        const totalPrice = orderItem.quantity * orderItem.unitPrice;

        // Create order item
        await tx.outgoingOrderItem.create({
          data: {
            orderId: order.id,
            itemId: orderItem.itemId,
            quantity: orderItem.quantity,
            unitPrice: orderItem.unitPrice,
            totalPrice,
          },
        });

        // Get current stock
        const latestLog = await tx.inventoryLog.findFirst({
          where: { itemId: orderItem.itemId },
          orderBy: { createdAt: "desc" },
        });

        const currentStock = latestLog ? latestLog.currentStock : 0;
        const newStock = currentStock - orderItem.quantity;

        // Create inventory log (outgoing stock)
        await tx.inventoryLog.create({
          data: {
            itemId: orderItem.itemId,
            userId: session.user.id,
            type: "OUT",
            quantity: -orderItem.quantity,
            currentStock: newStock,
            provision: `طلب صادر رقم ${order.orderNumber}`,
            orderId: order.id,
            notes: `بيع للعميل ${customer.nameAr}`,
          },
        });
      }

      // Create treasury log (incoming money)
      const latestTreasuryLog = await tx.treasuryLog.findFirst({
        orderBy: { createdAt: "desc" },
      });

      const currentBalance = latestTreasuryLog
        ? Number(latestTreasuryLog.currentBalance)
        : 0;
      const newBalance = currentBalance + finalAmount;

      await tx.treasuryLog.create({
        data: {
          userId: session.user.id,
          type: "IN",
          amount: finalAmount,
          currentBalance: newBalance,
          provision: `مبيعات - طلب رقم ${order.orderNumber}`,
          description: `مبيعات للعميل ${customer.nameAr}`,
          outgoingOrderId: order.id,
        },
      });

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating outgoing order:", error);
    return NextResponse.json({ error: "خطأ في إنشاء الطلب" }, { status: 500 });
  }
}
