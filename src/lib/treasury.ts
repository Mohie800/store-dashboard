import { prisma } from "@/lib/prisma";

export async function getTreasuryBalance(): Promise<number> {
  try {
    const lastLog = await prisma.treasuryLog.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    return lastLog ? Number(lastLog.currentBalance) : 0;
  } catch (error) {
    console.error("Error getting treasury balance:", error);
    return 0;
  }
}

export async function createTreasuryLog(data: {
  type: "IN" | "OUT" | "ADJUSTMENT";
  amount: number;
  provision: string;
  description?: string;
  userId: string;
  incomingOrderId?: string;
  outgoingOrderId?: string;
}) {
  try {
    // Get current balance
    const currentBalance = await getTreasuryBalance();

    let newBalance = currentBalance;
    if (data.type === "IN") {
      newBalance = currentBalance + data.amount;
    } else if (data.type === "OUT") {
      newBalance = currentBalance - data.amount;
      if (newBalance < 0) {
        throw new Error("الرصيد غير كافي");
      }
    } else if (data.type === "ADJUSTMENT") {
      newBalance = data.amount; // For adjustments, amount is the new total
    }

    const log = await prisma.treasuryLog.create({
      data: {
        ...data,
        amount:
          data.type === "ADJUSTMENT"
            ? Math.abs(newBalance - currentBalance)
            : data.amount,
        currentBalance: newBalance,
      },
    });

    return log;
  } catch (error) {
    console.error("Error creating treasury log:", error);
    throw error;
  }
}

export async function getTreasurySummary() {
  try {
    // Get all treasury logs
    const logs = await prisma.treasuryLog.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    const currentBalance =
      logs.length > 0 ? Number(logs[logs.length - 1].currentBalance) : 0;

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    logs.forEach((log) => {
      if (log.type === "IN") {
        totalIncome += Number(log.amount);
      } else if (log.type === "OUT") {
        totalExpenses += Number(log.amount);
      }
    });

    // Calculate today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = logs.filter((log) => {
      const logDate = new Date(log.createdAt);
      return logDate >= today && logDate < tomorrow;
    });

    let todayIncome = 0;
    let todayExpenses = 0;

    todayLogs.forEach((log) => {
      if (log.type === "IN") {
        todayIncome += Number(log.amount);
      } else if (log.type === "OUT") {
        todayExpenses += Number(log.amount);
      }
    });

    // Calculate this month's transactions
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const monthlyLogs = logs.filter((log) => {
      const logDate = new Date(log.createdAt);
      return logDate >= firstDayOfMonth && logDate < firstDayOfNextMonth;
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    monthlyLogs.forEach((log) => {
      if (log.type === "IN") {
        monthlyIncome += Number(log.amount);
      } else if (log.type === "OUT") {
        monthlyExpenses += Number(log.amount);
      }
    });

    return {
      currentBalance,
      totalIncome,
      totalExpenses,
      todayIncome,
      todayExpenses,
      monthlyIncome,
      monthlyExpenses,
      netProfit: totalIncome - totalExpenses,
      monthlyNetProfit: monthlyIncome - monthlyExpenses,
    };
  } catch (error) {
    console.error("Error getting treasury summary:", error);
    return {
      currentBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      todayIncome: 0,
      todayExpenses: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      netProfit: 0,
      monthlyNetProfit: 0,
    };
  }
}
