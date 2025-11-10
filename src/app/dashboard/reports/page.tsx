"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Box,
  Select,
  Option,
  Input,
  CircularProgress,
  Table,
  Chip,
} from "@mui/joy";
import { Download, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { exportReportsToPDF } from "@/lib/pdf";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { toast } from "react-hot-toast";

const glassCardBaseSx = {
  backdropFilter: "blur(18px)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(241,245,249,0.58))",
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.3)",
  boxShadow: "0 45px 110px -65px rgba(59,130,246,0.45)",
} as const;

const heroCardSx = {
  ...glassCardBaseSx,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,64,175,0.82))",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#f8fafc",
  boxShadow: "0 55px 125px -70px rgba(29,78,216,0.75)",
  p: { xs: 3, md: 4, lg: 5 },
} as const;

const controlsCardSx = {
  ...glassCardBaseSx,
  p: { xs: 3, md: 3.5 },
} as const;

const centeredStatsCardSx = {
  ...glassCardBaseSx,
  textAlign: "center" as const,
  p: { xs: 2.5, md: 3 },
} as const;

const sectionCardSx = {
  ...glassCardBaseSx,
  p: 0,
} as const;

const sectionHeaderSx = {
  px: { xs: 2.5, md: 3 },
  py: { xs: 2, md: 2.5 },
  borderBottom: "1px solid rgba(148,163,184,0.24)",
} as const;

const sectionBodySx = {
  px: { xs: 2.5, md: 3 },
  py: { xs: 2, md: 2.5 },
} as const;

const listItemBaseSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.5,
  padding: "14px 18px",
  borderRadius: 20,
  border: "1px solid rgba(148,163,184,0.25)",
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 25px 70px -55px rgba(15,23,42,0.35)",
} as const;

const inputBaseSx = {
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  direction: "rtl" as const,
  textAlign: "right" as const,
  borderRadius: 16,
  backgroundColor: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(148,163,184,0.35)",
  minHeight: 48,
  transition: "all 0.2s ease",
  "&:focus-within": {
    borderColor: "rgba(59,130,246,0.55)",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.16)",
  },
  "& input": {
    direction: "rtl" as const,
    color: "#0f172a",
  },
  "& input:focus": {
    outline: "none",
  },
} as const;

const selectBaseSx = {
  ...inputBaseSx,
  "& button": {
    direction: "rtl" as const,
    justifyContent: "space-between",
    color: "#0f172a",
  },
} as const;

const selectListboxSx = {
  ...glassCardBaseSx,
  borderRadius: 20,
  p: 1,
  boxShadow: "0 45px 110px -60px rgba(14,165,233,0.5)",
} as const;

const primaryButtonSx = {
  borderRadius: 999,
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  background:
    "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.85))",
  color: "#fff",
  boxShadow: "0 38px 85px -48px rgba(14,165,233,0.7)",
  px: 3.2,
  py: 1.2,
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(37,99,235,1), rgba(14,165,233,0.92))",
  },
} as const;

const secondaryButtonSx = {
  borderRadius: 999,
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  borderColor: "rgba(148,163,184,0.45)",
  color: "#0f172a",
  backgroundColor: "rgba(255,255,255,0.75)",
  px: 3,
  py: 1.2,
  "&:hover": {
    backgroundColor: "rgba(241,245,249,0.92)",
    borderColor: "rgba(148,163,184,0.65)",
  },
} as const;

const chipBaseSx = {
  borderRadius: 18,
  fontSize: 12,
  fontWeight: 600,
  px: 1.6,
  py: 0.6,
  backdropFilter: "blur(8px)",
} as const;

const tableWrapperSx = {
  mt: 0,
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.28)",
  backgroundColor: "rgba(255,255,255,0.62)",
  overflow: "auto",
} as const;

const tableSx = {
  minWidth: 980,
  direction: "rtl" as const,
  textAlign: "center" as const,
  "& thead th": {
    borderBottom: "1px solid rgba(148,163,184,0.32)",
    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: "#0f172a",
    // backgroundColor: "rgba(148,163,184,0.12)",
    textAlign: "center",
  },
  "& thead th:nth-of-type(-n+3)": {
    textAlign: "right",
  },
  "& tbody tr": {
    transition: "all 0.2s ease",
    backgroundColor: "rgba(248,250,252,0.92)",
    "&:hover": {
      backgroundColor: "rgba(226,232,240,0.6)",
    },
  },
  "& tbody td": {
    borderBottom: "none",
    textAlign: "center",
    verticalAlign: "middle",
    padding: "16px 14px",
    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
    color: "#0f172a",
  },
  "& tbody td:nth-of-type(-n+3)": {
    textAlign: "right",
  },
} as const;

const rankBadgeBaseSx = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  boxShadow: "0 25px 55px -35px rgba(15,23,42,0.55)",
} as const;

const emptyStateSx = {
  textAlign: "center" as const,
  color: "rgba(15,23,42,0.62)",
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  py: 5,
} as const;

const rankGradients = [
  "linear-gradient(135deg, rgba(250,204,21,0.95), rgba(249,115,22,0.85))",
  "linear-gradient(135deg, rgba(148,163,184,0.95), rgba(148,163,184,0.75))",
  "linear-gradient(135deg, rgba(248,196,113,0.95), rgba(245,158,11,0.85))",
];

const fallbackRankGradient =
  "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.85))";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [exporting, setExporting] = useState(false);
  const reportTypeLabels = {
    overview: "النظرة العامة",
    sales: "المبيعات",
    purchases: "المشتريات",
    inventory: "المخزون",
    financial: "المالي",
    customers: "العملاء",
    suppliers: "الموردين",
  } as const;
  type ReportExportType = keyof typeof reportTypeLabels;

  const buildReportUrl = (type: ReportExportType) => {
    const params = new URLSearchParams({
      type,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    });
    return `/api/reports?${params.toString()}`;
  };

  const fetchReport = async (type: ReportExportType) => {
    const response = await fetch(buildReportUrl(type));
    const data = (await response.json().catch(() => null)) as any;
    if (!response.ok || !data) {
      const serverMessage =
        (data as { error?: string })?.error ??
        `فشل تحميل تقرير ${reportTypeLabels[type]}`;
      throw new Error(serverMessage);
    }
    return data;
  };
  const { settings: companySettings, error: companySettingsError } =
    useCompanySettings();

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  useEffect(() => {
    if (companySettingsError) {
      toast.error(companySettingsError);
    }
  }, [companySettingsError]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const data = await fetchReport(reportType as ReportExportType);
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
      const message =
        error instanceof Error ? error.message : "تعذر تحميل بيانات التقرير";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: "overview", label: "نظرة عامة", icon: "📊" },
    { value: "sales", label: "تقرير المبيعات", icon: "💰" },
    { value: "purchases", label: "تقرير المشتريات", icon: "📦" },
    { value: "inventory", label: "تقرير المخزون", icon: "📋" },
    { value: "financial", label: "التقرير المالي", icon: "📈" },
    { value: "customers", label: "تقرير العملاء", icon: "👥" },
    { value: "suppliers", label: "تقرير الموردين", icon: "🏢" },
  ];

  const currentReportType = reportTypes.find(
    (type) => type.value === reportType
  );

  const salesData = Array.isArray(reportData?.salesData)
    ? (reportData?.salesData as any[])
    : null;
  const purchasesData = Array.isArray(reportData?.purchasesData)
    ? (reportData?.purchasesData as any[])
    : null;

  const financialChartData = salesData
    ? salesData.map((entry, index) => {
        const matchedEntry =
          purchasesData?.find((purchase) => purchase.label === entry.label) ??
          purchasesData?.[index];
        return {
          label: entry.label,
          revenue: entry.amount,
          expenses: matchedEntry?.amount ?? 0,
        };
      })
    : null;

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      const [
        overviewReport,
        salesReport,
        purchasesReport,
        inventoryReport,
        customersReport,
        suppliersReport,
        financialReport,
      ] = await Promise.all([
        fetchReport("overview"),
        fetchReport("sales"),
        fetchReport("purchases"),
        fetchReport("inventory"),
        fetchReport("customers"),
        fetchReport("suppliers"),
        fetchReport("financial"),
      ]);

      await exportReportsToPDF(
        {
          dateRange,
          companySettings,
          reports: {
            overview: overviewReport,
            sales: salesReport,
            purchases: purchasesReport,
            inventory: inventoryReport,
            customers: customersReport,
            suppliers: suppliersReport,
            financial: financialReport,
          },
        },
        {
          filename: `reports-${
            dateRange.startDate.toISOString().split("T")[0]
          }-${dateRange.endDate.toISOString().split("T")[0]}.pdf`,
        }
      );
      toast.success("تم تصدير التقرير الكامل");
    } catch (error) {
      console.error("Failed to export report PDF", error);
      const message =
        error instanceof Error ? error.message : "تعذر تصدير التقرير الكامل";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <CircularProgress size="lg" />
  //     </div>
  //   );
  // }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-36 right-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-20 h-80 w-80 rounded-full bg-indigo-500/16 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 bg-cyan-400/12 blur-[140px]" />
      </div>
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: { xs: 3, md: 4 },
        }}
      >
        {/* Page Header */}
        <Card sx={heroCardSx}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-end", md: "center" },
              justifyContent: "space-between",
              gap: { xs: 3, md: 4 },
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="h1"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontSize: { xs: "1.9rem", md: "2.3rem" },
                  fontWeight: 800,
                  color: "#f1f5f9",
                }}
              >
                {currentReportType?.icon} {currentReportType?.label}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(226,232,240,0.88)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  mt: 1,
                }}
              >
                من {formatDate(dateRange.startDate)} إلى{" "}
                {formatDate(dateRange.endDate)}
              </Typography>
              {companySettings && (
                <Typography
                  sx={{
                    color: "rgba(226,232,240,0.72)",
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    fontSize: 14,
                    mt: 1.5,
                  }}
                >
                  {companySettings.nameAr}
                  {companySettings.phone1
                    ? ` • هاتف: ${companySettings.phone1}`
                    : ""}
                  {companySettings.email ? ` • ${companySettings.email}` : ""}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: { xs: "flex-end", md: "flex-start" },
                gap: 1,
                direction: "rtl",
              }}
            >
              {reportTypes.map((type) => (
                <Chip
                  key={type.value}
                  variant={type.value === reportType ? "solid" : "outlined"}
                  color={type.value === reportType ? "primary" : "neutral"}
                  onClick={() => setReportType(type.value)}
                  sx={{
                    ...chipBaseSx,
                    cursor: "pointer",
                    backgroundColor:
                      type.value === reportType
                        ? "rgba(59,130,246,0.85)"
                        : "rgba(255,255,255,0.14)",
                    borderColor:
                      type.value === reportType
                        ? "transparent"
                        : "rgba(255,255,255,0.22)",
                    color: type.value === reportType ? "#fff" : "#0f172a",
                    fontSize: 13,
                  }}
                >
                  {type.icon} {type.label}
                </Chip>
              ))}
            </Box>
          </Box>
        </Card>
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <CircularProgress size="lg" />
          </div>
        ) : (
          <>
            <Card sx={controlsCardSx}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: { xs: 2.5, md: 3 },
                  alignItems: "flex-end",
                  direction: "rtl",
                }}
              >
                <Box>
                  <Typography
                    level="body-sm"
                    sx={{
                      mb: 1,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    نوع التقرير
                  </Typography>
                  <Select
                    value={reportType}
                    onChange={(_, value) => value && setReportType(value)}
                    sx={{ ...selectBaseSx, width: "100%" }}
                    slotProps={{
                      listbox: {
                        sx: selectListboxSx,
                      },
                    }}
                  >
                    {reportTypes.map((type) => (
                      <Option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </Option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Typography
                    level="body-sm"
                    sx={{
                      mb: 1,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    من تاريخ
                  </Typography>
                  <Input
                    type="date"
                    value={dateRange.startDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: new Date(e.target.value),
                      }))
                    }
                    sx={{
                      ...inputBaseSx,
                      direction: "ltr",
                      textAlign: "left",
                      minHeight: 48,
                      fontSize: 14,
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    level="body-sm"
                    sx={{
                      mb: 1,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    إلى تاريخ
                  </Typography>
                  <Input
                    type="date"
                    value={dateRange.endDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: new Date(e.target.value),
                      }))
                    }
                    sx={{
                      ...inputBaseSx,
                      direction: "ltr",
                      textAlign: "left",
                      minHeight: 48,
                      fontSize: 14,
                    }}
                  />
                </Box>

                <Box
                  data-html2canvas-ignore="true"
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    type="button"
                    onClick={fetchReportData}
                    disabled={loading}
                    startDecorator={<RefreshCw size={16} />}
                    sx={secondaryButtonSx}
                  >
                    تحديث البيانات
                  </Button>
                  <Button
                    type="button"
                    startDecorator={<Download size={16} />}
                    onClick={handleExportPdf}
                    loading={exporting}
                    disabled={exporting}
                    sx={primaryButtonSx}
                  >
                    تصدير PDF
                  </Button>
                </Box>
              </Box>
            </Card>

            {/* Report Content */}
            {!reportData ? (
              <Card
                sx={{
                  ...glassCardBaseSx,
                  textAlign: "center",
                  p: { xs: 3, md: 4 },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "rgba(15,23,42,0.68)",
                  }}
                >
                  اختر نوع التقرير والفترة الزمنية لعرض البيانات
                </Typography>
              </Card>
            ) : (
              <>
                {/* Overview Report */}
                {reportType === "overview" && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(2, minmax(0, 1fr))",
                          lg: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Box sx={{ fontSize: 36, mb: 1 }}>💰</Box>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "rgba(15,23,42,0.66)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          المبيعات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#1d4ed8",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(reportData.sales?.totalSales || 0)}
                        </Typography>
                        <Typography
                          level="body-xs"
                          sx={{
                            mt: 0.5,
                            color: "rgba(15,23,42,0.55)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {reportData.sales?.totalOrders || 0} طلبية
                        </Typography>
                      </Card>

                      <Card sx={centeredStatsCardSx}>
                        <Box sx={{ fontSize: 36, mb: 1 }}>📦</Box>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "rgba(15,23,42,0.66)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          المشتريات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#c2410c",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.purchases?.totalPurchases || 0
                          )}
                        </Typography>
                        <Typography
                          level="body-xs"
                          sx={{
                            mt: 0.5,
                            color: "rgba(15,23,42,0.55)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {reportData.purchases?.totalOrders || 0} طلبية
                        </Typography>
                      </Card>

                      <Card sx={centeredStatsCardSx}>
                        <Box sx={{ fontSize: 36, mb: 1 }}>📈</Box>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "rgba(15,23,42,0.66)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          صافي الربح
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color:
                              reportData.profit >= 0 ? "#047857" : "#b91c1c",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(reportData.profit || 0)}
                        </Typography>
                      </Card>

                      <Card sx={centeredStatsCardSx}>
                        <Box sx={{ fontSize: 36, mb: 1 }}>📋</Box>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "rgba(15,23,42,0.66)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          المخزون
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          {reportData.inventory?.totalItems || 0}
                        </Typography>
                        <Typography
                          level="body-xs"
                          sx={{
                            mt: 0.5,
                            color: "#b91c1c",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {reportData.inventory?.lowStockCount || 0} منخفض
                        </Typography>
                      </Card>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          lg: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: { xs: 3, md: 3.5 },
                      }}
                    >
                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-md"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            أهم المنتجات
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            maxHeight: 320,
                            overflow: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {reportData.topItems?.length > 0 ? (
                            reportData.topItems.map(
                              (item: any, index: number) => (
                                <Box key={index} sx={listItemBaseSx}>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{
                                        fontFamily:
                                          "var(--font-noto-sans-arabic), sans-serif",
                                        fontWeight: 600,
                                        color: "#0f172a",
                                      }}
                                    >
                                      {item.name}
                                    </Typography>
                                    <Typography
                                      level="body-xs"
                                      sx={{
                                        color: "rgba(15,23,42,0.55)",
                                        mt: 0.3,
                                      }}
                                    >
                                      {item.category}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{
                                        fontFamily:
                                          "var(--font-noto-sans-arabic), sans-serif",
                                        fontWeight: 700,
                                        color: "#1d4ed8",
                                      }}
                                    >
                                      {formatCurrency(item.revenue)}
                                    </Typography>
                                    <Typography
                                      level="body-xs"
                                      sx={{
                                        color: "rgba(15,23,42,0.55)",
                                        mt: 0.3,
                                      }}
                                    >
                                      {formatNumber(item.quantity)} قطعة
                                    </Typography>
                                  </Box>
                                </Box>
                              )
                            )
                          ) : (
                            <Typography sx={emptyStateSx}>
                              لا توجد بيانات
                            </Typography>
                          )}
                        </Box>
                      </Card>

                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-md"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            أهم العملاء
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            maxHeight: 320,
                            overflow: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {reportData.topCustomers?.length > 0 ? (
                            reportData.topCustomers.map(
                              (customer: any, index: number) => (
                                <Box key={index} sx={listItemBaseSx}>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{
                                        fontFamily:
                                          "var(--font-noto-sans-arabic), sans-serif",
                                        fontWeight: 600,
                                        color: "#0f172a",
                                      }}
                                    >
                                      {customer.name}
                                    </Typography>
                                    <Typography
                                      level="body-xs"
                                      sx={{
                                        color: "rgba(15,23,42,0.55)",
                                        mt: 0.3,
                                      }}
                                    >
                                      {customer.orders} طلبية
                                    </Typography>
                                  </Box>
                                  <Typography
                                    level="body-sm"
                                    sx={{
                                      fontFamily:
                                        "var(--font-noto-sans-arabic), sans-serif",
                                      fontWeight: 700,
                                      color: "#0369a1",
                                    }}
                                  >
                                    {formatCurrency(customer.total)}
                                  </Typography>
                                </Box>
                              )
                            )
                          ) : (
                            <Typography sx={emptyStateSx}>
                              لا توجد بيانات
                            </Typography>
                          )}
                        </Box>
                      </Card>

                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-md"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            أهم الموردين
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            maxHeight: 320,
                            overflow: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {reportData.topSuppliers?.length > 0 ? (
                            reportData.topSuppliers.map(
                              (supplier: any, index: number) => (
                                <Box key={index} sx={listItemBaseSx}>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{
                                        fontFamily:
                                          "var(--font-noto-sans-arabic), sans-serif",
                                        fontWeight: 600,
                                        color: "#0f172a",
                                      }}
                                    >
                                      {supplier.name}
                                    </Typography>
                                    <Typography
                                      level="body-xs"
                                      sx={{
                                        color: "rgba(15,23,42,0.55)",
                                        mt: 0.3,
                                      }}
                                    >
                                      {supplier.orders} طلبية
                                    </Typography>
                                  </Box>
                                  <Typography
                                    level="body-sm"
                                    sx={{
                                      fontFamily:
                                        "var(--font-noto-sans-arabic), sans-serif",
                                      fontWeight: 700,
                                      color: "#db2777",
                                    }}
                                  >
                                    {formatCurrency(supplier.total)}
                                  </Typography>
                                </Box>
                              )
                            )
                          ) : (
                            <Typography sx={emptyStateSx}>
                              لا توجد بيانات
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </Box>
                  </Box>
                )}

                {/* Sales Report */}
                {reportType === "sales" && reportData && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(2, minmax(0, 1fr))",
                          lg: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي المبيعات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#1d4ed8",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(reportData.summary?.totalSales || 0)}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          عدد الطلبيات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#0f172a",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(reportData.summary?.totalOrders || 0)}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي الخصم
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#ea580c",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.totalDiscount || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          متوسط قيمة الطلبية
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#047857",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.averageOrderValue || 0
                          )}
                        </Typography>
                      </Card>
                    </Box>

                    {reportData.chartData && (
                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-lg"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            مخطط المبيعات اليومية
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            height: { xs: 320, md: 380 },
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reportData.chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis
                                tickFormatter={(value) => formatNumber(value)}
                              />
                              <Tooltip
                                formatter={(value: number) =>
                                  formatCurrency(value)
                                }
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                name="المبيعات اليومية"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Card>
                    )}

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          lg: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: { xs: 3, md: 3.5 },
                      }}
                    >
                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-md"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            أهم العملاء
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            maxHeight: 360,
                            overflow: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.6,
                          }}
                        >
                          {reportData.topCustomers?.length > 0 ? (
                            reportData.topCustomers.map(
                              (customer: any, index: number) => (
                                <Box
                                  key={index}
                                  sx={{
                                    ...listItemBaseSx,
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                      flex: 1,
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        ...rankBadgeBaseSx,
                                        background:
                                          rankGradients[index] ||
                                          fallbackRankGradient,
                                      }}
                                    >
                                      {index + 1}
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                      <Typography
                                        level="body-sm"
                                        sx={{
                                          fontFamily:
                                            "var(--font-noto-sans-arabic), sans-serif",
                                          fontWeight: 600,
                                          color: "#0f172a",
                                        }}
                                      >
                                        {customer.name}
                                      </Typography>
                                      <Typography
                                        level="body-xs"
                                        sx={{
                                          color: "rgba(15,23,42,0.55)",
                                          mt: 0.3,
                                        }}
                                      >
                                        {customer.orders} طلبية
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Typography
                                    level="body-sm"
                                    sx={{
                                      fontFamily:
                                        "var(--font-noto-sans-arabic), sans-serif",
                                      fontWeight: 700,
                                      color: "#1d4ed8",
                                    }}
                                  >
                                    {formatCurrency(customer.total)}
                                  </Typography>
                                </Box>
                              )
                            )
                          ) : (
                            <Typography sx={emptyStateSx}>
                              لا توجد بيانات في هذه الفترة
                            </Typography>
                          )}
                        </Box>
                      </Card>

                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-md"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            أكثر المنتجات مبيعاً
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            maxHeight: 360,
                            overflow: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.6,
                          }}
                        >
                          {reportData.topItems?.length > 0 ? (
                            reportData.topItems.map(
                              (item: any, index: number) => (
                                <Box
                                  key={index}
                                  sx={{
                                    ...listItemBaseSx,
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                      flex: 1,
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        ...rankBadgeBaseSx,
                                        background:
                                          rankGradients[index] ||
                                          fallbackRankGradient,
                                      }}
                                    >
                                      {index + 1}
                                    </Box>
                                    <Box sx={{ textAlign: "right" }}>
                                      <Typography
                                        level="body-sm"
                                        sx={{
                                          fontFamily:
                                            "var(--font-noto-sans-arabic), sans-serif",
                                          fontWeight: 600,
                                          color: "#0f172a",
                                        }}
                                      >
                                        {item.name}
                                      </Typography>
                                      <Typography
                                        level="body-xs"
                                        sx={{
                                          color: "rgba(15,23,42,0.55)",
                                          mt: 0.3,
                                        }}
                                      >
                                        {item.category} •{" "}
                                        {formatNumber(item.quantity)} قطعة
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Typography
                                    level="body-sm"
                                    sx={{
                                      fontFamily:
                                        "var(--font-noto-sans-arabic), sans-serif",
                                      fontWeight: 700,
                                      color: "#047857",
                                    }}
                                  >
                                    {formatCurrency(item.revenue)}
                                  </Typography>
                                </Box>
                              )
                            )
                          ) : (
                            <Typography sx={emptyStateSx}>
                              لا توجد بيانات في هذه الفترة
                            </Typography>
                          )}
                        </Box>
                      </Card>
                    </Box>

                    {reportData.recentOrders && (
                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-lg"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            الطلبيات الأخيرة
                          </Typography>
                        </Box>
                        <Box sx={{ ...sectionBodySx, p: 0 }}>
                          <Box sx={{ ...tableWrapperSx, borderRadius: 0 }}>
                            <Table hoverRow sx={tableSx}>
                              <thead>
                                <tr>
                                  <th>رقم الطلبية</th>
                                  <th>العميل</th>
                                  <th>المبلغ</th>
                                  <th>الخصم</th>
                                  <th>التاريخ</th>
                                  <th>الحالة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.recentOrders.map((order: any) => (
                                  <tr key={order.id}>
                                    <td>{order.orderNumber}</td>
                                    <td>{order.customer}</td>
                                    <td>{formatCurrency(order.amount)}</td>
                                    <td>{formatCurrency(order.discount)}</td>
                                    <td>{formatDate(new Date(order.date))}</td>
                                    <td>
                                      <Chip
                                        size="sm"
                                        color={
                                          order.status === "COMPLETED"
                                            ? "success"
                                            : "warning"
                                        }
                                        sx={{
                                          ...chipBaseSx,
                                          color:
                                            order.status === "COMPLETED"
                                              ? "#065f46"
                                              : "#b45309",
                                        }}
                                      >
                                        {order.status === "COMPLETED"
                                          ? "مكتملة"
                                          : "معلقة"}
                                      </Chip>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Box>
                        </Box>
                      </Card>
                    )}
                  </Box>
                )}

                {/* Purchases Report */}
                {reportType === "purchases" && reportData && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي المشتريات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#ea580c",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.totalPurchases || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          عدد الطلبيات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#0f172a",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(reportData.summary?.totalOrders || 0)}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          متوسط قيمة الطلبية
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#047857",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.averageOrderValue || 0
                          )}
                        </Typography>
                      </Card>
                    </Box>

                    {reportData.chartData && (
                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-lg"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            مخطط المشتريات اليومية
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            height: { xs: 320, md: 380 },
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reportData.chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="label" />
                              <YAxis
                                tickFormatter={(value) => formatNumber(value)}
                              />
                              <Tooltip
                                formatter={(value: number) =>
                                  formatCurrency(value)
                                }
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                name="المشتريات اليومية"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Card>
                    )}

                    <Card sx={sectionCardSx}>
                      <Box sx={sectionHeaderSx}>
                        <Typography
                          level="title-lg"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          أهم الموردين
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          ...sectionBodySx,
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, minmax(0, 1fr))",
                          },
                          gap: { xs: 2.5, md: 3 },
                        }}
                      >
                        {reportData.topSuppliers?.length > 0 ? (
                          reportData.topSuppliers.map(
                            (supplier: any, index: number) => (
                              <Box
                                key={index}
                                sx={{
                                  ...listItemBaseSx,
                                  alignItems: "center",
                                  gap: 2,
                                  background: "rgba(253,230,138,0.65)",
                                  border: "1px solid rgba(245,158,11,0.35)",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    justifyContent: "flex-end",
                                    flex: 1,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      ...rankBadgeBaseSx,
                                      width: 48,
                                      height: 48,
                                      background:
                                        rankGradients[index] ||
                                        fallbackRankGradient,
                                    }}
                                  >
                                    {index + 1}
                                  </Box>
                                  <Box sx={{ textAlign: "right" }}>
                                    <Typography
                                      level="body-sm"
                                      sx={{
                                        fontFamily:
                                          "var(--font-noto-sans-arabic), sans-serif",
                                        fontWeight: 600,
                                        color: "#78350f",
                                      }}
                                    >
                                      {supplier.name}
                                    </Typography>
                                    <Typography
                                      level="body-xs"
                                      sx={{
                                        color: "rgba(120,53,15,0.7)",
                                        mt: 0.3,
                                      }}
                                    >
                                      {supplier.orders} طلبية شراء
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography
                                  level="body-sm"
                                  sx={{
                                    fontFamily:
                                      "var(--font-noto-sans-arabic), sans-serif",
                                    fontWeight: 700,
                                    color: "#b45309",
                                  }}
                                >
                                  {formatCurrency(supplier.total)}
                                </Typography>
                              </Box>
                            )
                          )
                        ) : (
                          <Typography sx={emptyStateSx}>
                            لا توجد مشتريات في هذه الفترة
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  </Box>
                )}

                {/* Inventory Report */}
                {reportType === "inventory" && reportData && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(2, minmax(0, 1fr))",
                          lg: "repeat(5, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "rgba(15,23,42,0.66)",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          إجمالي المنتجات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#1d4ed8",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(reportData.summary?.totalItems || 0)}
                        </Typography>
                      </Card>

                      <Card
                        sx={{
                          ...centeredStatsCardSx,
                          background: "rgba(22,163,74,0.12)",
                        }}
                      >
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "#15803d",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          مخزون جيد
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#15803d",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(
                            reportData.summary?.goodStockCount || 0
                          )}
                        </Typography>
                      </Card>

                      <Card
                        sx={{
                          ...centeredStatsCardSx,
                          background: "rgba(234,179,8,0.14)",
                        }}
                      >
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "#b45309",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          تحذير
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#b45309",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(
                            reportData.summary?.warningStockCount || 0
                          )}
                        </Typography>
                      </Card>

                      <Card
                        sx={{
                          ...centeredStatsCardSx,
                          background: "rgba(248,113,113,0.15)",
                        }}
                      >
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "#b91c1c",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          مخزون منخفض
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#b91c1c",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(reportData.summary?.lowStockCount || 0)}
                        </Typography>
                      </Card>

                      <Card
                        sx={{
                          ...centeredStatsCardSx,
                          background: "rgba(248,113,113,0.28)",
                        }}
                      >
                        <Typography
                          level="body-sm"
                          sx={{
                            color: "#991b1b",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          نفاد المخزون
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#991b1b",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(
                            reportData.summary?.outOfStockCount || 0
                          )}
                        </Typography>
                      </Card>
                    </Box>

                    <Card sx={sectionCardSx}>
                      <Box sx={sectionHeaderSx}>
                        <Typography
                          level="title-lg"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          حالة المخزون
                        </Typography>
                      </Box>
                      <Box sx={{ ...sectionBodySx, p: 0 }}>
                        <Box
                          sx={{
                            ...tableWrapperSx,
                            borderRadius: 0,
                            maxHeight: 600,
                          }}
                        >
                          <Table hoverRow sx={tableSx}>
                            <thead>
                              <tr>
                                <th>المنتج</th>
                                <th>التصنيف</th>
                                <th>المخزون الحالي</th>
                                <th>الحد الأدنى</th>
                                <th>الوحدة</th>
                                <th>الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.items?.map((item: any) => (
                                <tr key={item.id}>
                                  <td>{item.name}</td>
                                  <td>{item.category}</td>
                                  <td>{formatNumber(item.currentStock)}</td>
                                  <td>{formatNumber(item.minStock)}</td>
                                  <td>{item.unit}</td>
                                  <td>
                                    <Chip
                                      size="sm"
                                      color={
                                        item.status === "out_of_stock"
                                          ? "danger"
                                          : item.status === "low_stock"
                                          ? "danger"
                                          : item.status === "warning"
                                          ? "warning"
                                          : "success"
                                      }
                                      sx={{
                                        ...chipBaseSx,
                                        color:
                                          item.status === "out_of_stock"
                                            ? "#7f1d1d"
                                            : item.status === "low_stock"
                                            ? "#9f1239"
                                            : item.status === "warning"
                                            ? "#b45309"
                                            : "#065f46",
                                      }}
                                    >
                                      {item.status === "out_of_stock"
                                        ? "نفاد المخزون"
                                        : item.status === "low_stock"
                                        ? "مخزون منخفض"
                                        : item.status === "warning"
                                        ? "تحذير"
                                        : "جيد"}
                                    </Chip>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                )}

                {/* Customers Report */}
                {reportType === "customers" && reportData && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي العملاء
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#1d4ed8",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(
                            reportData.summary?.totalCustomers || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي الإيرادات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#047857",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.totalRevenue || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          متوسط قيمة الطلبية
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#db2777",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.averageOrderValue || 0
                          )}
                        </Typography>
                      </Card>
                    </Box>

                    <Card sx={sectionCardSx}>
                      <Box sx={sectionHeaderSx}>
                        <Typography
                          level="title-lg"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          تفاصيل العملاء
                        </Typography>
                      </Box>
                      <Box sx={{ ...sectionBodySx, p: 0 }}>
                        <Box sx={{ ...tableWrapperSx, borderRadius: 0 }}>
                          <Table hoverRow sx={tableSx}>
                            <thead>
                              <tr>
                                <th>العميل</th>
                                <th>النوع</th>
                                <th>إجمالي الإنفاق</th>
                                <th>عدد الطلبيات</th>
                                <th>متوسط الطلبية</th>
                                <th>آخر طلبية</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.customers?.map((customer: any) => (
                                <tr key={customer.id}>
                                  <td>
                                    <Box sx={{ textAlign: "right" }}>
                                      <Typography
                                        level="body-sm"
                                        sx={{
                                          fontFamily:
                                            "var(--font-noto-sans-arabic), sans-serif",
                                          fontWeight: 600,
                                          color: "#0f172a",
                                        }}
                                      >
                                        {customer.name}
                                      </Typography>
                                      {customer.phone && (
                                        <Typography
                                          level="body-xs"
                                          sx={{
                                            color: "rgba(15,23,42,0.55)",
                                            mt: 0.3,
                                          }}
                                        >
                                          {customer.phone}
                                        </Typography>
                                      )}
                                    </Box>
                                  </td>
                                  <td>
                                    <Chip
                                      size="sm"
                                      color={
                                        customer.customerType === "COMPANY"
                                          ? "primary"
                                          : "neutral"
                                      }
                                      sx={{
                                        ...chipBaseSx,
                                        color:
                                          customer.customerType === "COMPANY"
                                            ? "#1d4ed8"
                                            : "#475569",
                                      }}
                                    >
                                      {customer.customerType === "COMPANY"
                                        ? "شركة"
                                        : "فرد"}
                                    </Chip>
                                  </td>
                                  <td>{formatCurrency(customer.totalSpent)}</td>
                                  <td>{formatNumber(customer.ordersCount)}</td>
                                  <td>
                                    {formatCurrency(customer.averageOrderValue)}
                                  </td>
                                  <td>
                                    {customer.lastOrderDate
                                      ? formatDate(
                                          new Date(customer.lastOrderDate)
                                        )
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                )}

                {/* Suppliers Report */}
                {reportType === "suppliers" && reportData && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(3, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي الموردين
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#1d4ed8",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatNumber(
                            reportData.summary?.totalSuppliers || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي المشتريات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#ea580c",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.totalPurchases || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          متوسط قيمة الطلبية
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#047857",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.averageOrderValue || 0
                          )}
                        </Typography>
                      </Card>
                    </Box>

                    <Card sx={sectionCardSx}>
                      <Box sx={sectionHeaderSx}>
                        <Typography
                          level="title-lg"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          تفاصيل الموردين
                        </Typography>
                      </Box>
                      <Box sx={{ ...sectionBodySx, p: 0 }}>
                        <Box sx={{ ...tableWrapperSx, borderRadius: 0 }}>
                          <Table hoverRow sx={tableSx}>
                            <thead>
                              <tr>
                                <th>المورد</th>
                                <th>إجمالي المشتريات</th>
                                <th>عدد الطلبيات</th>
                                <th>متوسط الطلبية</th>
                                <th>آخر طلبية</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.suppliers?.map((supplier: any) => (
                                <tr key={supplier.id}>
                                  <td>
                                    <Box sx={{ textAlign: "right" }}>
                                      <Typography
                                        level="body-sm"
                                        sx={{
                                          fontFamily:
                                            "var(--font-noto-sans-arabic), sans-serif",
                                          fontWeight: 600,
                                          color: "#0f172a",
                                        }}
                                      >
                                        {supplier.name}
                                      </Typography>
                                      {supplier.phone && (
                                        <Typography
                                          level="body-xs"
                                          sx={{
                                            color: "rgba(15,23,42,0.55)",
                                            mt: 0.3,
                                          }}
                                        >
                                          {supplier.phone}
                                        </Typography>
                                      )}
                                    </Box>
                                  </td>
                                  <td>
                                    {formatCurrency(supplier.totalPurchased)}
                                  </td>
                                  <td>{formatNumber(supplier.ordersCount)}</td>
                                  <td>
                                    {formatCurrency(supplier.averageOrderValue)}
                                  </td>
                                  <td>
                                    {supplier.lastOrderDate
                                      ? formatDate(
                                          new Date(supplier.lastOrderDate)
                                        )
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                )}

                {/* Financial Report */}
                {reportType === "financial" && reportData && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 3, md: 4 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(1, minmax(0, 1fr))",
                          md: "repeat(2, minmax(0, 1fr))",
                          lg: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي الإيرادات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#047857",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.totalRevenue || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          إجمالي المصروفات
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#dc2626",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(
                            reportData.summary?.totalExpenses || 0
                          )}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          صافي الربح
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color:
                              (reportData.summary?.grossProfit || 0) >= 0
                                ? "#1d4ed8"
                                : "#dc2626",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(reportData.summary?.grossProfit || 0)}
                        </Typography>
                      </Card>
                      <Card sx={centeredStatsCardSx}>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "rgba(15,23,42,0.66)",
                          }}
                        >
                          هامش الربح
                        </Typography>
                        <Typography
                          level="h4"
                          sx={{
                            color: "#f59e0b",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 700,
                          }}
                        >
                          {(reportData.summary?.profitMargin || 0).toFixed(1)}%
                        </Typography>
                      </Card>
                    </Box>

                    {financialChartData && financialChartData.length > 0 && (
                      <Card sx={sectionCardSx}>
                        <Box sx={sectionHeaderSx}>
                          <Typography
                            level="title-lg"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            المقارنة المالية
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            ...sectionBodySx,
                            px: { xs: 2, md: 3 },
                            py: { xs: 2, md: 3 },
                          }}
                        >
                          <Box sx={{ height: { xs: 280, md: 360 } }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={financialChartData}>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="rgba(148,163,184,0.35)"
                                />
                                <XAxis
                                  dataKey="label"
                                  tick={{
                                    fill: "rgba(15,23,42,0.66)",
                                    fontSize: 12,
                                  }}
                                />
                                <YAxis
                                  tickFormatter={(value) => formatNumber(value)}
                                  tick={{
                                    fill: "rgba(15,23,42,0.54)",
                                    fontSize: 12,
                                  }}
                                />
                                <Tooltip
                                  formatter={(value: number, name: string) => [
                                    formatCurrency(value),
                                    name === "revenue"
                                      ? "الإيرادات"
                                      : "المصروفات",
                                  ]}
                                  contentStyle={{
                                    backgroundColor: "rgba(15,23,42,0.92)",
                                    borderRadius: 16,
                                    border: "none",
                                    color: "#f8fafc",
                                  }}
                                />
                                <Legend
                                  formatter={(value) =>
                                    value === "revenue"
                                      ? "الإيرادات"
                                      : "المصروفات"
                                  }
                                />
                                <Bar
                                  dataKey="revenue"
                                  fill="#10b981"
                                  name="الإيرادات"
                                  radius={[10, 10, 0, 0]}
                                />
                                <Bar
                                  dataKey="expenses"
                                  fill="#ef4444"
                                  name="المصروفات"
                                  radius={[10, 10, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                      </Card>
                    )}
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </div>
  );
}
