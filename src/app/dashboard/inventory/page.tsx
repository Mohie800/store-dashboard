"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  Table,
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
} from "@mui/joy";
import {
  Plus as Add,
  Search,
  Package as Inventory,
  TrendingUp,
  TrendingDown,
  Edit,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDateTime } from "@/lib/utils";

interface Item {
  id: string;
  nameAr: string;
  nameEn: string | null;
  sku: string;
  unit: string;
  minStock: number;
  category: {
    id: string;
    nameAr: string;
  };
  currentStock?: number;
  lastMovement?: {
    type: "IN" | "OUT" | "ADJUSTMENT";
    quantity: number;
    createdAt: string;
  };
}

interface InventoryLog {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  currentStock: number;
  provision: string;
  notes: string | null;
  createdAt: string;
  item: {
    nameAr: string;
    sku: string;
  };
  user: {
    name: string;
  };
}

interface AdjustmentForm {
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  provision: string;
  notes: string;
}

const glassCardBaseSx = {
  backdropFilter: "blur(18px)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(241,245,249,0.58))",
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.3)",
  boxShadow: "0 35px 80px -45px rgba(59,130,246,0.45)",
} as const;

const glassModalSx = {
  ...glassCardBaseSx,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(226,232,240,0.78))",
} as const;

const inputBaseSx = {
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  direction: "rtl" as const,
  textAlign: "right" as const,
  borderRadius: 16,
  backgroundColor: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(148,163,184,0.35)",
  transition: "all 0.2s ease",
  minHeight: 48,
  "&:focus-within": {
    borderColor: "rgba(59,130,246,0.55)",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.18)",
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

const textareaBaseSx = {
  ...inputBaseSx,
  minHeight: undefined,
  "& textarea": {
    direction: "rtl" as const,
    color: "#0f172a",
  },
  "& textarea:focus": {
    outline: "none",
  },
} as const;

const primaryButtonSx = {
  borderRadius: 999,
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  background:
    "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.85))",
  color: "#fff",
  boxShadow: "0 38px 85px -48px rgba(14,165,233,0.7)",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(37,99,235,1), rgba(14,165,233,0.92))",
  },
} as const;

const secondaryButtonSx = {
  borderRadius: 999,
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  borderColor: "rgba(148,163,184,0.45)",
  color: "#1e293b",
  backgroundColor: "rgba(255,255,255,0.7)",
  "&:hover": {
    backgroundColor: "rgba(241,245,249,0.92)",
    borderColor: "rgba(148,163,184,0.65)",
  },
} as const;

const statsCardSx = {
  ...glassCardBaseSx,
  display: "flex",
  alignItems: "center",
  gap: 2,
  p: { xs: 2.5, md: 3 },
} as const;

const filtersCardSx = {
  ...glassCardBaseSx,
  p: { xs: 2.5, md: 3 },
} as const;

const tableCardSx = {
  ...glassCardBaseSx,
  p: { xs: 1.5, md: 2 },
  overflow: "hidden",
} as const;

const tableWrapperSx = {
  mt: 0,
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.28)",
  backgroundColor: "rgba(255,255,255,0.6)",
  overflow: "auto",
} as const;

const tableHeaderCellSx = {
  // backgroundColor: "rgba(226,232,240,0.7)",
  borderBottom: "1px solid rgba(148,163,184,0.35)",
  color: "#0f172a",
  fontWeight: 600,
  fontSize: 14,
} as const;

const tableRowSx = {
  transition: "all 0.2s ease",
  backgroundColor: "rgba(248,250,252,0.85)",
  "&:hover": {
    backgroundColor: "rgba(226,232,240,0.48)",
  },
  "& td": {
    borderBottom: "none",
    padding: "16px 14px",
  },
} as const;

const chipBaseSx = {
  borderRadius: 18,
  fontSize: 13,
  fontWeight: 600,
  px: 1.4,
  py: 0.5,
  backdropFilter: "blur(8px)",
} as const;

const selectListboxSx = {
  ...glassCardBaseSx,
  borderRadius: 20,
  p: 1,
  boxShadow: "0 45px 110px -65px rgba(14,165,233,0.5)",
} as const;

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>({
    itemId: "",
    type: "ADJUSTMENT",
    quantity: 0,
    provision: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, logsRes, categoriesRes] = await Promise.all([
        fetch("/api/inventory/items"),
        fetch("/api/inventory/logs"),
        fetch("/api/categories"),
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    try {
      if (
        !adjustmentForm.itemId ||
        !adjustmentForm.provision ||
        adjustmentForm.quantity === 0
      ) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      const response = await fetch("/api/inventory/adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustmentForm),
      });

      if (response.ok) {
        toast.success("تم تعديل المخزون بنجاح");
        setShowAdjustmentModal(false);
        setAdjustmentForm({
          itemId: "",
          type: "ADJUSTMENT",
          quantity: 0,
          provision: "",
          notes: "",
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "حدث خطأ في تعديل المخزون");
      }
    } catch (error) {
      toast.error("حدث خطأ في تعديل المخزون");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nameEn &&
        item.nameEn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      !selectedCategory || item.category.id === selectedCategory;

    const matchesStockFilter = () => {
      const currentStock = item.currentStock || 0;
      switch (stockFilter) {
        case "low":
          return currentStock <= item.minStock;
        case "out":
          return currentStock === 0;
        case "available":
          return currentStock > 0;
        default:
          return true;
      }
    };

    return matchesSearch && matchesCategory && matchesStockFilter();
  });

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return { color: "danger" as const, text: "نفد المخزون" };
    } else if (currentStock <= minStock) {
      return { color: "warning" as const, text: "مخزون منخفض" };
    } else {
      return { color: "success" as const, text: "متوفر" };
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp size={16} style={{ color: "#22c55e" }} />;
      case "OUT":
        return <TrendingDown size={16} style={{ color: "#ef4444" }} />;
      default:
        return <Edit size={16} style={{ color: "#3b82f6" }} />;
    }
  };

  const getMovementText = (type: string) => {
    switch (type) {
      case "IN":
        return "إدخال";
      case "OUT":
        return "إخراج";
      default:
        return "تعديل";
    }
  };

  const lowStockCount = items.filter(
    (item) =>
      (item.currentStock || 0) <= item.minStock && (item.currentStock || 0) > 0
  ).length;
  const outOfStockCount = items.filter(
    (item) => (item.currentStock || 0) === 0
  ).length;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-sky-300/12 blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-6 lg:space-y-8">
        <div className="glass-surface-dark glass-highlight rounded-3xl border border-white/15 p-4 text-white shadow-[0_40px_95px_-55px_rgba(14,165,233,0.35)] sm:p-6 lg:p-8">
          <div className="flex flex-col-reverse items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-right">
              <Typography
                level="h1"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontSize: { xs: "1.75rem", lg: "2rem" },
                  color: "#f8fafc",
                }}
              >
                إدارة المخزون
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "rgba(255,255,255,0.82)",
                  mt: 1,
                }}
              >
                متابعة مستويات المخزون وتسجيل الحركات اليومية
              </Typography>
            </div>
            <Button
              startDecorator={<Add size={18} />}
              onClick={() => setShowAdjustmentModal(true)}
              sx={{
                ...primaryButtonSx,
                px: 3,
                py: 1.4,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              تعديل المخزون
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(14,165,233,0.15))",
              }}
            >
              <Inventory size={26} style={{ color: "#2563eb" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="body-sm"
                sx={{
                  color: "rgba(15,23,42,0.7)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                إجمالي الأصناف
              </Typography>
              <Typography
                level="h2"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              >
                {items.length}
              </Typography>
            </Box>
          </Card>

          <Card className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(253,224,71,0.18))",
              }}
            >
              <TrendingDown size={26} style={{ color: "#f59e0b" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="body-sm"
                sx={{
                  color: "rgba(15,23,42,0.7)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                مخزون منخفض
              </Typography>
              <Typography
                level="h2"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#f59e0b",
                  fontWeight: 700,
                }}
              >
                {lowStockCount}
              </Typography>
            </Box>
          </Card>

          <Card className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(248,113,113,0.28), rgba(248,113,113,0.18))",
              }}
            >
              <TrendingDown size={26} style={{ color: "#ef4444" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="body-sm"
                sx={{
                  color: "rgba(15,23,42,0.7)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                نفد المخزون
              </Typography>
              <Typography
                level="h2"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#ef4444",
                  fontWeight: 700,
                }}
              >
                {outOfStockCount}
              </Typography>
            </Box>
          </Card>
        </div>

        <Card className="glass-highlight" sx={filtersCardSx}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="flex-end"
          >
            <Input
              placeholder="البحث بالاسم أو الرمز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startDecorator={<Search size={18} />}
              sx={{
                ...inputBaseSx,
                minWidth: { xs: "100%", md: 260 },
                borderRadius: 999,
                pr: 1.5,
                pl: 1.5,
                backgroundColor: "rgba(255,255,255,0.78)",
              }}
            />

            <Select
              placeholder="جميع الفئات"
              value={selectedCategory}
              onChange={(_, value) => setSelectedCategory(value || "")}
              sx={{
                ...selectBaseSx,
                minWidth: { xs: "100%", md: 220 },
              }}
              slotProps={{
                listbox: {
                  sx: selectListboxSx,
                },
              }}
            >
              <Option value="">جميع الفئات</Option>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.nameAr}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="حالة المخزون"
              value={stockFilter}
              onChange={(_, value) => setStockFilter(value || "all")}
              sx={{
                ...selectBaseSx,
                minWidth: { xs: "100%", md: 180 },
              }}
              slotProps={{
                listbox: {
                  sx: selectListboxSx,
                },
              }}
            >
              <Option value="all">الكل</Option>
              <Option value="available">متوفر</Option>
              <Option value="low">مخزون منخفض</Option>
              <Option value="out">نفد المخزون</Option>
            </Select>
          </Stack>
        </Card>

        <Card className="glass-highlight" sx={{ ...tableCardSx, py: 3 }}>
          <Box sx={{ px: { xs: 2, md: 3 }, mb: 2 }}>
            <Typography
              level="h3"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                textAlign: "right",
                color: "#0f172a",
              }}
            >
              قائمة المنتجات ({filteredItems.length})
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                py: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  border: "3px solid rgba(148,163,184,0.35)",
                  borderTopColor: "rgba(14,165,233,0.85)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#334155",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                جاري تحميل بيانات المنتجات...
              </Typography>
            </Box>
          ) : filteredItems.length === 0 ? (
            <Box sx={{ py: 7 }}>
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#475569",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                لا توجد منتجات مطابقة للبحث الحالي
              </Typography>
            </Box>
          ) : (
            <Box sx={tableWrapperSx}>
              <Table
                hoverRow
                sx={{
                  minWidth: 960,
                  direction: "rtl",
                  textAlign: "center",
                  "& thead th": {
                    ...tableHeaderCellSx,
                    textAlign: "center",
                  },
                  "& thead th:first-of-type": {
                    textAlign: "right",
                  },
                  "& tbody tr": tableRowSx,
                  "& tbody td": {
                    textAlign: "center",
                    verticalAlign: "middle",
                  },
                  "& tbody td:first-of-type": {
                    textAlign: "right",
                  },
                  "& tbody td:nth-of-type(2)": {
                    textAlign: "right",
                  },
                  "& tbody td:nth-of-type(3)": {
                    textAlign: "right",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>الصنف</th>
                    <th>الفئة</th>
                    <th>الرمز</th>
                    <th>المخزون الحالي</th>
                    <th>الحد الأدنى</th>
                    <th>الوحدة</th>
                    <th>الحالة</th>
                    <th>آخر حركة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const currentStock = item.currentStock || 0;
                    const status = getStockStatus(currentStock, item.minStock);

                    return (
                      <tr key={item.id}>
                        <td>
                          <Box>
                            <Typography
                              level="body-sm"
                              sx={{
                                fontWeight: 700,
                                fontFamily:
                                  "var(--font-noto-sans-arabic), sans-serif",
                                color: "#0f172a",
                              }}
                            >
                              {item.nameAr}
                            </Typography>
                            {item.nameEn && (
                              <Typography
                                level="body-xs"
                                sx={{
                                  color: "rgba(15,23,42,0.6)",
                                  mt: 0.5,
                                }}
                              >
                                {item.nameEn}
                              </Typography>
                            )}
                          </Box>
                        </td>
                        <td>{item.category.nameAr}</td>
                        <td>{item.sku}</td>
                        <td>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: "#0f172a",
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                            }}
                          >
                            {currentStock}
                          </Typography>
                        </td>
                        <td>{item.minStock}</td>
                        <td>{item.unit}</td>
                        <td>
                          <Chip color={status.color} size="sm" sx={chipBaseSx}>
                            {status.text}
                          </Chip>
                        </td>
                        <td>
                          {item.lastMovement ? (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                                color: "#0f172a",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {getMovementIcon(item.lastMovement.type)}
                                <Typography level="body-xs">
                                  {getMovementText(item.lastMovement.type)} (
                                  {item.lastMovement.quantity})
                                </Typography>
                              </Box>
                              <Typography
                                level="body-xs"
                                sx={{ color: "rgba(15,23,42,0.55)" }}
                              >
                                {formatDateTime(item.lastMovement.createdAt)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              level="body-xs"
                              sx={{ color: "rgba(148,163,184,0.9)" }}
                            >
                              لا توجد حركات
                            </Typography>
                          )}
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outlined"
                            onClick={() => {
                              setAdjustmentForm((prev) => ({
                                ...prev,
                                itemId: item.id,
                              }));
                              setShowAdjustmentModal(true);
                            }}
                            sx={{
                              ...secondaryButtonSx,
                              px: 2.5,
                              py: 0.75,
                              borderRadius: 18,
                            }}
                          >
                            تعديل
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Box>
          )}
        </Card>

        <Card className="glass-highlight" sx={{ ...tableCardSx, py: 3 }}>
          <Box sx={{ px: { xs: 2, md: 3 }, mb: 2 }}>
            <Typography
              level="h3"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                textAlign: "right",
                color: "#0f172a",
              }}
            >
              آخر حركات المخزون
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                py: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  border: "3px solid rgba(148,163,184,0.35)",
                  borderTopColor: "rgba(56,189,248,0.85)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#334155",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                جاري تحميل سجل الحركات...
              </Typography>
            </Box>
          ) : logs.length === 0 ? (
            <Box sx={{ py: 7 }}>
              <Typography
                sx={{
                  textAlign: "center",
                  color: "#475569",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                لا توجد حركات مسجلة في الفترة الأخيرة
              </Typography>
            </Box>
          ) : (
            <Box sx={tableWrapperSx}>
              <Table
                hoverRow
                sx={{
                  minWidth: 900,
                  direction: "rtl",
                  textAlign: "center",
                  "& thead th": {
                    ...tableHeaderCellSx,
                    textAlign: "center",
                  },
                  "& thead th:nth-of-type(1)": {
                    textAlign: "right",
                  },
                  "& thead th:nth-of-type(2)": {
                    textAlign: "right",
                  },
                  "& thead th:nth-of-type(6)": {
                    textAlign: "right",
                  },
                  "& thead th:nth-of-type(7)": {
                    textAlign: "right",
                  },
                  "& thead th:nth-of-type(8)": {
                    textAlign: "right",
                  },
                  "& tbody tr": tableRowSx,
                  "& tbody td": {
                    textAlign: "center",
                    verticalAlign: "middle",
                  },
                  "& tbody td:nth-of-type(1)": {
                    textAlign: "right",
                  },
                  "& tbody td:nth-of-type(2)": {
                    textAlign: "right",
                  },
                  "& tbody td:nth-of-type(6)": {
                    textAlign: "right",
                  },
                  "& tbody td:nth-of-type(7)": {
                    textAlign: "right",
                  },
                  "& tbody td:nth-of-type(8)": {
                    textAlign: "right",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الصنف</th>
                    <th>النوع</th>
                    <th>الكمية</th>
                    <th>المخزون بعد الحركة</th>
                    <th>البند</th>
                    <th>المستخدم</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 10).map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.createdAt)}</td>
                      <td>
                        <Box>
                          <Typography
                            level="body-sm"
                            sx={{
                              fontWeight: 700,
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              color: "#0f172a",
                            }}
                          >
                            {log.item.nameAr}
                          </Typography>
                          <Typography
                            level="body-xs"
                            sx={{ color: "rgba(148,163,184,0.9)", mt: 0.25 }}
                          >
                            {log.item.sku}
                          </Typography>
                        </Box>
                      </td>
                      <td>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {getMovementIcon(log.type)}
                          <Typography level="body-sm">
                            {getMovementText(log.type)}
                          </Typography>
                        </Box>
                      </td>
                      <td>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color:
                              log.type === "IN"
                                ? "#16a34a"
                                : log.type === "OUT"
                                ? "#dc2626"
                                : "#2563eb",
                          }}
                        >
                          {log.type === "OUT" ? "-" : "+"}
                          {log.quantity}
                        </Typography>
                      </td>
                      <td>{log.currentStock}</td>
                      <td>{log.provision}</td>
                      <td>{log.user.name}</td>
                      <td>{log.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>
          )}
        </Card>
      </div>

      <Modal
        open={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
      >
        <ModalDialog
          sx={{
            ...glassModalSx,
            width: { xs: "92vw", sm: 460 },
            direction: "rtl",
            p: { xs: 2.5, md: 3 },
          }}
        >
          <ModalClose />
          <Typography
            level="h3"
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              mb: 2,
              textAlign: "right",
              color: "#0f172a",
            }}
          >
            تعديل المخزون
          </Typography>

          <Stack spacing={2.5}>
            <FormControl required>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                }}
              >
                الصنف
              </FormLabel>
              <Select
                value={adjustmentForm.itemId}
                onChange={(_, value) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    itemId: value || "",
                  }))
                }
                placeholder="اختر الصنف"
                sx={selectBaseSx}
                slotProps={{
                  listbox: {
                    sx: selectListboxSx,
                  },
                }}
              >
                {items.map((item) => (
                  <Option key={item.id} value={item.id}>
                    {item.nameAr} - {item.sku}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <FormControl required>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                }}
              >
                نوع الحركة
              </FormLabel>
              <Select
                value={adjustmentForm.type}
                onChange={(_, value) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    type: (value as AdjustmentForm["type"]) || "ADJUSTMENT",
                  }))
                }
                sx={selectBaseSx}
                slotProps={{
                  listbox: {
                    sx: selectListboxSx,
                  },
                }}
              >
                <Option value="IN">إدخال (+)</Option>
                <Option value="OUT">إخراج (-)</Option>
                <Option value="ADJUSTMENT">تعديل</Option>
              </Select>
            </FormControl>

            <FormControl required>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                }}
              >
                الكمية
              </FormLabel>
              <Input
                type="number"
                value={adjustmentForm.quantity}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value),
                  }))
                }
                placeholder="أدخل الكمية"
                sx={{
                  ...inputBaseSx,
                  direction: "rtl",
                  "& input": {
                    direction: "rtl",
                    textAlign: "center",
                  },
                }}
              />
            </FormControl>

            <FormControl required>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                }}
              >
                البند
              </FormLabel>
              <Input
                value={adjustmentForm.provision}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    provision: e.target.value,
                  }))
                }
                placeholder="سبب التعديل"
                sx={inputBaseSx}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                }}
              >
                ملاحظات إضافية
              </FormLabel>
              <Textarea
                value={adjustmentForm.notes}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="ملاحظات إضافية (اختياري)"
                minRows={2}
                sx={textareaBaseSx}
              />
            </FormControl>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => setShowAdjustmentModal(false)}
                sx={{ ...secondaryButtonSx, px: 3 }}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAdjustment}
                sx={{ ...primaryButtonSx, px: 3 }}
              >
                حفظ التعديل
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>
    </div>
  );
}
