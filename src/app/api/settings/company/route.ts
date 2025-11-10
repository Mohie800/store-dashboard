import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const CompanySettingsSchema = z.object({
  nameAr: z.string().min(1, "اسم الشركة بالعربية مطلوب"),
  nameEn: z.string().optional(),
  address: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),
  taxNumber: z.string().optional(),
  logo: z.string().optional(),
  footerText: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const settings = await prisma.companySettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!settings) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load company settings", error);
    return NextResponse.json(
      { error: "تعذر تحميل بيانات الشركة" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const canManageSettings =
      session.user.role === "ADMIN" ||
      hasPermission(session.user.permissions, PERMISSIONS.SETTINGS);

    if (!canManageSettings) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CompanySettingsSchema.parse(body);

    const normalizedData = {
      nameAr: parsed.nameAr.trim(),
      nameEn: parsed.nameEn?.trim() || null,
      address: parsed.address?.trim() || null,
      phone1: parsed.phone1?.trim() || null,
      phone2: parsed.phone2?.trim() || null,
      email: parsed.email?.trim() ? parsed.email.trim() : null,
      taxNumber: parsed.taxNumber?.trim() || null,
      logo: parsed.logo?.trim() || null,
      footerText: parsed.footerText?.trim() || null,
    };

    const existingSettings = await prisma.companySettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    const targetId = existingSettings?.id ?? "default";

    const updatedSettings = await prisma.companySettings.upsert({
      where: { id: targetId },
      update: normalizedData,
      create: {
        id: targetId,
        ...normalizedData,
      },
    });

    return NextResponse.json(updatedSettings, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Failed to update company settings", error);
    return NextResponse.json(
      { error: "تعذر تحديث بيانات الشركة" },
      { status: 500 }
    );
  }
}
