"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Modal,
  ModalClose,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Typography,
  Box,
  Stack,
  IconButton,
  Chip,
  Select,
  Option,
} from "@mui/joy";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  BadgeCheck,
  ArchiveX,
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  nameAr: string;
  nameEn?: string;
}

interface Item {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  sku: string;
  barcode?: string;
  unit: string;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  category: Category;
  _count: {
    incomingOrderItems: number;
    outgoingOrderItems: number;
    inventoryLogs: number;
  };
}

interface ItemFormData {
  nameAr: string;
  nameEn: string;
  description: string;
  sku: string;
  barcode: string;
  unit: string;
  minStock: number;
  categoryId: string;
}

const glassCardBaseSx = {
  backdropFilter: "blur(18px)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(241,245,249,0.58))",
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.3)",
  boxShadow: "0 35px 90px -50px rgba(59,130,246,0.45)",
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
  backgroundColor: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(148,163,184,0.35)",
  transition: "all 0.2s ease",
  minHeight: 48,
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

const iconButtonBaseSx = {
  borderRadius: 16,
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(148,163,184,0.3)",
  backgroundColor: "rgba(255,255,255,0.8)",
  color: "#0f172a",
  transition: "all 0.2s ease",
  minWidth: 0,
  "&:hover": {
    backgroundColor: "rgba(226,232,240,0.9)",
    borderColor: "rgba(59,130,246,0.45)",
    boxShadow: "0 20px 45px -28px rgba(59,130,246,0.45)",
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
  p: { xs: 1.5, md: 2.5 },
  overflow: "hidden",
} as const;

const tableWrapperSx = {
  mt: 2,
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.28)",
  backgroundColor: "rgba(255,255,255,0.62)",
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
  backgroundColor: "rgba(248,250,252,0.88)",
  "&:hover": {
    backgroundColor: "rgba(226,232,240,0.5)",
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

// Move ItemModal outside ItemsPage
function ItemModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  handleSubmit,
  isEditModalOpen,
  submitting,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  handleSubmit: (e: React.FormEvent) => void;
  isEditModalOpen: boolean;
  submitting: boolean;
  categories: Category[];
}) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalDialog
        sx={{
          ...glassModalSx,
          width: { xs: "94vw", sm: 520 },
          maxHeight: "90vh",
          overflow: "auto",
          direction: "rtl",
          p: { xs: 2.5, md: 3.5 },
        }}
      >
        <ModalClose />
        <DialogTitle
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
            fontSize: 22,
            fontWeight: 700,
            pr: 1,
            textAlign: "right",
            color: "#0f172a",
          }}
        >
          {title}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <FormControl required>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "#0f172a",
                  }}
                >
                  اسم المنتج بالعربية *
                </FormLabel>
                <Input
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  sx={inputBaseSx}
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "#0f172a",
                  }}
                >
                  اسم المنتج بالإنجليزية
                </FormLabel>
                <Input
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                  sx={{ ...inputBaseSx, direction: "ltr", textAlign: "left" }}
                />
              </FormControl>

              <FormControl required>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "#0f172a",
                  }}
                >
                  التصنيف *
                </FormLabel>
                <Select
                  value={formData.categoryId}
                  onChange={(_, value) =>
                    setFormData({ ...formData, categoryId: value as string })
                  }
                  placeholder="اختر التصنيف"
                  sx={selectBaseSx}
                  slotProps={{
                    listbox: {
                      sx: selectListboxSx,
                    },
                  }}
                  required
                >
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.nameAr}
                    </Option>
                  ))}
                </Select>
              </FormControl>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                gap={2}
              >
                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    رمز المنتج (SKU) *
                  </FormLabel>
                  <Input
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="مثال: ITM-001"
                    sx={{ ...inputBaseSx, direction: "ltr", textAlign: "left" }}
                    required
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    الباركود
                  </FormLabel>
                  <Input
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="مثال: 123456789"
                    sx={{ ...inputBaseSx, direction: "ltr", textAlign: "left" }}
                  />
                </FormControl>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                gap={2}
              >
                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    وحدة القياس *
                  </FormLabel>
                  <Input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    placeholder="مثال: قطعة، كيلو، لتر"
                    sx={inputBaseSx}
                    required
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    الحد الأدنى للمخزون
                  </FormLabel>
                  <Input
                    type="number"
                    slotProps={{
                      input: {
                        min: 0,
                        dir: "rtl",
                      },
                    }}
                    value={formData.minStock}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === "" ? 0 : parseInt(value, 10);
                      setFormData({
                        ...formData,
                        minStock: Number.isNaN(numValue) ? 0 : numValue,
                      });
                    }}
                    sx={inputBaseSx}
                  />
                </FormControl>
              </Stack>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "#0f172a",
                  }}
                >
                  الوصف
                </FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  minRows={3}
                  sx={textareaBaseSx}
                />
              </FormControl>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                pt={1}
                gap={2}
              >
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  sx={{ ...primaryButtonSx, flex: 1 }}
                >
                  {submitting
                    ? "جاري المعالجة..."
                    : isEditModalOpen
                    ? "تحديث"
                    : "إضافة"}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onClose}
                  disabled={submitting}
                  sx={{ ...secondaryButtonSx, flex: 1 }}
                >
                  إلغاء
                </Button>
              </Stack>
            </Stack>
          </form>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState<ItemFormData>({
    nameAr: "",
    nameEn: "",
    description: "",
    sku: "",
    barcode: "",
    unit: "",
    minStock: 0,
    categoryId: "",
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/items");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.filter((cat: any) => cat.isActive));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.nameAr.trim()) {
      errors.push("اسم المنتج بالعربية مطلوب");
    }

    if (!formData.sku.trim()) {
      errors.push("رمز المنتج مطلوب");
    }

    if (!formData.unit.trim()) {
      errors.push("وحدة القياس مطلوبة");
    }

    if (!formData.categoryId) {
      errors.push("التصنيف مطلوب");
    }

    if (formData.minStock < 0) {
      errors.push("الحد الأدنى للمخزون يجب أن يكون صفر أو أكثر");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Client-side validation
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast.error(`أخطاء في البيانات:\n${validationErrors.join("\n")}`);
        return;
      }

      // Clean and prepare data
      const cleanedData = {
        ...formData,
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim() || undefined,
        description: formData.description.trim() || undefined,
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        unit: formData.unit.trim(),
        minStock: Math.max(0, formData.minStock),
      };

      const url = isEditModalOpen
        ? `/api/items/${selectedItem?.id}`
        : "/api/items";
      const method = isEditModalOpen ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        await fetchItems();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        toast.success(
          isEditModalOpen
            ? "تم تحديث بيانات المنتج بنجاح"
            : "تم إضافة المنتج بنجاح"
        );
      } else {
        const errorData = await response.json().catch(() => ({}));

        // Handle validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((detail: any) => {
              const field = detail.path?.[0];
              const message = detail.message;

              // Map field names to Arabic
              const fieldNames: { [key: string]: string } = {
                nameAr: "اسم المنتج بالعربية",
                nameEn: "اسم المنتج بالإنجليزية",
                sku: "رمز المنتج",
                barcode: "الباركود",
                unit: "وحدة القياس",
                minStock: "الحد الأدنى للمخزون",
                categoryId: "التصنيف",
                description: "الوصف",
              };

              const arabicField = fieldNames[field] || field;
              return `${arabicField}: ${message}`;
            })
            .join("\n");

          toast.error(`أخطاء في البيانات:\n${validationErrors}`);
          return;
        }

        const errorMessage =
          errorData.error ||
          errorData.message ||
          `خطأ في ${isEditModalOpen ? "تحديث" : "إضافة"} المنتج`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      nameAr: item.nameAr,
      nameEn: item.nameEn || "",
      description: item.description || "",
      sku: item.sku,
      barcode: item.barcode || "",
      unit: item.unit,
      minStock: item.minStock,
      categoryId: item.category.id,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/items/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchItems();
        toast.success("تم حذف المنتج بنجاح");
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطأ في حذف المنتج");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ في حذف المنتج";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nameAr: "",
      nameEn: "",
      description: "",
      sku: "",
      barcode: "",
      unit: "",
      minStock: 0,
      categoryId: "",
    });
    setSelectedItem(null);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || item.category.id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalItems = items.length;
  const activeItems = items.filter((item) => item.isActive).length;
  const inactiveItems = totalItems - activeItems;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-28 right-12 h-64 w-64 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute -bottom-32 left-16 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-sky-300/10 blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-6 lg:space-y-8">
        <div className="glass-surface-dark glass-highlight rounded-3xl border border-white/15 p-4 text-white shadow-[0_40px_95px_-55px_rgba(14,165,233,0.35)] sm:p-6 lg:p-8">
          <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-right">
              <Typography
                level="h1"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontSize: { xs: "1.75rem", lg: "2rem" },
                  color: "#f8fafc",
                }}
              >
                إدارة المنتجات
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "rgba(255,255,255,0.82)",
                  mt: 1,
                }}
              >
                إضافة وتنظيم منتجات المتجر ومتابعة حالتها
              </Typography>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              startDecorator={<Plus size={18} />}
              sx={{
                ...primaryButtonSx,
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 3.2,
                py: 1.35,
              }}
            >
              إضافة منتج جديد
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.28), rgba(14,165,233,0.16))",
              }}
            >
              <Package size={26} style={{ color: "#2563eb" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="body-sm"
                sx={{
                  color: "rgba(15,23,42,0.7)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                إجمالي المنتجات
              </Typography>
              <Typography
                level="h2"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              >
                {totalItems}
              </Typography>
            </Box>
          </Card>

          <Card className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.28), rgba(74,222,128,0.18))",
              }}
            >
              <BadgeCheck size={26} style={{ color: "#16a34a" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="body-sm"
                sx={{
                  color: "rgba(15,23,42,0.7)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                منتجات نشطة
              </Typography>
              <Typography
                level="h2"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#14532d",
                  fontWeight: 700,
                }}
              >
                {activeItems}
              </Typography>
            </Box>
          </Card>

          <Card className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(248,113,113,0.3), rgba(249,115,22,0.18))",
              }}
            >
              <ArchiveX size={26} style={{ color: "#dc2626" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography
                level="body-sm"
                sx={{
                  color: "rgba(15,23,42,0.7)",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                منتجات غير نشطة
              </Typography>
              <Typography
                level="h2"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#b91c1c",
                  fontWeight: 700,
                }}
              >
                {inactiveItems}
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
            gap={2}
          >
            <Input
              placeholder="البحث عن المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startDecorator={<Search size={18} />}
              sx={{
                ...inputBaseSx,
                minWidth: { xs: "100%", md: 260 },
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.82)",
              }}
            />

            <Select
              placeholder="جميع التصنيفات"
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
              <Option value="">جميع التصنيفات</Option>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.nameAr}
                </Option>
              ))}
            </Select>
          </Stack>
        </Card>

        <Card className="glass-highlight" sx={tableCardSx}>
          <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 2.5 } }}>
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
                  border: "3px solid rgba(148,163,184,0.32)",
                  borderTopColor: "rgba(59,130,246,0.85)",
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
                  minWidth: 980,
                  direction: "rtl",
                  textAlign: "center",
                  "& thead th": {
                    ...tableHeaderCellSx,
                    textAlign: "center",
                  },
                  "& thead th:nth-of-type(-n+3)": {
                    textAlign: "right",
                  },
                  "& tbody tr": tableRowSx,
                  "& tbody td": {
                    textAlign: "center",
                    verticalAlign: "middle",
                  },
                  "& tbody td:nth-of-type(-n+3)": {
                    textAlign: "right",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>اسم المنتج</th>
                    <th>رمز المنتج</th>
                    <th>التصنيف</th>
                    <th>وحدة القياس</th>
                    <th>الحد الأدنى</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Box>
                          <Typography
                            level="body-sm"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            {item.nameAr}
                          </Typography>
                          {item.nameEn && (
                            <Typography
                              level="body-xs"
                              sx={{ color: "rgba(15,23,42,0.58)", mt: 0.5 }}
                            >
                              {item.nameEn}
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {item.sku}
                          </Typography>
                          {item.barcode && (
                            <Typography
                              level="body-xs"
                              sx={{ color: "rgba(15,23,42,0.55)", mt: 0.35 }}
                            >
                              {item.barcode}
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color="primary"
                          sx={{ ...chipBaseSx, fontSize: 12 }}
                        >
                          {item.category.nameAr}
                        </Chip>
                      </td>
                      <td>
                        <Typography
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                          }}
                        >
                          {item.unit}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {item.minStock}
                        </Typography>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={item.isActive ? "success" : "danger"}
                          sx={chipBaseSx}
                        >
                          {item.isActive ? "نشط" : "غير نشط"}
                        </Chip>
                      </td>
                      <td>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          gap={1}
                        >
                          <IconButton
                            size="sm"
                            onClick={() => handleEdit(item)}
                            sx={{ ...iconButtonBaseSx, width: 38, height: 38 }}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            sx={{
                              ...iconButtonBaseSx,
                              width: 38,
                              height: 38,
                              color: "#b91c1c",
                              borderColor: "rgba(248,113,113,0.45)",
                              "&:hover": {
                                backgroundColor: "rgba(248,113,113,0.22)",
                                borderColor: "rgba(239,68,68,0.55)",
                              },
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>
          )}
        </Card>
      </div>

      <ItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="إضافة منتج جديد"
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditModalOpen={isEditModalOpen}
        submitting={submitting}
        categories={categories}
      />

      <ItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="تعديل المنتج"
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditModalOpen={isEditModalOpen}
        submitting={submitting}
        categories={categories}
      />

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalDialog
          role="alertdialog"
          sx={{
            ...glassModalSx,
            width: { xs: "92vw", sm: 440 },
            direction: "rtl",
            p: { xs: 2.5, md: 3 },
          }}
        >
          <ModalClose />
          <DialogTitle
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              textAlign: "center",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            تأكيد الحذف
          </DialogTitle>
          <DialogContent sx={{ pt: 1.5 }}>
            <Typography
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                mb: 2,
                color: "#0f172a",
              }}
            >
              هل أنت متأكد من حذف المنتج &quot;{selectedItem?.nameAr}&quot;؟
            </Typography>
            {selectedItem &&
              selectedItem._count.incomingOrderItems +
                selectedItem._count.outgoingOrderItems +
                selectedItem._count.inventoryLogs >
                0 && (
                <Typography
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "#f59e0b",
                    fontSize: 14,
                  }}
                >
                  تحذير: هذا المنتج مرتبط بـ{" "}
                  {(selectedItem?._count.incomingOrderItems || 0) +
                    (selectedItem?._count.outgoingOrderItems || 0) +
                    (selectedItem?._count.inventoryLogs || 0)}{" "}
                  معاملة. يجب حذف المعاملات المرتبطة قبل الحذف.
                </Typography>
              )}
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="flex-end"
              pt={3}
              gap={1}
            >
              <Button
                onClick={handleDeleteConfirm}
                disabled={
                  deleting ||
                  (selectedItem
                    ? selectedItem._count.incomingOrderItems +
                        selectedItem._count.outgoingOrderItems +
                        selectedItem._count.inventoryLogs >
                      0
                    : false)
                }
                loading={deleting}
                sx={{
                  ...secondaryButtonSx,
                  background:
                    "linear-gradient(135deg, rgba(248,113,113,0.92), rgba(240,82,82,0.82))",
                  color: "#fff",
                  border: "none",
                  px: 3,
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.88))",
                  },
                }}
              >
                {deleting ? "جاري الحذف..." : "حذف"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                sx={{ ...secondaryButtonSx, px: 3 }}
              >
                إلغاء
              </Button>
            </Stack>
          </DialogContent>
        </ModalDialog>
      </Modal>
    </div>
  );
}
