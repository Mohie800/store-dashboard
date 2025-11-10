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

// PUT - Update supplier
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
    const validatedData = SupplierSchema.parse(body);

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
    }

    // Check if another supplier with same name exists (excluding current one)
    const duplicateSupplier = await prisma.supplier.findFirst({
      where: {
        nameAr: validatedData.nameAr,
        NOT: { id },
      },
    });

    if (duplicateSupplier) {
      return NextResponse.json(
        { error: "مورد بهذا الاسم موجود بالفعل" },
        { status: 400 }
      );
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: "خطأ في تحديث المورد" }, { status: 500 });
  }
}

// DELETE - Delete supplier
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

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { incomingOrders: true },
        },
      },
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
    }

    // Check if supplier has orders
    if (existingSupplier._count.incomingOrders > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف مورد لديه طلبيات مسجلة" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const deletedSupplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "تم حذف المورد بنجاح",
      supplier: deletedSupplier,
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ error: "خطأ في حذف المورد" }, { status: 500 });
  }
}

// GET - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        incomingOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { incomingOrders: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع بيانات المورد" },
      { status: 500 }
    );
  }
}
