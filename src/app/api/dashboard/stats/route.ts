import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مخول" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current treasury balance
    const latestTreasuryLog = await prisma.treasuryLog.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const currentBalance = latestTreasuryLog?.currentBalance || 0;

    // Sales this month
    const thisMonthSales = await prisma.outgoingOrder.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        finalAmount: true,
      },
      _count: true,
    });

    // Sales last month
    const lastMonthSales = await prisma.outgoingOrder.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        finalAmount: true,
      },
    });

    // Orders today
    const todayOrders = await prisma.outgoingOrder.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    // Orders yesterday
    const yesterdayStart = new Date(startOfToday);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(startOfToday);

    const yesterdayOrders = await prisma.outgoingOrder.count({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: yesterdayEnd,
        },
      },
    });

    // Low stock items
    const lowStockItems = await prisma.$queryRaw`
      SELECT 
        i.id,
        i."nameAr",
        i."minStock",
        COALESCE(stock_summary.current_stock, 0) as current_stock
      FROM "items" i
      LEFT JOIN (
        SELECT 
          il."itemId",
          SUM(
            CASE 
              WHEN il.type = 'IN' THEN il.quantity
              WHEN il.type = 'OUT' THEN -il.quantity
              ELSE il.quantity
            END
          ) as current_stock
        FROM "inventory_logs" il
        GROUP BY il."itemId"
      ) stock_summary ON stock_summary."itemId" = i.id
      WHERE i."isActive" = true
        AND COALESCE(stock_summary.current_stock, 0) <= i."minStock"
      ORDER BY COALESCE(stock_summary.current_stock, 0) ASC
    `;

    // Calculate percentage changes
    const currentMonthSales = Number(thisMonthSales._sum.finalAmount || 0);
    const previousMonthSales = Number(lastMonthSales._sum.finalAmount || 0);
    const salesChangePercentage =
      previousMonthSales > 0
        ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
        : 0;

    const ordersChange = todayOrders - yesterdayOrders;

    return NextResponse.json({
      totalSales: {
        amount: currentMonthSales,
        change: salesChangePercentage,
        period: "month",
      },
      todayOrders: {
        count: todayOrders,
        change: ordersChange,
        yesterday: yesterdayOrders,
      },
      treasuryBalance: {
        amount: Number(currentBalance),
        change: 5.2, // This would need to be calculated based on weekly comparison
      },
      lowStockItems: {
        count: (lowStockItems as any[]).length,
        items: lowStockItems,
      },
      monthlyOrdersCount: thisMonthSales._count,
    });
  } catch (error) {
    console.error("خطأ في جلب إحصائيات الرئيسية:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    );
  }
}
