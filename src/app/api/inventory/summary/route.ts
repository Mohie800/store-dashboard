import { NextResponse } from "next/server";
import { getInventorySummary } from "@/lib/inventory";

export async function GET() {
  try {
    const summary = await getInventorySummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحميل ملخص المخزون" },
      { status: 500 }
    );
  }
}
