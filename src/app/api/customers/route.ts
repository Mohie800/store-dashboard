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

// GET - Fetch all customers
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { outgoingOrders: true },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "خطأ في استرجاع البيانات" },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CustomerSchema.parse(body);

    // Check if customer with same name already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        nameAr: validatedData.nameAr,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "عميل بهذا الاسم موجود بالفعل" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "خطأ في إنشاء العميل" }, { status: 500 });
  }
}
