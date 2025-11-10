import React from "react";
import fontkit from "@react-pdf/fontkit";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf as createPdf,
} from "@react-pdf/renderer";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateArabic,
} from "./utils";
import type { CompanySettings } from "../types/company";
import { DEFAULT_PDF_OPTIONS, type PdfExportOptions } from "./pdfShared";

const mmToPoints = (value: number) => (value / 25.4) * 72;

let fontsRegistered = false;
let fontRegistrationPromise: Promise<void> | null = null;

const fontSources = [
  {
    url: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansArabic/NotoSansArabic-Regular.ttf",
    fontWeight: 400,
  },
  {
    url: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansArabic/NotoSansArabic-Medium.ttf",
    fontWeight: 500,
  },
  {
    url: "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansArabic/NotoSansArabic-Bold.ttf",
    fontWeight: 700,
  },
] as const;

const fontDataCache = new Map<string, string>();

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const { length } = bytes;

  for (let index = 0; index < length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
};

const loadFontAsDataUri = async (url: string) => {
  const cached = fontDataCache.get(url);
  if (cached) {
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load font from ${url} (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const dataUri = `data:font/ttf;base64,${arrayBufferToBase64(buffer)}`;
  fontDataCache.set(url, dataUri);
  return dataUri;
};

const ensureFontsRegistered = async () => {
  if (fontsRegistered) {
    return;
  }

  if (!fontRegistrationPromise) {
    fontRegistrationPromise = (async () => {
      const fonts = await Promise.all(
        fontSources.map(async ({ url, fontWeight }) => ({
          src: await loadFontAsDataUri(url),
          fontWeight,
          fontStyle: "normal" as const,
        }))
      );

      (Font.register as (options: any) => void)({
        family: "Noto Sans Arabic",
        fonts,
        fontKit: fontkit,
      });

      fontsRegistered = true;
    })()
      .catch((error) => {
        fontsRegistered = false;
        console.error("Failed to register Noto Sans Arabic fonts", error);
        throw error;
      })
      .finally(() => {
        fontRegistrationPromise = null;
      });
  }

  await fontRegistrationPromise;
};

const orderStatusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  DRAFT: "مسودة",
};

const inventoryStatusLabels: Record<string, string> = {
  good: "مستقر",
  warning: "تحذير",
  low_stock: "منخفض",
  out_of_stock: "نفاد",
};

const customerTypeLabels: Record<string, string> = {
  RETAIL: "قطاع التجزئة",
  WHOLESALE: "قطاع الجملة",
  VIP: "عميل مميز",
};

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toStringOrDash = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string" && value.trim().length === 0) {
    return "-";
  }
  return String(value);
};

const formatCurrencySafe = (value: unknown): string =>
  formatCurrency(toNumber(value));

const formatNumberSafe = (value: unknown): string =>
  formatNumber(toNumber(value));

const formatPercentSafe = (value: unknown): string => {
  const percent = toNumber(value);
  return `${percent.toFixed(2)}%`;
};

export interface ReportsPdfPayload {
  dateRange: { startDate: Date; endDate: Date };
  companySettings?: Partial<CompanySettings> | null;
  reports: {
    overview?: any;
    sales?: any;
    purchases?: any;
    inventory?: any;
    customers?: any;
    suppliers?: any;
    financial?: any;
  };
}

export async function exportReportsToPDF(
  payload: ReportsPdfPayload,
  options: PdfExportOptions = {}
) {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in the browser");
  }

  await ensureFontsRegistered();

  const resolvedOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
  const orientation = resolvedOptions.orientation ?? "portrait";
  const marginMm = resolvedOptions.margin ?? DEFAULT_PDF_OPTIONS.margin ?? 10;
  const pagePadding = mmToPoints(marginMm);

  const safeStart = new Date(payload.dateRange.startDate);
  const safeEnd = new Date(payload.dateRange.endDate);
  const periodLabel = `${formatDateArabic(safeStart)} - ${formatDateArabic(
    safeEnd
  )}`;
  const generatedAt = new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const company = payload.companySettings ?? null;
  const overview = payload.reports?.overview ?? null;
  const sales = payload.reports?.sales ?? null;
  const purchases = payload.reports?.purchases ?? null;
  const inventory = payload.reports?.inventory ?? null;
  const customers = payload.reports?.customers ?? null;
  const suppliers = payload.reports?.suppliers ?? null;
  const financial = payload.reports?.financial ?? null;

  type SummaryEntry = { label: string; value: string };
  type SummarySection = { title: string; entries: SummaryEntry[] };
  type TableSection = { title: string; headers: string[]; rows: string[][] };

  const summarySections: SummarySection[] = [];
  const tableSections: TableSection[] = [];

  if (overview) {
    summarySections.push({
      title: "ملخص النظرة العامة",
      entries: [
        {
          label: "إجمالي المبيعات",
          value: formatCurrencySafe(overview.sales?.totalSales),
        },
        {
          label: "عدد الطلبيات - مبيعات",
          value: formatNumberSafe(overview.sales?.totalOrders),
        },
        {
          label: "إجمالي المشتريات",
          value: formatCurrencySafe(overview.purchases?.totalPurchases),
        },
        {
          label: "عدد الطلبيات - مشتريات)",
          value: formatNumberSafe(overview.purchases?.totalOrders),
        },
        {
          label: "صافي الربح",
          value: formatCurrencySafe(overview.profit),
        },
        {
          label: "إجمالي المنتجات",
          value: formatNumberSafe(overview.inventory?.totalItems),
        },
        {
          label: "منتجات منخفضة",
          value: formatNumberSafe(overview.inventory?.lowStockCount),
        },
      ],
    });
  }

  if (sales?.summary) {
    summarySections.push({
      title: "ملخص المبيعات",
      entries: [
        {
          label: "إجمالي المبيعات",
          value: formatCurrencySafe(sales.summary.totalSales),
        },
        {
          label: "عدد الطلبيات",
          value: formatNumberSafe(sales.summary.totalOrders),
        },
        {
          label: "إجمالي الخصم",
          value: formatCurrencySafe(sales.summary.totalDiscount),
        },
        {
          label: "متوسط قيمة الطلبية",
          value: formatCurrencySafe(sales.summary.averageOrderValue),
        },
      ],
    });

    tableSections.push({
      title: "أهم المنتجات - المبيعات",
      headers: ["#", "المنتج", "التصنيف", "الكمية", "الإيرادات"],
      rows: asArray<any>(sales.topItems).map((item, index) => [
        String(index + 1),
        toStringOrDash(item.name),
        toStringOrDash(item.category),
        formatNumberSafe(item.quantity),
        formatCurrencySafe(item.revenue),
      ]),
    });

    tableSections.push({
      title: "أهم العملاء - المبيعات",
      headers: ["#", "العميل", "إجمالي الإنفاق", "عدد الطلبيات"],
      rows: asArray<any>(sales.topCustomers).map((customer, index) => [
        String(index + 1),
        toStringOrDash(customer.name),
        formatCurrencySafe(customer.total),
        formatNumberSafe(customer.orders),
      ]),
    });

    tableSections.push({
      title: "الطلبيات الأخيرة - المبيعات",
      headers: ["الطلب", "العميل", "التاريخ", "القيمة", "الخصم", "الحالة"],
      rows: asArray<any>(sales.recentOrders).map((order) => [
        toStringOrDash(order.orderNumber),
        toStringOrDash(order.customer),
        formatDate(order.date),
        formatCurrencySafe(order.amount),
        formatCurrencySafe(order.discount),
        orderStatusLabels[order.status as string] ??
          toStringOrDash(order.status),
      ]),
    });

    tableSections.push({
      title: "المبيعات اليومية",
      headers: ["التاريخ", "الإيرادات"],
      rows: asArray<any>(sales.chartData).map((entry) => [
        formatDate(entry.date ?? entry.label),
        formatCurrencySafe(entry.amount),
      ]),
    });
  }

  if (purchases?.summary) {
    summarySections.push({
      title: "ملخص المشتريات",
      entries: [
        {
          label: "إجمالي المشتريات",
          value: formatCurrencySafe(purchases.summary.totalPurchases),
        },
        {
          label: "عدد الطلبيات",
          value: formatNumberSafe(purchases.summary.totalOrders),
        },
        {
          label: "متوسط قيمة الطلبية",
          value: formatCurrencySafe(purchases.summary.averageOrderValue),
        },
      ],
    });

    tableSections.push({
      title: "أهم الموردين -المشتريات",
      headers: ["#", "المورد", "إجمالي المشتريات", "عدد الطلبيات"],
      rows: asArray<any>(purchases.topSuppliers).map((supplier, index) => [
        String(index + 1),
        toStringOrDash(supplier.name),
        formatCurrencySafe(supplier.total),
        formatNumberSafe(supplier.orders),
      ]),
    });

    tableSections.push({
      title: "الطلبيات الأخيرة - المشتريات",
      headers: ["الطلب", "المورد", "التاريخ", "القيمة", "الحالة"],
      rows: asArray<any>(purchases.recentOrders).map((order) => [
        toStringOrDash(order.orderNumber),
        toStringOrDash(order.supplier),
        formatDate(order.date),
        formatCurrencySafe(order.amount),
        orderStatusLabels[order.status as string] ??
          toStringOrDash(order.status),
      ]),
    });

    tableSections.push({
      title: "المشتريات اليومية",
      headers: ["التاريخ", "المصروفات"],
      rows: asArray<any>(purchases.chartData).map((entry) => [
        formatDate(entry.date ?? entry.label),
        formatCurrencySafe(entry.amount),
      ]),
    });
  }

  if (inventory?.summary) {
    summarySections.push({
      title: "ملخص المخزون",
      entries: [
        {
          label: "إجمالي المنتجات",
          value: formatNumberSafe(inventory.summary.totalItems),
        },
        {
          label: "مخزون جيد",
          value: formatNumberSafe(inventory.summary.goodStockCount),
        },
        {
          label: "تحذير",
          value: formatNumberSafe(inventory.summary.warningStockCount),
        },
        {
          label: "مخزون منخفض",
          value: formatNumberSafe(inventory.summary.lowStockCount),
        },
        {
          label: "نفاد المخزون",
          value: formatNumberSafe(inventory.summary.outOfStockCount),
        },
      ],
    });

    tableSections.push({
      title: "حالة المخزون التفصيلية",
      headers: [
        "المنتج",
        "التصنيف",
        "الكمية الحالية",
        "الحد الأدنى",
        "الوحدة",
        "الحالة",
      ],
      rows: asArray<any>(inventory.items).map((item) => [
        toStringOrDash(item.name),
        toStringOrDash(item.category),
        formatNumberSafe(item.currentStock),
        formatNumberSafe(item.minStock),
        toStringOrDash(item.unit),
        inventoryStatusLabels[item.status as string] ??
          toStringOrDash(item.status),
      ]),
    });
  }

  if (customers?.summary) {
    summarySections.push({
      title: "ملخص العملاء",
      entries: [
        {
          label: "إجمالي العملاء",
          value: formatNumberSafe(customers.summary.totalCustomers),
        },
        {
          label: "إجمالي الإيرادات",
          value: formatCurrencySafe(customers.summary.totalRevenue),
        },
        {
          label: "متوسط قيمة الطلبية",
          value: formatCurrencySafe(customers.summary.averageOrderValue),
        },
      ],
    });

    tableSections.push({
      title: "تفاصيل العملاء",
      headers: [
        "العميل",
        "الهاتف",
        "البريد",
        "النوع",
        "إجمالي الإنفاق",
        "عدد الطلبيات",
        "متوسط الطلب",
        "آخر طلب",
      ],
      rows: asArray<any>(customers.customers).map((customer) => [
        toStringOrDash(customer.name),
        toStringOrDash(customer.phone),
        toStringOrDash(customer.email),
        customerTypeLabels[customer.customerType as string] ??
          toStringOrDash(customer.customerType),
        formatCurrencySafe(customer.totalSpent),
        formatNumberSafe(customer.ordersCount),
        formatCurrencySafe(customer.averageOrderValue),
        customer.lastOrderDate ? formatDate(customer.lastOrderDate) : "-",
      ]),
    });
  }

  if (suppliers?.summary) {
    summarySections.push({
      title: "ملخص الموردين",
      entries: [
        {
          label: "إجمالي الموردين",
          value: formatNumberSafe(suppliers.summary.totalSuppliers),
        },
        {
          label: "إجمالي المشتريات",
          value: formatCurrencySafe(suppliers.summary.totalPurchases),
        },
        {
          label: "متوسط قيمة الطلبية",
          value: formatCurrencySafe(suppliers.summary.averageOrderValue),
        },
      ],
    });

    tableSections.push({
      title: "تفاصيل الموردين",
      headers: [
        "المورد",
        "الهاتف",
        "البريد",
        "إجمالي المشتريات",
        "عدد الطلبيات",
        "متوسط الطلب",
        "آخر طلب",
      ],
      rows: asArray<any>(suppliers.suppliers).map((supplier) => [
        toStringOrDash(supplier.name),
        toStringOrDash(supplier.phone),
        toStringOrDash(supplier.email),
        formatCurrencySafe(supplier.totalPurchased),
        formatNumberSafe(supplier.ordersCount),
        formatCurrencySafe(supplier.averageOrderValue),
        supplier.lastOrderDate ? formatDate(supplier.lastOrderDate) : "-",
      ]),
    });
  }

  if (financial?.summary) {
    summarySections.push({
      title: "ملخص مالي",
      entries: [
        {
          label: "إجمالي الإيرادات",
          value: formatCurrencySafe(financial.summary.totalRevenue),
        },
        {
          label: "إجمالي المصروفات",
          value: formatCurrencySafe(financial.summary.totalExpenses),
        },
        {
          label: "صافي الربح",
          value: formatCurrencySafe(financial.summary.grossProfit),
        },
        {
          label: "هامش الربح",
          value: formatPercentSafe(financial.summary.profitMargin),
        },
        {
          label: "طلبيات المبيعات",
          value: formatNumberSafe(financial.summary.salesOrders),
        },
        {
          label: "طلبيات المشتريات",
          value: formatNumberSafe(financial.summary.purchaseOrders),
        },
      ],
    });

    tableSections.push({
      title: "الإيرادات اليومية- مالي",
      headers: ["التاريخ", "الإيرادات"],
      rows: asArray<any>(financial.salesData).map((entry) => [
        formatDate(entry.date ?? entry.label),
        formatCurrencySafe(entry.amount),
      ]),
    });

    tableSections.push({
      title: "المصروفات اليومية - مالي",
      headers: ["التاريخ", "المصروفات"],
      rows: asArray<any>(financial.purchasesData).map((entry) => [
        formatDate(entry.date ?? entry.label),
        formatCurrencySafe(entry.amount),
      ]),
    });
  }

  const metaEntries = [
    { label: "الفترة المغطاة", value: periodLabel },
    company?.phone1 ? { label: "الهاتف", value: company.phone1 } : null,
    company?.email
      ? { label: "البريد الإلكتروني", value: company.email }
      : null,
    company?.taxNumber
      ? { label: "الرقم الضريبي", value: company.taxNumber }
      : null,
    company?.address ? { label: "العنوان", value: company.address } : null,
    { label: "تاريخ الإنشاء", value: generatedAt },
  ].filter((entry): entry is { label: string; value: string } =>
    Boolean(entry)
  );

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Noto Sans Arabic",
      paddingTop: pagePadding,
      paddingBottom: pagePadding,
      paddingHorizontal: pagePadding,
      backgroundColor: "#ffffff",
      fontSize: 10,
      direction: "rtl",
      lineHeight: 1.6,
    },
    header: {
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 700,
      textAlign: "center",
      color: "#0f172a",
    },
    subtitle: {
      fontSize: 12,
      textAlign: "center",
      color: "#1e293b",
      marginTop: 4,
    },
    metaRow: {
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      marginTop: 4,
    },
    metaLabel: {
      fontSize: 10,
      color: "#64748b",
    },
    metaValue: {
      fontSize: 10,
      fontWeight: 500,
      color: "#0f172a",
    },
    section: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 6,
    },
    summaryRow: {
      flexDirection: "row-reverse",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 10,
      color: "#475569",
    },
    summaryValue: {
      fontSize: 10,
      fontWeight: 600,
      color: "#0f172a",
    },
    table: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderRadius: 4,
      overflow: "hidden",
    },
    tableRow: {
      flexDirection: "row-reverse",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    tableHeaderCell: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 6,
      fontSize: 9,
      fontWeight: 700,
      backgroundColor: "#f1f5f9",
      color: "#0f172a",
      textAlign: "right",
    },
    tableCell: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 6,
      fontSize: 9,
      color: "#1f2937",
      textAlign: "right",
    },
    emptyState: {
      paddingVertical: 8,
      textAlign: "center",
      fontSize: 9,
      color: "#94a3b8",
    },
    footnote: {
      marginTop: 20,
      textAlign: "center",
      fontSize: 8,
      color: "#94a3b8",
    },
  });

  const reportDocument = (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>التقرير الشامل للفترة المحددة</Text>
          {company?.nameAr && (
            <Text style={styles.subtitle}>{company.nameAr}</Text>
          )}
          {metaEntries.map((entry) => (
            <View key={`${entry.label}-${entry.value}`} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{entry.label}</Text>
              <Text style={styles.metaValue}>{entry.value}</Text>
            </View>
          ))}
        </View>

        {summarySections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.entries.length > 0 ? (
              section.entries.map((entry) => (
                <View
                  key={`${section.title}-${entry.label}`}
                  style={styles.summaryRow}
                >
                  <Text style={styles.summaryLabel}>{entry.label}</Text>
                  <Text style={styles.summaryValue}>{entry.value}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>لا توجد بيانات متاحة</Text>
            )}
          </View>
        ))}

        {tableSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                {section.headers.map((header) => (
                  <Text key={header} style={styles.tableHeaderCell}>
                    {header}
                  </Text>
                ))}
              </View>
              {section.rows.length > 0 ? (
                section.rows.map((row, rowIndex) => {
                  const isLastRow = rowIndex === section.rows.length - 1;
                  return (
                    <View
                      key={`${section.title}-${rowIndex}`}
                      style={
                        isLastRow
                          ? [styles.tableRow, styles.tableRowLast]
                          : styles.tableRow
                      }
                    >
                      {row.map((cell, cellIndex) => (
                        <Text
                          key={`${section.title}-${rowIndex}-${cellIndex}`}
                          style={styles.tableCell}
                        >
                          {cell}
                        </Text>
                      ))}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyState}>لا توجد بيانات متاحة</Text>
              )}
            </View>
          </View>
        ))}

        <Text style={styles.footnote}>
          تم إنشاء هذا التقرير بواسطة منصة Logistigs في {generatedAt}
        </Text>
      </Page>
    </Document>
  );

  const pdfInstance = createPdf(reportDocument);
  const blob = await pdfInstance.toBlob();

  const filename =
    resolvedOptions.filename ?? DEFAULT_PDF_OPTIONS.filename ?? "report.pdf";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
