import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مخول" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "overview";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : now;

    console.log(
      `Generating ${reportType} report from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    switch (reportType) {
      case "sales":
        return await generateSalesReport(startDate, endDate);
      case "purchases":
        return await generatePurchasesReport(startDate, endDate);
      case "inventory":
        return await generateInventoryReport();
      case "financial":
        return await generateFinancialReport(startDate, endDate);
      case "customers":
        return await generateCustomersReport(startDate, endDate);
      case "suppliers":
        return await generateSuppliersReport(startDate, endDate);
      default:
        return await generateOverviewReport(startDate, endDate);
    }
  } catch (error) {
    console.error("خطأ في جلب التقارير:", error);
    return NextResponse.json(
      {
        error: "خطأ في الخادم الداخلي",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Generate Sales Report
async function generateSalesReport(startDate: Date, endDate: Date) {
  // Daily sales data
  const dailySales = await prisma.outgoingOrder.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["CONFIRMED", "COMPLETED"],
      },
    },
    include: {
      customer: {
        select: { nameAr: true },
      },
      items: {
        include: {
          item: {
            select: { nameAr: true, category: { select: { nameAr: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Summary calculations
  const totalSales = dailySales.reduce(
    (sum, order) => sum + Number(order.finalAmount),
    0
  );
  const totalOrders = dailySales.length;
  const totalDiscount = dailySales.reduce(
    (sum, order) => sum + Number(order.discount),
    0
  );

  // Top customers
  const customerSales = new Map<
    string,
    { name: string; total: number; orders: number }
  >();
  dailySales.forEach((order) => {
    const customerName = order.customer?.nameAr ?? "عميل غير معروف";
    const key = customerName;
    if (customerSales.has(key)) {
      const current = customerSales.get(key)!;
      current.total += Number(order.finalAmount);
      current.orders += 1;
    } else {
      customerSales.set(key, {
        name: customerName,
        total: Number(order.finalAmount),
        orders: 1,
      });
    }
  });

  const topCustomers = Array.from(customerSales.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Top selling items
  const itemSales = new Map<
    string,
    { name: string; category: string; quantity: number; revenue: number }
  >();
  dailySales.forEach((order) => {
    order.items.forEach((orderItem) => {
      const itemName = orderItem.item?.nameAr ?? "منتج غير معروف";
      const categoryName = orderItem.item?.category?.nameAr ?? "بدون تصنيف";
      const key = itemName;
      if (itemSales.has(key)) {
        const current = itemSales.get(key)!;
        current.quantity += orderItem.quantity;
        current.revenue += Number(orderItem.totalPrice);
      } else {
        itemSales.set(key, {
          name: itemName,
          category: categoryName,
          quantity: orderItem.quantity,
          revenue: Number(orderItem.totalPrice),
        });
      }
    });
  });

  const topItems = Array.from(itemSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Daily chart data
  const chartData = generateDailyChartData(dailySales, startDate, endDate);

  return NextResponse.json({
    type: "sales",
    period: { startDate, endDate },
    summary: {
      totalSales,
      totalOrders,
      totalDiscount,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
    },
    chartData,
    topCustomers,
    topItems,
    recentOrders: dailySales.slice(0, 20).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer.nameAr,
      amount: Number(order.finalAmount),
      discount: Number(order.discount),
      date: order.createdAt,
      status: order.status,
    })),
  });
}

// Generate Purchases Report
async function generatePurchasesReport(startDate: Date, endDate: Date) {
  const purchases = await prisma.incomingOrder.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["CONFIRMED", "COMPLETED"],
      },
    },
    include: {
      supplier: {
        select: { nameAr: true },
      },
      items: {
        include: {
          item: {
            select: { nameAr: true, category: { select: { nameAr: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalPurchases = purchases.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );
  const totalOrders = purchases.length;

  // Top suppliers
  const supplierPurchases = new Map<
    string,
    { name: string; total: number; orders: number }
  >();
  purchases.forEach((order) => {
    const supplierName = order.supplier?.nameAr ?? "مورد غير معروف";
    const key = supplierName;
    if (supplierPurchases.has(key)) {
      const current = supplierPurchases.get(key)!;
      current.total += Number(order.totalAmount);
      current.orders += 1;
    } else {
      supplierPurchases.set(key, {
        name: supplierName,
        total: Number(order.totalAmount),
        orders: 1,
      });
    }
  });

  const topSuppliers = Array.from(supplierPurchases.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const chartData = generateDailyChartData(
    purchases,
    startDate,
    endDate,
    "totalAmount"
  );

  return NextResponse.json({
    type: "purchases",
    period: { startDate, endDate },
    summary: {
      totalPurchases,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalPurchases / totalOrders : 0,
    },
    chartData,
    topSuppliers,
    recentOrders: purchases.slice(0, 20).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplier: order.supplier.nameAr,
      amount: Number(order.totalAmount),
      date: order.createdAt,
      status: order.status,
    })),
  });
}

// Generate Inventory Report
async function generateInventoryReport() {
  // Get all items with current stock
  const items = await prisma.item.findMany({
    where: { isActive: true },
    include: {
      category: { select: { nameAr: true } },
      inventoryLogs: {
        orderBy: { createdAt: "asc" },
        select: {
          type: true,
          quantity: true,
          currentStock: true,
        },
      },
    },
  });

  const inventoryData = items.map((item) => {
    const lastLog =
      item.inventoryLogs.length > 0
        ? item.inventoryLogs[item.inventoryLogs.length - 1]
        : null;
    const currentStock = lastLog ? lastLog.currentStock : 0;

    const status =
      currentStock <= 0
        ? "out_of_stock"
        : currentStock <= item.minStock
        ? "low_stock"
        : currentStock <= item.minStock * 1.5
        ? "warning"
        : "good";

    return {
      id: item.id,
      name: item.nameAr,
      category: item.category.nameAr,
      currentStock,
      minStock: item.minStock,
      unit: item.unit,
      status,
      sku: item.sku,
    };
  });

  // Categories
  const lowStockCount = inventoryData.filter(
    (item) => item.status === "low_stock" || item.status === "out_of_stock"
  ).length;
  const warningStockCount = inventoryData.filter(
    (item) => item.status === "warning"
  ).length;
  const goodStockCount = inventoryData.filter(
    (item) => item.status === "good"
  ).length;

  return NextResponse.json({
    type: "inventory",
    summary: {
      totalItems: inventoryData.length,
      lowStockCount,
      warningStockCount,
      goodStockCount,
      outOfStockCount: inventoryData.filter(
        (item) => item.status === "out_of_stock"
      ).length,
    },
    items: inventoryData.sort((a, b) => {
      if (a.status === "out_of_stock" && b.status !== "out_of_stock") return -1;
      if (b.status === "out_of_stock" && a.status !== "out_of_stock") return 1;
      if (a.status === "low_stock" && b.status !== "low_stock") return -1;
      if (b.status === "low_stock" && a.status !== "low_stock") return 1;
      return a.name.localeCompare(b.name);
    }),
  });
}

// Generate Financial Report
async function generateFinancialReport(startDate: Date, endDate: Date) {
  const [sales, purchases] = await Promise.all([
    generateSalesReport(startDate, endDate),
    generatePurchasesReport(startDate, endDate),
  ]);

  const salesData = await sales.json();
  const purchasesData = await purchases.json();

  const profit =
    salesData.summary.totalSales - purchasesData.summary.totalPurchases;
  const profitMargin =
    salesData.summary.totalSales > 0
      ? (profit / salesData.summary.totalSales) * 100
      : 0;

  return NextResponse.json({
    type: "financial",
    period: { startDate, endDate },
    summary: {
      totalRevenue: salesData.summary.totalSales,
      totalExpenses: purchasesData.summary.totalPurchases,
      grossProfit: profit,
      profitMargin,
      salesOrders: salesData.summary.totalOrders,
      purchaseOrders: purchasesData.summary.totalOrders,
    },
    salesData: salesData.chartData,
    purchasesData: purchasesData.chartData,
  });
}

// Generate Customers Report
async function generateCustomersReport(startDate: Date, endDate: Date) {
  const customers = await prisma.customer.findMany({
    include: {
      outgoingOrders: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "COMPLETED",
        },
      },
    },
  });

  const customersData = customers
    .map((customer) => {
      const totalSpent = customer.outgoingOrders.reduce(
        (sum, order) => sum + Number(order.finalAmount),
        0
      );
      const ordersCount = customer.outgoingOrders.length;

      return {
        id: customer.id,
        name: customer.nameAr,
        phone: customer.phone,
        email: customer.email,
        customerType: customer.customerType,
        totalSpent,
        ordersCount,
        averageOrderValue: ordersCount > 0 ? totalSpent / ordersCount : 0,
        lastOrderDate:
          customer.outgoingOrders.length > 0
            ? new Date(
                Math.max(
                  ...customer.outgoingOrders.map((o) => o.createdAt.getTime())
                )
              )
            : null,
      };
    })
    .filter((customer) => customer.ordersCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return NextResponse.json({
    type: "customers",
    period: { startDate, endDate },
    summary: {
      totalCustomers: customersData.length,
      totalRevenue: customersData.reduce((sum, c) => sum + c.totalSpent, 0),
      averageOrderValue:
        customersData.length > 0
          ? customersData.reduce((sum, c) => sum + c.averageOrderValue, 0) /
            customersData.length
          : 0,
    },
    customers: customersData,
  });
}

// Generate Suppliers Report
async function generateSuppliersReport(startDate: Date, endDate: Date) {
  const suppliers = await prisma.supplier.findMany({
    include: {
      incomingOrders: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "COMPLETED",
        },
      },
    },
  });

  const suppliersData = suppliers
    .map((supplier) => {
      const totalPurchased = supplier.incomingOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );
      const ordersCount = supplier.incomingOrders.length;

      return {
        id: supplier.id,
        name: supplier.nameAr,
        phone: supplier.phone,
        email: supplier.email,
        totalPurchased,
        ordersCount,
        averageOrderValue: ordersCount > 0 ? totalPurchased / ordersCount : 0,
        lastOrderDate:
          supplier.incomingOrders.length > 0
            ? new Date(
                Math.max(
                  ...supplier.incomingOrders.map((o) => o.createdAt.getTime())
                )
              )
            : null,
      };
    })
    .filter((supplier) => supplier.ordersCount > 0)
    .sort((a, b) => b.totalPurchased - a.totalPurchased);

  return NextResponse.json({
    type: "suppliers",
    period: { startDate, endDate },
    summary: {
      totalSuppliers: suppliersData.length,
      totalPurchases: suppliersData.reduce(
        (sum, s) => sum + s.totalPurchased,
        0
      ),
      averageOrderValue:
        suppliersData.length > 0
          ? suppliersData.reduce((sum, s) => sum + s.averageOrderValue, 0) /
            suppliersData.length
          : 0,
    },
    suppliers: suppliersData,
  });
}

// Generate Overview Report
async function generateOverviewReport(startDate: Date, endDate: Date) {
  const [salesResponse, purchasesResponse, inventoryResponse] =
    await Promise.all([
      generateSalesReport(startDate, endDate),
      generatePurchasesReport(startDate, endDate),
      generateInventoryReport(),
    ]);

  const sales = await salesResponse.json();
  const purchases = await purchasesResponse.json();
  const inventory = await inventoryResponse.json();

  return NextResponse.json({
    type: "overview",
    period: { startDate, endDate },
    sales: sales.summary,
    purchases: purchases.summary,
    inventory: inventory.summary,
    profit: sales.summary.totalSales - purchases.summary.totalPurchases,
    topCustomers: sales.topCustomers.slice(0, 5),
    topSuppliers: purchases.topSuppliers.slice(0, 5),
    topItems: sales.topItems.slice(0, 5),
  });
}

// Helper function to generate daily chart data
function generateDailyChartData(
  orders: any[],
  startDate: Date,
  endDate: Date,
  amountField = "finalAmount"
) {
  const dayMap = new Map<string, number>();

  // Initialize all days with 0
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split("T")[0];
    dayMap.set(dateKey, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill with actual data
  orders.forEach((order) => {
    const dateKey = order.createdAt.toISOString().split("T")[0];
    const currentValue = dayMap.get(dateKey) || 0;
    dayMap.set(dateKey, currentValue + Number(order[amountField]));
  });

  // Convert to array format
  return Array.from(dayMap.entries()).map(([date, amount]) => ({
    date,
    amount,
    label: new Date(date).toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
    }),
  }));
}
