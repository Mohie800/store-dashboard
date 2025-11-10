import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.inventoryLog.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to recent 50 logs
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching inventory logs:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحميل سجل حركات المخزون" },
      { status: 500 }
    );
  }
}
