import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مخول" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day, week, month, year

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        // Last 24 hours by hour
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        // Last 7 days
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        // Last 12 months
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      default: // month
        // Last 30 days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Sales chart data
    let salesData: any[] = [];
    let purchasesData: any[] = [];

    if (period === "day") {
      salesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('hour', o."createdAt"), 'HH24:MI') as label,
          SUM(o."finalAmount") as total_sales,
          COUNT(*) as orders_count
        FROM "outgoing_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')
        GROUP BY DATE_TRUNC('hour', o."createdAt")
        ORDER BY period ASC
      `;

      purchasesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('hour', o."createdAt"), 'HH24:MI') as label,
          SUM(o."totalAmount") as total_purchases,
          COUNT(*) as orders_count
        FROM "incoming_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')  
        GROUP BY DATE_TRUNC('hour', o."createdAt")
        ORDER BY period ASC
      `;
    } else if (period === "week") {
      salesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'DD/MM') as label,
          SUM(o."finalAmount") as total_sales,
          COUNT(*) as orders_count
        FROM "outgoing_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')
        GROUP BY DATE_TRUNC('day', o."createdAt")
        ORDER BY period ASC
      `;

      purchasesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'DD/MM') as label,
          SUM(o."totalAmount") as total_purchases,
          COUNT(*) as orders_count
        FROM "incoming_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')  
        GROUP BY DATE_TRUNC('day', o."createdAt")
        ORDER BY period ASC
      `;
    } else if (period === "year") {
      salesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('month', o."createdAt"), 'MM/YYYY') as label,
          SUM(o."finalAmount") as total_sales,
          COUNT(*) as orders_count
        FROM "outgoing_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')
        GROUP BY DATE_TRUNC('month', o."createdAt")
        ORDER BY period ASC
      `;

      purchasesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('month', o."createdAt"), 'MM/YYYY') as label,
          SUM(o."totalAmount") as total_purchases,
          COUNT(*) as orders_count
        FROM "incoming_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')  
        GROUP BY DATE_TRUNC('month', o."createdAt")
        ORDER BY period ASC
      `;
    } else {
      // Default: month (last 30 days)
      salesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'DD/MM') as label,
          SUM(o."finalAmount") as total_sales,
          COUNT(*) as orders_count
        FROM "outgoing_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')
        GROUP BY DATE_TRUNC('day', o."createdAt")
        ORDER BY period ASC
      `;

      purchasesData = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', o."createdAt") as period,
          TO_CHAR(DATE_TRUNC('day', o."createdAt"), 'DD/MM') as label,
          SUM(o."totalAmount") as total_purchases,
          COUNT(*) as orders_count
        FROM "incoming_orders" o
        WHERE o."createdAt" >= ${startDate}
          AND o."status" IN ('COMPLETED', 'CONFIRMED')  
        GROUP BY DATE_TRUNC('day', o."createdAt")
        ORDER BY period ASC
      `;
    }

    // Top selling items
    const topItems = await prisma.$queryRaw`
      SELECT 
        i."nameAr",
        i.id,
        SUM(ooi.quantity) as total_sold,
        SUM(ooi."totalPrice") as total_revenue
      FROM "outgoing_order_items" ooi
      JOIN "outgoing_orders" oo ON oo.id = ooi."orderId"
      JOIN "items" i ON i.id = ooi."itemId"
      WHERE oo."createdAt" >= ${startDate}
        AND oo."status" IN ('COMPLETED', 'CONFIRMED')
      GROUP BY i.id, i."nameAr"
      ORDER BY total_sold DESC
        LIMIT 10
    `;

    // Category performance
    const categoryData = await prisma.$queryRaw`
      SELECT 
        c."nameAr",
        c.id,
        SUM(ooi.quantity) as total_sold,
        SUM(ooi."totalPrice") as total_revenue,
        COUNT(DISTINCT ooi."itemId") as items_count
      FROM "outgoing_order_items" ooi
      JOIN "outgoing_orders" oo ON oo.id = ooi."orderId"
      JOIN "items" i ON i.id = ooi."itemId"
      JOIN "categories" c ON c.id = i."categoryId"
      WHERE oo."createdAt" >= ${startDate}
        AND oo."status" IN ('COMPLETED', 'CONFIRMED')
      GROUP BY c.id, c."nameAr"
      ORDER BY total_revenue DESC
        LIMIT 8
    `;

    return NextResponse.json({
      period,
      salesChart: {
        data: (salesData as any[]).map((row) => ({
          label: row.label,
          sales: Number(row.total_sales || 0),
          orders: Number(row.orders_count || 0),
          period: row.period,
        })),
      },
      purchasesChart: {
        data: (purchasesData as any[]).map((row) => ({
          label: row.label,
          purchases: Number(row.total_purchases || 0),
          orders: Number(row.orders_count || 0),
          period: row.period,
        })),
      },
      topItems: (topItems as any[]).map((row) => ({
        id: row.id,
        name: row.nameAr,
        totalSold: Number(row.total_sold || 0),
        totalRevenue: Number(row.total_revenue || 0),
      })),
      categoryPerformance: (categoryData as any[]).map((row) => ({
        id: row.id,
        name: row.nameAr,
        totalSold: Number(row.total_sold || 0),
        totalRevenue: Number(row.total_revenue || 0),
        itemsCount: Number(row.items_count || 0),
      })),
    });
  } catch (error) {
    console.error("خطأ في جلب تحليلات البيانات:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    );
  }
}
