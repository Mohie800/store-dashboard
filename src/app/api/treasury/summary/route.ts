import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all treasury logs to calculate summary
    const logs = await prisma.treasuryLog.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate current balance (should be the last log's currentBalance)
    const currentBalance =
      logs.length > 0 ? logs[logs.length - 1].currentBalance : 0;

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

    const summary = {
      currentBalance: Number(currentBalance),
      totalIncome,
      totalExpenses,
      todayIncome,
      todayExpenses,
      monthlyIncome,
      monthlyExpenses,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching treasury summary:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحميل ملخص الخزينة" },
      { status: 500 }
    );
  }
}
