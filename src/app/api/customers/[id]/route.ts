import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema
const CustomerSchema = z.object({
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب"),
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
  customerType: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
  creditLimit: z.number().min(0).default(0),
});

// PUT - Update customer
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
    const validatedData = CustomerSchema.parse(body);

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    // Check if another customer with same name exists (excluding current one)
    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        nameAr: validatedData.nameAr,
        NOT: { id },
      },
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        { error: "عميل بهذا الاسم موجود بالفعل" },
        { status: 400 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "خطأ في تحديث العميل" }, { status: 500 });
  }
}

// DELETE - Delete customer
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

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { outgoingOrders: true },
        },
      },
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    // Check if customer has orders
    if (existingCustomer._count.outgoingOrders > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف عميل لديه طلبيات مسجلة" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false instead of hard delete
    const deletedCustomer = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "تم حذف العميل بنجاح",
      customer: deletedCustomer,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "خطأ في حذف العميل" }, { status: 500 });
  }
}

// GET - Get single customer
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        outgoingOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            finalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { outgoingOrders: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع بيانات العميل" },
      { status: 500 }
    );
  }
}
