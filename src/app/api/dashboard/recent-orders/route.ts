import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مخول" }, { status: 401 });
    }

    // Get recent orders (both incoming and outgoing)
    const recentIncomingOrders = await prisma.incomingOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: {
          select: {
            nameAr: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const recentOutgoingOrders = await prisma.outgoingOrder.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            nameAr: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Combine and sort by date
    const allRecentOrders = [
      ...recentIncomingOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        type: "incoming" as const,
        amount: Number(order.totalAmount),
        status: order.status,
        createdAt: order.createdAt,
        customerOrSupplier: order.supplier.nameAr,
        user: order.user.name,
      })),
      ...recentOutgoingOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        type: "outgoing" as const,
        amount: Number(order.finalAmount),
        status: order.status,
        createdAt: order.createdAt,
        customerOrSupplier: order.customer.nameAr,
        user: order.user.name,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8); // Get top 8 most recent

    return NextResponse.json({
      orders: allRecentOrders,
    });
  } catch (error) {
    console.error("خطأ في جلب الطلبيات الأخيرة:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    );
  }
}
