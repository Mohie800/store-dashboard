import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for updates
const ItemUpdateSchema = z.object({
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

// PUT - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = ItemUpdateSchema.parse(body);

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    // Check if another item with same SKU already exists (excluding current)
    const duplicateItem = await prisma.item.findFirst({
      where: {
        sku: validatedData.sku,
        id: { not: id },
      },
    });

    if (duplicateItem) {
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

    const updatedItem = await prisma.item.update({
      where: { id },
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

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating item:", error);
    return NextResponse.json({ error: "خطأ في تحديث المنتج" }, { status: 500 });
  }
}

// DELETE - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            incomingOrderItems: true,
            outgoingOrderItems: true,
            inventoryLogs: true,
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    // Check if item has transactions
    const totalTransactions =
      existingItem._count.incomingOrderItems +
      existingItem._count.outgoingOrderItems +
      existingItem._count.inventoryLogs;

    if (totalTransactions > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف المنتج لأنه يحتوي على ${totalTransactions} معاملة`,
          canDelete: false,
        },
        { status: 400 }
      );
    }

    // Delete the item
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "تم حذف المنتج بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json({ error: "خطأ في حذف المنتج" }, { status: 500 });
  }
}
