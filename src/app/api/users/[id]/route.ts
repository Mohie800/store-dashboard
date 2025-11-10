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

const UpdateUserSchema = z
  .object({
    name: z.string().min(1, "الاسم مطلوب").optional(),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
    role: z.nativeEnum(Role).optional(),
    password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف").optional(),
    isActive: z.boolean().optional(),
    permissions: PermissionsSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "لا توجد بيانات للتحديث",
  });

function normalizePermissions(source: unknown): Record<string, boolean> {
  const normalized: Record<string, boolean> = {};
  const input = (source as Record<string, unknown>) || {};

  for (const key of PERMISSION_KEYS) {
    const rawValue = input?.[key];
    normalized[key] = rawValue === true;
  }

  return normalized;
}

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

async function ensureCanManageUsers() {
  const session = await auth();
  if (!session) {
    return {
      status: 401 as const,
      response: NextResponse.json({ error: "غير مصرح" }, { status: 401 }),
    };
  }

  const canManageUsers =
    session.user.role === "ADMIN" ||
    session.user.permissions?.[PERMISSIONS.USERS] === true;

  if (!canManageUsers) {
    return {
      status: 403 as const,
      response: NextResponse.json({ error: "غير مصرح" }, { status: 403 }),
    };
  }

  return { status: 200 as const, session };
}

async function isLastActiveAdmin(userId: string) {
  const otherActiveAdmins = await prisma.user.count({
    where: {
      role: "ADMIN",
      isActive: true,
      NOT: { id: userId },
    },
  });

  return otherActiveAdmins === 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { status, response } = await ensureCanManageUsers();
  if (status !== 200) {
    return response;
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user", error);
    return NextResponse.json(
      { error: "تعذر استرجاع بيانات المستخدم" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { status, response } = await ensureCanManageUsers();
  if (status !== 200) {
    return response;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = UpdateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.name !== undefined) {
      updateData.name = parsed.name.trim();
    }

    if (parsed.email !== undefined) {
      const normalizedEmail = parsed.email.toLowerCase();
      if (normalizedEmail !== existingUser.email) {
        const emailInUse = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (emailInUse && emailInUse.id !== id) {
          return NextResponse.json(
            { error: "البريد الإلكتروني مستخدم بالفعل" },
            { status: 400 }
          );
        }
      }
      updateData.email = normalizedEmail;
    }

    if (parsed.password) {
      updateData.password = await bcrypt.hash(parsed.password, 10);
    }

    if (parsed.role) {
      updateData.role = parsed.role;
    }

    if (parsed.isActive !== undefined) {
      updateData.isActive = parsed.isActive;
    }

    const roleAfterUpdate = parsed.role ?? existingUser.role;
    const shouldApplyRoleDefaults =
      parsed.permissions === undefined && parsed.role !== undefined;

    const currentPermissions = normalizePermissions(existingUser.permissions);
    const nextPermissions = buildPermissions(
      roleAfterUpdate,
      shouldApplyRoleDefaults
        ? undefined
        : parsed.permissions ?? currentPermissions
    );
    updateData.permissions = nextPermissions;

    const removingAdminPrivileges =
      existingUser.role === "ADMIN" &&
      existingUser.isActive &&
      ((parsed.role && parsed.role !== "ADMIN") || parsed.isActive === false);

    if (removingAdminPrivileges) {
      const lastAdmin = await isLastActiveAdmin(id);
      if (lastAdmin) {
        return NextResponse.json(
          { error: "لا يمكن إلغاء تفعيل آخر مدير نشط" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صحيحة", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating user", error);
    return NextResponse.json({ error: "تعذر تحديث المستخدم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { status, response } = await ensureCanManageUsers();
  if (status !== 200) {
    return response;
  }

  const { id } = await params;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (existingUser.role === "ADMIN" && existingUser.isActive) {
      const lastAdmin = await isLastActiveAdmin(id);
      if (lastAdmin) {
        return NextResponse.json(
          { error: "لا يمكن حذف آخر مدير نشط" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
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

    return NextResponse.json({
      message: "تم تعطيل المستخدم بنجاح",
      user,
    });
  } catch (error) {
    console.error("Error deleting user", error);
    return NextResponse.json({ error: "تعذر حذف المستخدم" }, { status: 500 });
  }
}
