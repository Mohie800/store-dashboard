import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema
const SupplierSchema = z.object({
  nameAr: z.string().min(1, "اسم المورد بالعربية مطلوب"),
  nameEn: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
});

// GET - Fetch all suppliers
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { incomingOrders: true },
        },
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع البيانات" },
      { status: 500 }
    );
  }
}

// POST - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = SupplierSchema.parse(body);

    // Check if supplier with same name already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        nameAr: validatedData.nameAr,
      },
    });

    if (existingSupplier) {
      return NextResponse.json(
        { error: "مورد بهذا الاسم موجود بالفعل" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "خطأ في إنشاء المورد" }, { status: 500 });
  }
}
