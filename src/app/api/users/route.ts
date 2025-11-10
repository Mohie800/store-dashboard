import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DEFAULT_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const PERMISSION_KEYS = Object.values(PERMISSIONS) as Array<
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
>;

const PermissionsSchema = z
  .record(z.string(), z.boolean())
  .superRefine((value, ctx) => {
    for (const key of Object.keys(value)) {
      if (!PERMISSION_KEYS.includes(key as (typeof PERMISSION_KEYS)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `صلاحية غير معروفة: ${key}`,
          path: [key],
        });
      }
    }
  })
  .optional();

const CreateUserSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  role: z.nativeEnum(Role),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
  isActive: z.boolean().optional().default(true),
  permissions: PermissionsSchema,
});

function buildPermissions(
  role: Role,
  input?: Record<string, boolean>
): Record<string, boolean> {
  const base =
    input && Object.keys(input).length > 0
      ? input
      : DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS];

  const normalized: Record<string, boolean> = {};
  for (const key of PERMISSION_KEYS) {
    normalized[key] = base?.[key] ?? false;
  }
  return normalized;
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const canManageUsers =
    session.user.role === "ADMIN" ||
    session.user.permissions?.[PERMISSIONS.USERS] === true;

  if (!canManageUsers) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users", error);
    return NextResponse.json(
      { error: "تعذر تحميل قائمة المستخدمين" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const canManageUsers =
    session.user.role === "ADMIN" ||
    session.user.permissions?.[PERMISSIONS.USERS] === true;

  if (!canManageUsers) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = CreateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);
    const permissions = buildPermissions(
      parsed.role,
      parsed.permissions ?? undefined
    );

    const user = await prisma.user.create({
      data: {
        name: parsed.name.trim(),
        email: parsed.email.toLowerCase(),
        role: parsed.role,
        password: hashedPassword,
        permissions,
        isActive: parsed.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating user", error);
    return NextResponse.json({ error: "تعذر إنشاء المستخدم" }, { status: 500 });
  }
}
