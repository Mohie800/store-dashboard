import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema
const ItemSchema = z.object({
  nameAr: z.string().min(1, "اسم المنتج بالعربية مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().min(1, "رمز المنتج مطلوب"),
  barcode: z.string().optional(),
  unit: z.string().min(1, "وحدة القياس مطلوبة"),
  minStock: z
    .number()
    .min(0, "الحد الأدنى للمخزون يجب أن يكون صفر أو أكثر")
    .default(0),
  categoryId: z.string().min(1, "التصنيف مطلوب"),
});

// GET - Fetch all items
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            incomingOrderItems: true,
            outgoingOrderItems: true,
            inventoryLogs: true,
          },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع البيانات" },
      { status: 500 }
    );
  }
}

// POST - Create new item
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ItemSchema.parse(body);

    // Check if item with same SKU already exists
    const existingItem = await prisma.item.findUnique({
      where: {
        sku: validatedData.sku,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "منتج برمز SKU مماثل موجود بالفعل" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "التصنيف المحدد غير موجود" },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        ...validatedData,
        nameEn: validatedData.nameEn || null,
        description: validatedData.description || null,
        barcode: validatedData.barcode || null,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        _count: {
          select: {
            incomingOrderItems: true,
            outgoingOrderItems: true,
            inventoryLogs: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating item:", error);
    return NextResponse.json({ error: "خطأ في إنشاء المنتج" }, { status: 500 });
  }
}
