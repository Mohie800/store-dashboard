import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
    }

    const { type, amount, provision, description } = await request.json();

    // Validate input
    if (!type || !amount || !provision || amount <= 0) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة والمبلغ يجب أن يكون أكبر من صفر" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["IN", "OUT", "ADJUSTMENT"].includes(type)) {
      return NextResponse.json(
        { error: "نوع المعاملة غير صحيح" },
        { status: 400 }
      );
    }

    // Calculate current balance
    const lastLog = await prisma.treasuryLog.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    const currentBalance = lastLog ? Number(lastLog.currentBalance) : 0;

    // Calculate new balance based on transaction type
    let newBalance = currentBalance;
    if (type === "IN") {
      newBalance = currentBalance + amount;
    } else if (type === "OUT") {
      newBalance = currentBalance - amount;
    } else if (type === "ADJUSTMENT") {
      // For adjustment, the amount represents the new total balance
      newBalance = amount;
    }

    // Create treasury log
    const treasuryLog = await prisma.treasuryLog.create({
      data: {
        type,
        amount:
          type === "ADJUSTMENT"
            ? Math.abs(newBalance - currentBalance)
            : amount,
        currentBalance: newBalance,
        provision,
        description: description || null,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(treasuryLog);
  } catch (error) {
    console.error("Error creating treasury transaction:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تسجيل المعاملة المالية" },
      { status: 500 }
    );
  }
}
