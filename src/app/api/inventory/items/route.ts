import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get items with their current stock levels
    const items = await prisma.item.findMany({
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
        inventoryLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            type: true,
            quantity: true,
            createdAt: true,
          },
        },
      },
      where: {
        isActive: true,
      },
      orderBy: {
        nameAr: "asc",
      },
    });

    // Calculate current stock for each item
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        // Calculate current stock from inventory logs
        const logs = await prisma.inventoryLog.findMany({
          where: {
            itemId: item.id,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        let currentStock = 0;
        for (const log of logs) {
          if (log.type === "IN" || log.type === "ADJUSTMENT") {
            if (log.type === "ADJUSTMENT") {
              // For adjustments, the quantity could be positive or negative
              // The currentStock in the log represents the final stock after adjustment
              currentStock = log.currentStock;
            } else {
              currentStock += log.quantity;
            }
          } else if (log.type === "OUT") {
            currentStock -= log.quantity;
          }
        }

        // If there are logs, use the currentStock from the most recent log
        if (logs.length > 0) {
          currentStock = logs[logs.length - 1].currentStock;
        }

        return {
          ...item,
          currentStock,
          lastMovement: item.inventoryLogs[0] || null,
          inventoryLogs: undefined, // Remove this from response
        };
      })
    );

    return NextResponse.json(itemsWithStock);
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحميل بيانات المخزون" },
      { status: 500 }
    );
  }
}
