import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for updates
const CategoryUpdateSchema = z.object({
  nameAr: z.string().min(1, "اسم التصنيف بالعربية مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});

// PUT - Update category
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
    const validatedData = CategoryUpdateSchema.parse(body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
    }

    // Check if another category with same name already exists (excluding current)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        nameAr: validatedData.nameAr,
        id: { not: id },
      },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: "تصنيف بهذا الاسم موجود بالفعل" },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "خطأ في تحديث التصنيف" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
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

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
    }

    // Check if category has items
    if (existingCategory._count.items > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف التصنيف لأنه يحتوي على ${existingCategory._count.items} منتج`,
          canDelete: false,
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "تم حذف التصنيف بنجاح" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "خطأ في حذف التصنيف" }, { status: 500 });
  }
}
