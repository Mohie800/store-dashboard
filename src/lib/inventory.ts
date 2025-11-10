import { prisma } from "@/lib/prisma";

export async function getInventorySummary() {
  try {
    // Get all items with their logs
    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        inventoryLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const totalItems = items.length;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    for (const item of items) {
      // Calculate current stock
      let currentStock = 0;
      for (const log of item.inventoryLogs) {
        if (log.type === "IN") {
          currentStock += log.quantity;
        } else if (log.type === "OUT") {
          currentStock -= log.quantity;
        } else if (log.type === "ADJUSTMENT") {
          currentStock = log.currentStock;
        }
      }

      // If there are logs, use the most recent currentStock
      if (item.inventoryLogs.length > 0) {
        const lastLog = item.inventoryLogs[item.inventoryLogs.length - 1];
        currentStock = lastLog.currentStock;
      }

      // Check stock levels
      if (currentStock === 0) {
        outOfStockItems++;
      } else if (currentStock <= item.minStock) {
        lowStockItems++;
      }
    }

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      availableItems: totalItems - outOfStockItems,
    };
  } catch (error) {
    console.error("Error getting inventory summary:", error);
    return {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      availableItems: 0,
    };
  }
}

export async function getItemCurrentStock(itemId: string): Promise<number> {
  try {
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
        currentStock = log.currentStock;
      }
    }

    // If there are logs, use the most recent currentStock
    if (logs.length > 0) {
      currentStock = logs[logs.length - 1].currentStock;
    }

    return currentStock;
  } catch (error) {
    console.error("Error getting item current stock:", error);
    return 0;
  }
}

export async function createInventoryLog(data: {
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  provision: string;
  notes?: string;
  userId: string;
}) {
  try {
    // Get current stock
    const currentStock = await getItemCurrentStock(data.itemId);

    let newStock = currentStock;
    if (data.type === "IN") {
      newStock = currentStock + data.quantity;
    } else if (data.type === "OUT") {
      newStock = currentStock - data.quantity;
      if (newStock < 0) {
        throw new Error("المخزون غير كافي");
      }
    } else if (data.type === "ADJUSTMENT") {
      newStock = data.quantity; // For adjustments, quantity is the new total
    }

    const log = await prisma.inventoryLog.create({
      data: {
        ...data,
        quantity:
          data.type === "ADJUSTMENT"
            ? Math.abs(newStock - currentStock)
            : data.quantity,
        currentStock: newStock,
      },
    });

    return log;
  } catch (error) {
    console.error("Error creating inventory log:", error);
    throw error;
  }
}
