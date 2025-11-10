import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema
const CategorySchema = z.object({
  nameAr: z.string().min(1, "اسم التصنيف بالعربية مطلوب"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
});

// GET - Fetch all categories
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع البيانات" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CategorySchema.parse(body);

    // Check if category with same name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        nameAr: validatedData.nameAr,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "تصنيف بهذا الاسم موجود بالفعل" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: validatedData,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "خطأ في إنشاء التصنيف" },
      { status: 500 }
    );
  }
}
