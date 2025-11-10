import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Schema for creating incoming order
const createIncomingOrderSchema = z.object({
  supplierId: z.string().cuid(),
  supplierInvoice: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().cuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, "يجب إضافة عنصر واحد على الأقل"),
});

// GET - List incoming orders
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const supplierId = searchParams.get("supplierId") || "";

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { supplierInvoice: { contains: search, mode: "insensitive" } },
        { supplier: { nameAr: { contains: search, mode: "insensitive" } } },
        { supplier: { nameEn: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [orders, total] = await Promise.all([
      prisma.incomingOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              phone: true,
            },
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  nameAr: true,
                  nameEn: true,
                  sku: true,
                  unit: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.incomingOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching incoming orders:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الطلبات الواردة" },
      { status: 500 }
    );
  }
}

// POST - Create new incoming order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createIncomingOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { supplierId, supplierInvoice, notes, items } = validation.data;

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId, isActive: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "المورد غير موجود أو غير نشط" },
        { status: 404 }
      );
    }

    // Verify all items exist
    const itemIds = items.map((item) => item.itemId);
    const existingItems = await prisma.item.findMany({
      where: { id: { in: itemIds }, isActive: true },
    });

    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: "بعض العناصر غير موجودة أو غير نشطة" },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Generate order number
    const lastOrder = await prisma.incomingOrder.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const orderNumber = `IN-${String(
      lastOrder ? parseInt(lastOrder.orderNumber.split("-")[1]) + 1 : 1
    ).padStart(6, "0")}`;

    // Create order with items
    const order = await prisma.incomingOrder.create({
      data: {
        orderNumber,
        supplierId,
        supplierInvoice,
        totalAmount,
        notes,
        userId: session.user.id,
        items: {
          create: items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating incoming order:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الطلبية الواردة" },
      { status: 500 }
    );
  }
}
