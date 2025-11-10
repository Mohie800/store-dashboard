"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Box,
  Select,
  Option,
  CircularProgress,
} from "@mui/joy";
import Link from "next/link";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getRelativeTime,
} from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Types for API responses
interface DashboardStats {
  totalSales: {
    amount: number;
    change: number;
    period: string;
  };
  todayOrders: {
    count: number;
    change: number;
    yesterday: number;
  };
  treasuryBalance: {
    amount: number;
    change: number;
  };
  lowStockItems: {
    count: number;
    items: any[];
  };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  type: "incoming" | "outgoing";
  amount: number;
  status: string;
  createdAt: string;
  customerOrSupplier: string;
  user: string;
}

interface AnalyticsData {
  period: string;
  salesChart: {
    data: Array<{
      label: string;
      sales: number;
      orders: number;
    }>;
  };
  topItems: Array<{
    id: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  categoryPerformance: Array<{
    id: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
    itemsCount: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(true);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ];

  const glassCardBaseSx = {
    backdropFilter: "blur(18px)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(226,232,240,0.58))",
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,0.35)",
    boxShadow: "0 35px 75px -45px rgba(30,64,175,0.35)",
  } as const;

  const glassCardHeaderSx = {
    p: 3,
    borderBottom: "1px solid rgba(148,163,184,0.25)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(226,232,240,0.12))",
  } as const;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/recent-orders"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.orders);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(
        `/api/dashboard/analytics?period=${selectedPeriod}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const getOrderStatusStyles = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          container:
            "glass-surface glass-highlight border border-emerald-400/35 hover:border-emerald-300/55 shadow-[0_25px_65px_-50px_rgba(16,185,129,0.55)] hover:shadow-[0_35px_85px_-55px_rgba(16,185,129,0.6)]",
          dot: "bg-emerald-400",
          amount: "text-emerald-600",
          status: "text-emerald-500",
        };
      case "PENDING":
        return {
          container:
            "glass-surface glass-highlight border border-sky-400/35 hover:border-sky-300/55 shadow-[0_25px_65px_-50px_rgba(59,130,246,0.5)] hover:shadow-[0_35px_85px_-55px_rgba(59,130,246,0.55)]",
          dot: "bg-sky-400",
          amount: "text-sky-600",
          status: "text-sky-500",
        };
      default:
        return {
          container:
            "glass-surface glass-highlight border border-amber-400/35 hover:border-amber-300/55 shadow-[0_25px_65px_-50px_rgba(245,158,11,0.5)] hover:shadow-[0_35px_85px_-55px_rgba(245,158,11,0.55)]",
          dot: "bg-amber-400",
          amount: "text-amber-600",
          status: "text-amber-500",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress size="lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 right-12 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -bottom-24 left-6 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[130px]" />
      </div>
      <div className="relative z-10 space-y-6 lg:space-y-8">
        {/* Page Header */}
        <div className="glass-surface-dark glass-highlight rounded-3xl border border-white/15 p-4 sm:p-6 lg:p-8 text-white">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-arabic mb-2">
              الرئيسية
            </h1>
            <p className="text-white/80 font-arabic text-sm sm:text-base">
              مرحباً بك في نظام إدارة اللوجستيات والمخزون
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="group glass-surface glass-highlight rounded-3xl border border-slate-200/50 p-4 sm:p-6 shadow-[0_35px_75px_-50px_rgba(59,130,246,0.45)] transition-all duration-300 hover:border-sky-300/60 hover:shadow-[0_45px_95px_-55px_rgba(59,130,246,0.55)]">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/10 shadow-inner transition-colors group-hover:border-sky-300/60 group-hover:bg-sky-500/15">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div className="text-slate-500/80 text-xs sm:text-sm font-arabic">
                  هذا الشهر
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-600 font-arabic mb-2">
                إجمالي المبيعات
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 font-arabic">
                {stats ? formatCurrency(stats.totalSales.amount) : "0.00 ج.س"}
              </p>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <span
                  className={`font-arabic ${
                    stats && stats.totalSales.change >= 0
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {stats
                    ? (stats.totalSales.change >= 0 ? "+" : "") +
                      formatPercentage(stats.totalSales.change / 100, 1)
                    : "0%"}
                </span>
                <span className="text-slate-500 mr-2 font-arabic">
                  من الشهر السابق
                </span>
              </div>
            </div>
          </div>

          <div className="group glass-surface glass-highlight rounded-3xl border border-slate-200/50 p-4 sm:p-6 shadow-[0_35px_75px_-50px_rgba(34,197,94,0.4)] transition-all duration-300 hover:border-emerald-300/60 hover:shadow-[0_45px_95px_-55px_rgba(34,197,94,0.45)]">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/10 shadow-inner transition-colors group-hover:border-emerald-300/60 group-hover:bg-emerald-500/15">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <div className="text-slate-500/80 text-xs sm:text-sm font-arabic">
                  اليوم
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-600 font-arabic mb-2">
                الطلبيات اليوم
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 font-arabic">
                {stats ? formatNumber(stats.todayOrders.count) : "0"}
              </p>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <span
                  className={`font-arabic ${
                    stats && stats.todayOrders.change >= 0
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {stats
                    ? (stats.todayOrders.change >= 0 ? "+" : "") +
                      formatNumber(stats.todayOrders.change)
                    : "0"}
                </span>
                <span className="text-slate-500 mr-2 font-arabic">من أمس</span>
              </div>
            </div>
          </div>

          <div className="group glass-surface glass-highlight rounded-3xl border border-slate-200/50 p-4 sm:p-6 shadow-[0_35px_75px_-50px_rgba(245,158,11,0.4)] transition-all duration-300 hover:border-amber-300/60 hover:shadow-[0_45px_95px_-55px_rgba(245,158,11,0.45)]">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/10 shadow-inner transition-colors group-hover:border-amber-300/60 group-hover:bg-amber-500/20">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="text-slate-500/80 text-xs sm:text-sm font-arabic">
                  متاح
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-600 font-arabic mb-2">
                رصيد الخزينة
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 font-arabic">
                {stats
                  ? formatCurrency(stats.treasuryBalance.amount)
                  : "0.00 ج.س"}
              </p>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <span
                  className={`font-arabic ${
                    stats && stats.treasuryBalance.change >= 0
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {stats
                    ? (stats.treasuryBalance.change >= 0 ? "+" : "") +
                      formatPercentage(stats.treasuryBalance.change / 100, 1)
                    : "0%"}
                </span>
                <span className="text-slate-500 mr-2 font-arabic">
                  من الأسبوع السابق
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/inventory"
            className="group glass-surface glass-highlight block rounded-3xl border border-slate-200/50 p-4 sm:p-6 shadow-[0_35px_75px_-50px_rgba(248,113,113,0.4)] transition-all duration-300 hover:border-rose-300/60 hover:shadow-[0_45px_95px_-55px_rgba(248,113,113,0.45)]"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/10 shadow-inner transition-colors group-hover:border-rose-300/60 group-hover:bg-rose-500/15">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="text-slate-500/80 text-xs sm:text-sm font-arabic">
                  تحذير
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-600 font-arabic mb-2">
                نفاد المخزون
              </h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 font-arabic">
                {stats ? formatNumber(stats.lowStockItems.count) : "0"}
              </p>
              <div className="mt-2 flex items-center text-xs sm:text-sm">
                <span className="text-rose-500 font-arabic">يتطلب إجراء</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card
            className="lg:col-span-2 glass-highlight"
            sx={{
              ...glassCardBaseSx,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <Box
              sx={{
                ...glassCardHeaderSx,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  level="title-lg"
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  مبيعات المتجر
                </Typography>
                <Select
                  value={selectedPeriod}
                  onChange={(_, value) => value && setSelectedPeriod(value)}
                  size="sm"
                >
                  <Option value="day">اليوم</Option>
                  <Option value="week">الأسبوع</Option>
                  <Option value="month">الشهر</Option>
                  <Option value="year">السنة</Option>
                </Select>
              </Box>
            </Box>
            <Box
              sx={{
                p: 3,
                height: 300,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(248,250,252,0.08))",
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
              }}
            >
              {analytics?.salesChart.data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.salesChart.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "المبيعات",
                      ]}
                      labelStyle={{
                        color: "#1f2937",
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="المبيعات"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <CircularProgress />
                </div>
              )}
            </Box>
          </Card>

          {/* Top Items */}
          <Card
            className="glass-highlight"
            sx={{
              ...glassCardBaseSx,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <Box
              sx={{
                ...glassCardHeaderSx,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <Typography
                level="title-lg"
                sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
              >
                الأصناف الأكثر مبيعاً
              </Typography>
            </Box>
            <Box
              sx={{
                p: 3,
                maxHeight: 300,
                overflow: "auto",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(248,250,252,0.08))",
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
              }}
            >
              {analytics?.topItems ? (
                <div className="space-y-3">
                  {analytics.topItems.slice(0, 5).map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-white/35 bg-white/10 p-3 backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-amber-600"
                              : "bg-slate-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 font-arabic text-sm">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500 font-arabic">
                            {formatNumber(item.totalSold)} قطعة
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-800 font-arabic text-sm">
                          {formatCurrency(item.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <CircularProgress size="sm" />
                </div>
              )}
            </Box>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card
          className="glass-highlight"
          sx={{
            ...glassCardBaseSx,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <Box
            sx={{
              ...glassCardHeaderSx,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                level="title-lg"
                sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
              >
                الطلبيات الأخيرة
              </Typography>
              <Button
                variant="plain"
                size="sm"
                component={Link}
                href="/dashboard/outgoing-orders"
              >
                عرض الكل
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              p: 3,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(248,250,252,0.08))",
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            }}
          >
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const isIncoming = order.type === "incoming";
                  const statusText =
                    order.status === "COMPLETED"
                      ? "مكتملة"
                      : order.status === "PENDING"
                      ? "قيد الانتظار"
                      : "جاري التجهيز";
                  const statusStyles = getOrderStatusStyles(order.status);

                  return (
                    <div
                      key={order.id}
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 p-3 sm:p-4 rounded-3xl transition-all duration-300 ${statusStyles.container}`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${statusStyles.dot}`}
                        ></div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-800 font-arabic text-sm sm:text-base">
                            {isIncoming ? "طلبية واردة" : "طلبية صادرة"}{" "}
                            {order.orderNumber}
                          </span>
                          <div className="text-xs sm:text-sm text-slate-500 font-arabic">
                            {getRelativeTime(order.createdAt)} •{" "}
                            {order.customerOrSupplier}
                          </div>
                        </div>
                      </div>
                      <div className="text-right sm:text-left">
                        <span
                          className={`text-base sm:text-lg font-semibold font-arabic ${statusStyles.amount}`}
                        >
                          {formatCurrency(order.amount)}
                        </span>
                        <div
                          className={`text-xs sm:text-sm font-arabic ${statusStyles.status}`}
                        >
                          {statusText}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500 font-arabic">
                  لا توجد طلبيات حديثة
                </div>
              )}
            </div>
          </Box>
        </Card>

        {/* Category Performance */}
        {analytics?.categoryPerformance &&
          analytics.categoryPerformance.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Chart */}
              <Card
                className="glass-highlight"
                sx={{
                  ...glassCardBaseSx,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <Box
                  sx={{
                    ...glassCardHeaderSx,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                  }}
                >
                  <Typography
                    level="title-lg"
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    }}
                  >
                    أداء الأصناف
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 3,
                    height: 300,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(248,250,252,0.08))",
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.name} ${(entry.percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalRevenue"
                      >
                        {analytics.categoryPerformance.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Card>

              {/* Category Details */}
              <Card
                className="glass-highlight"
                sx={{
                  ...glassCardBaseSx,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                <Box
                  sx={{
                    ...glassCardHeaderSx,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                  }}
                >
                  <Typography
                    level="title-lg"
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    }}
                  >
                    تفاصيل الأصناف
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 3,
                    maxHeight: 300,
                    overflow: "auto",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(248,250,252,0.08))",
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                  }}
                >
                  <div className="space-y-3">
                    {analytics.categoryPerformance.map((category, index) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between rounded-2xl border border-white/35 bg-white/10 p-3 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          ></div>
                          <div>
                            <div className="font-medium text-slate-800 font-arabic text-sm">
                              {category.name}
                            </div>
                            <div className="text-xs text-slate-500 font-arabic">
                              {formatNumber(category.itemsCount)} منتج •{" "}
                              {formatNumber(category.totalSold)} مبيع
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-800 font-arabic text-sm">
                            {formatCurrency(category.totalRevenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Box>
              </Card>
            </div>
          )}

        {/* Quick Actions */}
        <div className="glass-surface glass-highlight rounded-3xl border border-slate-200/50 shadow-[0_40px_95px_-55px_rgba(56,189,248,0.35)]">
          <div className="relative z-10 rounded-t-3xl border-b border-white/35 bg-white/10 p-4 sm:p-6 backdrop-blur-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 font-arabic">
              إجراءات سريعة
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/dashboard/incoming-orders"
                className="group relative block rounded-3xl border border-sky-400/35 glass-surface glass-highlight p-4 sm:p-6 text-center transition-all duration-300 hover:border-sky-300/55 hover:shadow-[0_35px_85px_-55px_rgba(59,130,246,0.55)]"
              >
                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-sky-400/45 bg-sky-500/10 text-sky-600 shadow-inner transition-colors group-hover:border-sky-300/55 group-hover:bg-sky-500/15">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                    إضافة طلبية واردة
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600">
                    إضافة مشتريات جديدة
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/outgoing-orders"
                className="group relative block rounded-3xl border border-emerald-400/35 glass-surface glass-highlight p-4 sm:p-6 text-center transition-all duration-300 hover:border-emerald-300/55 hover:shadow-[0_35px_85px_-55px_rgba(34,197,94,0.55)]"
              >
                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-emerald-400/45 bg-emerald-500/10 text-emerald-600 shadow-inner transition-colors group-hover:border-emerald-300/55 group-hover:bg-emerald-500/15">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                    إضافة طلبية صادرة
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600">
                    تسجيل مبيعات جديدة
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/items"
                className="group relative block rounded-3xl border border-amber-400/35 glass-surface glass-highlight p-4 sm:p-6 text-center transition-all duration-300 hover:border-amber-300/55 hover:shadow-[0_35px_85px_-55px_rgba(245,158,11,0.55)]"
              >
                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-amber-400/45 bg-amber-500/10 text-amber-600 shadow-inner transition-colors group-hover:border-amber-300/55 group-hover:bg-amber-500/20">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                    إضافة منتج جديد
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600">
                    توسيع المخزون
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/treasury"
                className="group relative block rounded-3xl border border-purple-400/35 glass-surface glass-highlight p-4 sm:p-6 text-center transition-all duration-300 hover:border-purple-300/55 hover:shadow-[0_35px_85px_-55px_rgba(168,85,247,0.55)]"
              >
                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-purple-400/45 bg-purple-500/10 text-purple-600 shadow-inner transition-colors group-hover:border-purple-300/55 group-hover:bg-purple-500/15">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">
                    إدارة الخزينة
                  </span>
                  <span className="text-xs sm:text-sm text-slate-600">
                    معاملات مالية
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
