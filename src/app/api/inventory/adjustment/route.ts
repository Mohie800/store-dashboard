import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
    }

    const { itemId, type, quantity, provision, notes } = await request.json();

    // Validate input
    if (!itemId || !type || quantity === 0 || !provision) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // Validate item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    }

    // Calculate current stock
    const logs = await prisma.inventoryLog.findMany({
      where: { itemId },
      orderBy: { createdAt: "asc" },
    });

    let currentStock = 0;
    for (const log of logs) {
      if (log.type === "IN") {
        currentStock += log.quantity;
      } else if (log.type === "OUT") {
        currentStock -= log.quantity;
      } else if (log.type === "ADJUSTMENT") {
        currentStock = log.currentStock; // Use the recorded stock level
      }
    }

    // If there are existing logs, use the most recent currentStock
    if (logs.length > 0) {
      currentStock = logs[logs.length - 1].currentStock;
    }

    // Calculate new stock based on movement type
    let newStock = currentStock;
    if (type === "IN") {
      newStock = currentStock + quantity;
    } else if (type === "OUT") {
      newStock = currentStock - quantity;
      // Check if there's enough stock
      if (newStock < 0) {
        return NextResponse.json(
          { error: "المخزون غير كافي للإخراج" },
          { status: 400 }
        );
      }
    } else if (type === "ADJUSTMENT") {
      // For adjustment, the quantity represents the new total stock
      newStock = quantity;
    }

    // Create inventory log
    const inventoryLog = await prisma.inventoryLog.create({
      data: {
        itemId,
        type,
        quantity:
          type === "ADJUSTMENT" ? Math.abs(newStock - currentStock) : quantity,
        currentStock: newStock,
        provision,
        notes: notes || null,
        userId: session.user.id,
      },
      include: {
        item: {
          select: {
            nameAr: true,
            sku: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(inventoryLog);
  } catch (error) {
    console.error("Error creating inventory adjustment:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تسجيل حركة المخزون" },
      { status: 500 }
    );
  }
}
