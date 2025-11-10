import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "10", 10);
    const search = searchParams.get("search")?.trim() ?? "";
    const type = searchParams.get("type")?.trim() ?? "";
    const dateRange = searchParams.get("dateRange")?.trim() ?? "";

    const limit = Math.min(
      Math.max(
        Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10,
        1
      ),
      MAX_LIMIT
    );
    const requestedPage = Math.max(
      Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
      1
    );

    const filters: any[] = [];

    if (type && type !== "all") {
      const normalizedType = type.toUpperCase();
      const allowedTypes = new Set(["IN", "OUT", "ADJUSTMENT"]);
      if (allowedTypes.has(normalizedType)) {
        filters.push({ type: normalizedType });
      }
    }

    if (search) {
      filters.push({
        OR: [
          { provision: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          {
            incomingOrder: {
              orderNumber: { contains: search, mode: "insensitive" },
            },
          },
          {
            outgoingOrder: {
              orderNumber: { contains: search, mode: "insensitive" },
            },
          },
        ],
      });
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let start: Date | null = null;
      let end: Date | null = null;

      switch (dateRange) {
        case "today": {
          start = new Date();
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(end.getDate() + 1);
          break;
        }
        case "week": {
          start = new Date();
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        }
        case "month": {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        }
        default:
          break;
      }

      const dateCondition: Record<string, Date> = {};
      if (start) {
        dateCondition.gte = start;
      }
      if (end) {
        dateCondition.lt = end;
      }

      if (Object.keys(dateCondition).length > 0) {
        filters.push({ createdAt: dateCondition });
      }
    }

    const where = filters.length ? { AND: filters } : {};

    const totalLogs = await prisma.treasuryLog.count({ where });
    const totalPages = totalLogs === 0 ? 0 : Math.ceil(totalLogs / limit);
    const safePage = totalLogs === 0 ? 1 : Math.min(requestedPage, totalPages);
    const skip = totalLogs === 0 ? 0 : (safePage - 1) * limit;

    const logs = await prisma.treasuryLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        incomingOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        outgoingOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      logs,
      total: totalLogs,
      page: safePage,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching treasury logs:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحميل سجل المعاملات المالية" },
      { status: 500 }
    );
  }
}
