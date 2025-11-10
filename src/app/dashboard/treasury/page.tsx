"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  Sheet,
  Chip,
  Input,
  Select,
  Option,
  Modal,
  ModalDialog,
  ModalClose,
  FormControl,
  FormLabel,
  Textarea,
  Stack,
  Divider,
} from "@mui/joy";
import {
  Plus as Add,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate, formatCurrency } from "@/lib/utils";

interface TreasuryLog {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  amount: number;
  currentBalance: number;
  provision: string;
  description: string | null;
  createdAt: string;
  user: {
    name: string;
  };
  incomingOrder?: {
    id: string;
    orderNumber: string;
  } | null;
  outgoingOrder?: {
    id: string;
    orderNumber: string;
  } | null;
}

interface TreasurySummary {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  todayIncome: number;
  todayExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface TransactionForm {
  type: "IN" | "OUT" | "ADJUSTMENT";
  amount: number;
  provision: string;
  description: string;
}

export default function TreasuryPage() {
  const [logs, setLogs] = useState<TreasuryLog[]>([]);
  const [summary, setSummary] = useState<TreasurySummary>({
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    todayIncome: 0,
    todayExpenses: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsRefreshKey, setLogsRefreshKey] = useState(0);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>({
    type: "IN",
    amount: 0,
    provision: "",
    description: "",
  });

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/treasury/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }
      const summaryData = await response.json();
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching treasury summary:", error);
      toast.error("حدث خطأ في تحميل بيانات الملخص");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadSummary();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadSummary]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchLogs = async () => {
      setLogsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(rowsPerPage));
        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }
        if (typeFilter !== "all") {
          params.set("type", typeFilter);
        }
        if (dateFilter !== "all") {
          params.set("dateRange", dateFilter);
        }

        const response = await fetch(
          `/api/treasury/logs?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch logs");
        }

        const data = await response.json();
        setLogs(data.logs ?? []);
        setTotalLogs(data.total ?? 0);

        if (
          typeof data.page === "number" &&
          data.total > 0 &&
          data.page !== page
        ) {
          setPage(data.page);
        }

        if (typeof data.limit === "number" && data.limit !== rowsPerPage) {
          setRowsPerPage(data.limit);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Error fetching treasury logs:", error);
        toast.error("حدث خطأ في تحميل سجل المعاملات المالية");
      } finally {
        if (!controller.signal.aborted) {
          setLogsLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      controller.abort();
    };
  }, [page, rowsPerPage, searchTerm, typeFilter, dateFilter, logsRefreshKey]);

  const handleTransaction = async () => {
    try {
      if (!transactionForm.provision || transactionForm.amount <= 0) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      const response = await fetch("/api/treasury/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionForm),
      });

      if (response.ok) {
        toast.success("تم تسجيل المعاملة بنجاح");
        setShowTransactionModal(false);
        setTransactionForm({
          type: "IN",
          amount: 0,
          provision: "",
          description: "",
        });
        await loadSummary();
        if (page === 1) {
          setLogsRefreshKey((prev) => prev + 1);
        } else {
          setPage(1);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ في تسجيل المعاملة");
      }
    } catch {
      toast.error("حدث خطأ في تسجيل المعاملة");
    }
  };

  const totalPages = totalLogs === 0 ? 0 : Math.ceil(totalLogs / rowsPerPage);
  const displayPage = totalLogs === 0 ? 0 : page;
  const displayTotalPages = totalLogs === 0 ? 0 : totalPages;
  const visibleStart = totalLogs === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const visibleEnd =
    totalLogs === 0
      ? 0
      : Math.min((page - 1) * rowsPerPage + logs.length, totalLogs);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp size={16} style={{ color: "#22c55e" }} />;
      case "OUT":
        return <TrendingDown size={16} style={{ color: "#ef4444" }} />;
      default:
        return <DollarSign size={16} style={{ color: "#3b82f6" }} />;
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case "IN":
        return "دخل";
      case "OUT":
        return "خرج";
      default:
        return "تعديل";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "IN":
        return "success";
      case "OUT":
        return "danger";
      default:
        return "primary";
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography level="h2" sx={{ mb: 3, textAlign: "right" }}>
          إدارة الخزينة
        </Typography>
        <Typography>جاري التحميل...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button
          startDecorator={<Add />}
          onClick={() => setShowTransactionModal(true)}
        >
          إضافة معاملة
        </Button>
        <Typography level="h2" sx={{ textAlign: "right" }}>
          إدارة الخزينة
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Wallet size={40} style={{ color: "#3b82f6" }} />
              <Box sx={{ textAlign: "right" }}>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  الرصيد الحالي
                </Typography>
                <Typography
                  level="h3"
                  sx={{
                    color:
                      summary.currentBalance >= 0
                        ? "success.500"
                        : "danger.500",
                  }}
                >
                  {formatCurrency(summary.currentBalance)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TrendingUp size={40} style={{ color: "#22c55e" }} />
              <Box sx={{ textAlign: "right" }}>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  إجمالي الدخل
                </Typography>
                <Typography level="h3" sx={{ color: "success.500" }}>
                  {formatCurrency(summary.totalIncome)}
                </Typography>
                <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                  الشهر الحالي: {formatCurrency(summary.monthlyIncome)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TrendingDown size={40} style={{ color: "#ef4444" }} />
              <Box sx={{ textAlign: "right" }}>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  إجمالي المصروفات
                </Typography>
                <Typography level="h3" sx={{ color: "danger.500" }}>
                  {formatCurrency(summary.totalExpenses)}
                </Typography>
                <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                  الشهر الحالي: {formatCurrency(summary.monthlyExpenses)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Calendar size={40} style={{ color: "#f59e0b" }} />
              <Box sx={{ textAlign: "right" }}>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  صافي الدخل اليوم
                </Typography>
                <Typography
                  level="h3"
                  sx={{
                    color:
                      summary.todayIncome - summary.todayExpenses >= 0
                        ? "success.500"
                        : "danger.500",
                  }}
                >
                  {formatCurrency(summary.todayIncome - summary.todayExpenses)}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "flex-end",
                    mt: 1,
                  }}
                >
                  <Typography level="body-xs" sx={{ color: "success.500" }}>
                    +{formatCurrency(summary.todayIncome)}
                  </Typography>
                  <Typography level="body-xs" sx={{ color: "danger.500" }}>
                    -{formatCurrency(summary.todayExpenses)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="البحث في المعاملات..."
              startDecorator={<Search />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 250 }}
            />

            <Select
              placeholder="نوع المعاملة"
              value={typeFilter}
              onChange={(_, value) => {
                setTypeFilter(value || "all");
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            >
              <Option value="all">جميع المعاملات</Option>
              <Option value="IN">دخل</Option>
              <Option value="OUT">مصروفات</Option>
              <Option value="ADJUSTMENT">تعديل</Option>
            </Select>

            <Select
              placeholder="الفترة الزمنية"
              value={dateFilter}
              onChange={(_, value) => {
                setDateFilter(value || "all");
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            >
              <Option value="all">جميع الفترات</Option>
              <Option value="today">اليوم</Option>
              <Option value="week">هذا الأسبوع</Option>
              <Option value="month">هذا الشهر</Option>
            </Select>

            {/* <Button
              variant="outlined"
              startDecorator={<Download />}
              onClick={() => window.print()}
            >
              تصدير التقرير
            </Button> */}
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2, textAlign: "right" }}>
            سجل المعاملات المالية ({totalLogs} معاملة)
          </Typography>
          <Sheet sx={{ overflow: "auto" }}>
            <Table
              hoverRow
              sx={{
                minWidth: "1050px",
                "& thead th:nth-of-type(1)": { width: "80px" },
                "& thead th:nth-of-type(2)": { width: "80px" },
                "& thead th:nth-of-type(3)": { width: "120px" },
                "& thead th:nth-of-type(7)": { width: "80px" },
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "right" }}>التاريخ</th>
                  <th style={{ textAlign: "center" }}>النوع</th>
                  <th style={{ textAlign: "center" }}>المبلغ</th>
                  <th style={{ textAlign: "center" }}>الرصيد بعد المعاملة</th>
                  <th style={{ textAlign: "right" }}>البند</th>
                  <th style={{ textAlign: "right" }}>الوصف</th>
                  <th style={{ textAlign: "right" }}>المستخدم</th>
                  <th style={{ textAlign: "center" }}>مرتبطة بطلبية</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center" }}>
                      <Typography level="body-sm">
                        جاري تحميل البيانات...
                      </Typography>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center" }}>
                      <Typography
                        level="body-sm"
                        sx={{ color: "text.secondary" }}
                      >
                        لا توجد معاملات مطابقة للمعايير الحالية
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ textAlign: "right" }}>
                        <Box>
                          <Typography level="body-sm" fontWeight="bold">
                            {formatDate(log.createdAt)}
                          </Typography>
                          <Typography
                            level="body-xs"
                            sx={{ color: "text.secondary" }}
                          >
                            {new Date(log.createdAt).toLocaleTimeString(
                              "ar-SA"
                            )}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          color={getTransactionColor(log.type) as any}
                          size="sm"
                          startDecorator={getTransactionIcon(log.type)}
                        >
                          {getTransactionText(log.type)}
                        </Chip>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Typography
                          fontWeight="bold"
                          sx={{
                            color:
                              log.type === "IN"
                                ? "success.500"
                                : log.type === "OUT"
                                ? "danger.500"
                                : "primary.500",
                          }}
                        >
                          {log.type === "OUT" ? "-" : "+"}
                          {formatCurrency(Math.abs(log.amount))}
                        </Typography>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Typography
                          fontWeight="bold"
                          sx={{
                            color:
                              log.currentBalance >= 0
                                ? "success.500"
                                : "danger.500",
                          }}
                        >
                          {formatCurrency(log.currentBalance)}
                        </Typography>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Typography level="body-sm" fontWeight="bold">
                          {log.provision}
                        </Typography>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Typography level="body-sm">
                          {log.description || "-"}
                        </Typography>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Typography level="body-sm">{log.user.name}</Typography>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {log.incomingOrder ? (
                          <Chip color="primary" size="sm">
                            واردة: {log.incomingOrder.orderNumber}
                          </Chip>
                        ) : log.outgoingOrder ? (
                          <Chip color="warning" size="sm">
                            صادرة: {log.outgoingOrder.orderNumber}
                          </Chip>
                        ) : (
                          <Typography
                            level="body-xs"
                            sx={{ color: "text.secondary" }}
                          >
                            -
                          </Typography>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Sheet>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mt: 2,
            }}
          >
            <Typography level="body-sm" sx={{ color: "text.secondary" }}>
              {totalLogs > 0
                ? `عرض ${visibleStart}-${visibleEnd} من ${totalLogs} معاملات`
                : "لا توجد معاملات مطابقة"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography level="body-sm">صفوف لكل صفحة</Typography>
                <Select
                  size="sm"
                  value={rowsPerPage}
                  onChange={(_, value) => {
                    const newValue =
                      typeof value === "number"
                        ? value
                        : Number(value || rowsPerPage);
                    setRowsPerPage(newValue > 0 ? newValue : rowsPerPage);
                    setPage(1);
                  }}
                  sx={{ minWidth: 100 }}
                >
                  <Option value={10}>10</Option>
                  <Option value={25}>25</Option>
                  <Option value={50}>50</Option>
                </Select>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="sm"
                  disabled={page === 1 || totalLogs === 0 || logsLoading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  السابق
                </Button>
                <Typography
                  level="body-sm"
                  sx={{ minWidth: 80, textAlign: "center" }}
                >
                  صفحة {displayPage} من {displayTotalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="sm"
                  disabled={
                    totalLogs === 0 || page >= totalPages || logsLoading
                  }
                  onClick={() =>
                    setPage((prev) =>
                      totalPages === 0 ? prev : Math.min(totalPages, prev + 1)
                    )
                  }
                >
                  التالي
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <Modal
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
      >
        <ModalDialog sx={{ minWidth: 400, direction: "rtl" }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            إضافة معاملة مالية
          </Typography>

          <Stack spacing={2}>
            <FormControl>
              <FormLabel>نوع المعاملة</FormLabel>
              <Select
                value={transactionForm.type}
                onChange={(_, value) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    type: value as any,
                  }))
                }
              >
                <Option value="IN">دخل (+)</Option>
                <Option value="OUT">مصروفات (-)</Option>
                <Option value="ADJUSTMENT">تعديل الرصيد</Option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>المبلغ</FormLabel>
              <Input
                type="number"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
                placeholder="أدخل المبلغ"
                startDecorator="ج.س"
              />
            </FormControl>

            <FormControl>
              <FormLabel>البند</FormLabel>
              <Input
                value={transactionForm.provision}
                onChange={(e) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    provision: e.target.value,
                  }))
                }
                placeholder="سبب المعاملة"
              />
            </FormControl>

            <FormControl>
              <FormLabel>الوصف</FormLabel>
              <Textarea
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="وصف تفصيلي للمعاملة (اختياري)"
                minRows={3}
              />
            </FormControl>

            <Divider />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => setShowTransactionModal(false)}
              >
                إلغاء
              </Button>
              <Button onClick={handleTransaction}>حفظ المعاملة</Button>
            </Box>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
