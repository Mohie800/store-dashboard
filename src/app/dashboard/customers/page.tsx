"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  ModalClose,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Select,
  Option,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Typography,
  Box,
  Stack,
  IconButton,
  Chip,
} from "@mui/joy";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const glassCardBaseSx = {
  backdropFilter: "blur(18px)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(241,245,249,0.58))",
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.35)",
  boxShadow: "0 35px 80px -45px rgba(59,130,246,0.45)",
} as const;

const glassModalSx = {
  ...glassCardBaseSx,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(226,232,240,0.75))",
} as const;

const inputBaseSx = {
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  direction: "rtl" as const,
  textAlign: "right" as const,
  borderRadius: 16,
  backgroundColor: "rgba(255,255,255,0.68)",
  border: "1px solid rgba(148,163,184,0.3)",
  transition: "all 0.2s ease",
  "&:focus-within": {
    borderColor: "rgba(59,130,246,0.55)",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.15)",
  },
  "& input": {
    direction: "rtl" as const,
    color: "#0f172a",
  },
  "& input:focus": {
    outline: "none",
  },
} as const;

const textareaBaseSx = {
  ...inputBaseSx,
  "& textarea": {
    direction: "rtl" as const,
    color: "#0f172a",
  },
  "& textarea:focus": {
    outline: "none",
  },
} as const;

const primaryButtonSx = {
  borderRadius: 16,
  background:
    "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.8))",
  color: "#fff",
  boxShadow: "0 18px 45px -20px rgba(59,130,246,0.6)",
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  "&:hover": {
    background:
      "linear-gradient(135deg, rgba(37,99,235,1), rgba(14,165,233,0.9))",
  },
} as const;

const secondaryButtonSx = {
  borderRadius: 16,
  borderColor: "rgba(148,163,184,0.45)",
  color: "#1e293b",
  backgroundColor: "rgba(255,255,255,0.68)",
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  "&:hover": {
    backgroundColor: "rgba(241,245,249,0.9)",
    borderColor: "rgba(148,163,184,0.6)",
  },
} as const;

const iconButtonBaseSx = {
  borderRadius: 14,
  backdropFilter: "blur(8px)",
  minWidth: 0,
  width: 36,
  height: 36,
  transition: "all 0.2s ease",
} as const;

const getTypeChipSx = (type: "INDIVIDUAL" | "COMPANY") =>
  type === "COMPANY"
    ? {
        borderRadius: "999px",
        px: 1.6,
        backgroundColor: "rgba(59,130,246,0.18)",
        color: "#1d4ed8",
        border: "1px solid rgba(59,130,246,0.3)",
        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
      }
    : {
        borderRadius: "999px",
        px: 1.6,
        backgroundColor: "rgba(34,197,94,0.18)",
        color: "#047857",
        border: "1px solid rgba(34,197,94,0.3)",
        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
      };

const getStatusChipSx = (isActive: boolean) =>
  isActive
    ? {
        borderRadius: "999px",
        px: 1.6,
        backgroundColor: "rgba(34,197,94,0.18)",
        color: "#047857",
        border: "1px solid rgba(34,197,94,0.3)",
        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
      }
    : {
        borderRadius: "999px",
        px: 1.6,
        backgroundColor: "rgba(248,113,113,0.18)",
        color: "#b91c1c",
        border: "1px solid rgba(248,113,113,0.3)",
        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
      };

const searchCardSx = {
  ...glassCardBaseSx,
  p: { xs: 2.5, md: 3 },
} as const;

const customersCardSx = {
  ...glassCardBaseSx,
  p: { xs: 2, md: 3 },
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(241,245,249,0.68))",
  overflow: "visible" as const,
} as const;

const tableContainerSx = {
  mt: 3,
  overflowX: "auto" as const,
  maxWidth: "100%",
  width: "100%",
  borderRadius: 20,
  border: "1px solid rgba(148,163,184,0.25)",
  backgroundColor: "rgba(255,255,255,0.55)",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "thin",
  "&::-webkit-scrollbar": {
    height: 6,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(148,163,184,0.55)",
    borderRadius: 999,
  },
} as const;

interface Customer {
  id: string;
  nameAr: string;
  nameEn?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  customerType: "INDIVIDUAL" | "COMPANY";
  creditLimit: number;
  isActive: boolean;
  createdAt: string;
}

interface CustomerFormData {
  nameAr: string;
  nameEn: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  customerType: "INDIVIDUAL" | "COMPANY";
  creditLimit: number;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: CustomerFormData;
  setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>;
  handleSubmit: (e: React.FormEvent) => void;
  isEditModalOpen: boolean;
  submitting: boolean;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  handleSubmit,
  isEditModalOpen,
  submitting,
}) => (
  <Modal open={isOpen} onClose={onClose}>
    <ModalDialog
      sx={{
        ...glassModalSx,
        maxWidth: "lg",
        maxHeight: "90vh",
        overflow: "auto",
        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
      }}
      minWidth={"sm"}
    >
      <DialogTitle
        sx={{
          fontFamily: "var(--font-noto-sans-arabic), sans-serif",
          textAlign: "center",
          color: "#0f172a",
          width: "100%",
        }}
        component={"div"}
      >
        <p className="w-full">{title}</p>
      </DialogTitle>
      <ModalClose />
      <DialogContent
        sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <FormControl required>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                الاسم بالعربية
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
                  textAlign: "right",
                }}
              >
                الاسم بالإنجليزية
              </FormLabel>
              <Input
                value={formData.nameEn}
                onChange={(e) =>
                  setFormData({ ...formData, nameEn: e.target.value })
                }
                sx={{
                  ...inputBaseSx,
                  direction: "ltr",
                  textAlign: "left",
                  "& input": {
                    direction: "ltr" as const,
                    color: "#0f172a",
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                نوع العميل
              </FormLabel>
              <Select
                value={formData.customerType}
                onChange={(_, value) =>
                  setFormData({
                    ...formData,
                    customerType: value as "INDIVIDUAL" | "COMPANY",
                  })
                }
                placeholder="اختر نوع العميل"
                sx={{
                  ...inputBaseSx,
                  pr: 2,
                  direction: "rtl",
                  textAlign: "right",
                }}
                slotProps={{
                  listbox: {
                    sx: {
                      ...glassCardBaseSx,
                      borderRadius: 18,
                      p: 1,
                    },
                  },
                }}
              >
                <Option
                  value="INDIVIDUAL"
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    textAlign: "right",
                  }}
                >
                  فرد
                </Option>
                <Option
                  value="COMPANY"
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    textAlign: "right",
                  }}
                >
                  شركة
                </Option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                الشخص المسؤول
              </FormLabel>
              <Input
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                sx={inputBaseSx}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                رقم الهاتف
              </FormLabel>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                sx={{
                  ...inputBaseSx,
                  direction: "ltr",
                  textAlign: "left",
                  "& input": {
                    direction: "ltr" as const,
                    color: "#0f172a",
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                البريد الإلكتروني
              </FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                sx={{
                  ...inputBaseSx,
                  direction: "ltr",
                  textAlign: "left",
                  "& input": {
                    direction: "ltr" as const,
                    color: "#0f172a",
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                العنوان
              </FormLabel>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                sx={textareaBaseSx}
                minRows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                الرقم الضريبي
              </FormLabel>
              <Input
                value={formData.taxNumber}
                onChange={(e) =>
                  setFormData({ ...formData, taxNumber: e.target.value })
                }
                sx={{
                  ...inputBaseSx,
                  direction: "ltr",
                  textAlign: "left",
                  "& input": {
                    direction: "ltr" as const,
                    color: "#0f172a",
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  textAlign: "right",
                }}
              >
                الحد الائتماني (ج.س)
              </FormLabel>
              <Input
                type="number"
                slotProps={{
                  input: {
                    min: 0,
                    step: 0.01,
                  },
                }}
                value={formData.creditLimit}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === "" ? 0 : parseFloat(value);
                  setFormData({
                    ...formData,
                    creditLimit: Number.isNaN(numValue) ? 0 : numValue,
                  });
                }}
                sx={{
                  ...inputBaseSx,
                  direction: "ltr",
                  textAlign: "left",
                  "& input": {
                    direction: "ltr" as const,
                    color: "#0f172a",
                  },
                }}
              />
            </FormControl>

            <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
              <Button
                type="submit"
                disabled={submitting}
                loading={submitting}
                sx={{ flex: 1, ...primaryButtonSx }}
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
                sx={{ flex: 1, ...secondaryButtonSx }}
              >
                إلغاء
              </Button>
            </Box>
          </Stack>
        </form>
      </DialogContent>
    </ModalDialog>
  </Modal>
);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const [formData, setFormData] = useState<CustomerFormData>({
    nameAr: "",
    nameEn: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
    customerType: "INDIVIDUAL",
    creditLimit: 0,
  });

  useEffect(() => {
    void fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.nameAr.trim()) {
      errors.push("الاسم بالعربية مطلوب");
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      errors.push("البريد الإلكتروني غير صحيح");
    }

    if (formData.creditLimit < 0) {
      errors.push("الحد الائتماني يجب أن يكون أكبر من أو يساوي صفر");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast.error(`أخطاء في البيانات:\n${validationErrors.join("\n")}`);
        return;
      }

      const cleanedData = {
        ...formData,
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim() || undefined,
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        taxNumber: formData.taxNumber.trim() || undefined,
        creditLimit: Math.max(0, formData.creditLimit),
      };

      const url = isEditModalOpen
        ? `/api/customers/${selectedCustomer?.id}`
        : "/api/customers";
      const method = isEditModalOpen ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        await fetchCustomers();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        toast.success(
          isEditModalOpen
            ? "تم تحديث بيانات العميل بنجاح"
            : "تم إضافة العميل بنجاح"
        );
      } else {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((detail: any) => {
              const field = detail.path?.[0];
              const message = detail.message;
              const fieldNames: Record<string, string> = {
                nameAr: "الاسم بالعربية",
                nameEn: "الاسم بالإنجليزية",
                email: "البريد الإلكتروني",
                phone: "رقم الهاتف",
                creditLimit: "الحد الائتماني",
                customerType: "نوع العميل",
                contactPerson: "الشخص المسؤول",
                address: "العنوان",
                taxNumber: "الرقم الضريبي",
              };
              const arabicField = field ? fieldNames[field] || field : "حقل";
              return `${arabicField}: ${message}`;
            })
            .join("\n");

          toast.error(`أخطاء في البيانات:\n${validationErrors}`);
          return;
        }

        const errorMessage =
          errorData.error ||
          errorData.message ||
          `خطأ في ${isEditModalOpen ? "تحديث" : "إضافة"} العميل`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      nameAr: customer.nameAr,
      nameEn: customer.nameEn || "",
      contactPerson: customer.contactPerson || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      taxNumber: customer.taxNumber || "",
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          await fetchCustomers();
          toast.success("تم حذف العميل بنجاح");
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "خطأ في حذف العميل";
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
        const errorMessage =
          error instanceof Error ? error.message : "حدث خطأ في حذف العميل";
        toast.error(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nameAr: "",
      nameEn: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxNumber: "",
      customerType: "INDIVIDUAL",
      creditLimit: 0,
    });
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 right-16 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-12 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-6 lg:space-y-8">
        <div className="glass-surface-dark glass-highlight rounded-3xl border border-white/15 p-5 sm:p-6 lg:p-8 text-white shadow-[0_40px_95px_-55px_rgba(14,165,233,0.35)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-right">
              <Typography
                level="h1"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontSize: { xs: "1.75rem", lg: "2rem" },
                  color: "#f8fafc",
                }}
              >
                إدارة العملاء
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "rgba(255,255,255,0.8)",
                  mt: 1,
                }}
              >
                إضافة وإدارة بيانات العملاء
              </Typography>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              sx={{
                ...primaryButtonSx,
                borderRadius: 999,
                px: 3.5,
                py: 1.4,
                display: "flex",
                alignItems: "center",
                gap: 1,
                boxShadow: "0 35px 85px -45px rgba(14,165,233,0.65)",
              }}
            >
              <PlusIcon style={{ width: 20, height: 20 }} />
              إضافة عميل جديد
            </Button>
          </div>
        </div>

        <Card className="glass-highlight" sx={searchCardSx}>
          <Box sx={{ position: "relative" }}>
            <MagnifyingGlassIcon
              style={{
                position: "absolute",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                width: 20,
                height: 20,
                color: "#38bdf8",
                opacity: 0.8,
              }}
            />
            <Input
              placeholder="البحث عن العملاء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                ...inputBaseSx,
                pr: 6,
                pl: 3,
                borderRadius: 999,
                direction: "rtl",
                textAlign: "right",
                backgroundColor: "rgba(255,255,255,0.75)",
              }}
            />
          </Box>
        </Card>

        <Card sx={customersCardSx}>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Typography
              level="h3"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                textAlign: "right",
                color: "#0f172a",
              }}
            >
              قائمة العملاء ({filteredCustomers.length})
            </Typography>

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
                  جاري التحميل...
                </Typography>
              </Box>
            ) : filteredCustomers.length === 0 ? (
              <Box sx={{ py: 7 }}>
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "#475569",
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  لا توجد عملاء مطابقين للبحث
                </Typography>
              </Box>
            ) : (
              <Box sx={tableContainerSx}>
                <table className="w-full min-w-[960px] text-sm" dir="rtl">
                  <thead className="bg-white/60">
                    <tr className="border-b border-white/30">
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        الاسم
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        النوع
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        الهاتف
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        البريد الإلكتروني
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        الحد الائتماني
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        الحالة
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-700 font-arabic">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-t border-white/30 transition-colors duration-200 hover:bg-white/40"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-arabic">
                            <div className="font-semibold text-slate-900">
                              {customer.nameAr}
                            </div>
                            {customer.nameEn && (
                              <div className="text-xs text-slate-500">
                                {customer.nameEn}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Chip
                            size="sm"
                            variant="soft"
                            sx={getTypeChipSx(customer.customerType)}
                          >
                            {customer.customerType === "COMPANY"
                              ? "شركة"
                              : "فرد"}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 text-slate-800 align-middle">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-800 align-middle">
                          {customer.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-arabic align-middle">
                          ج.س {customer.creditLimit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Chip
                            size="sm"
                            variant="soft"
                            sx={getStatusChipSx(customer.isActive)}
                          >
                            {customer.isActive ? "نشط" : "غير نشط"}
                          </Chip>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1.5,
                              justifyContent: "flex-start",
                            }}
                          >
                            <IconButton
                              variant="soft"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              sx={{
                                ...iconButtonBaseSx,
                                backgroundColor: "rgba(59,130,246,0.15)",
                                border: "1px solid rgba(59,130,246,0.3)",
                                color: "#1d4ed8",
                                "&:hover": {
                                  backgroundColor: "rgba(59,130,246,0.22)",
                                  borderColor: "rgba(59,130,246,0.45)",
                                },
                              }}
                            >
                              <PencilIcon style={{ width: 16, height: 16 }} />
                            </IconButton>
                            <IconButton
                              variant="soft"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
                              sx={{
                                ...iconButtonBaseSx,
                                backgroundColor: "rgba(248,113,113,0.16)",
                                border: "1px solid rgba(248,113,113,0.3)",
                                color: "#be123c",
                                "&:hover": {
                                  backgroundColor: "rgba(248,113,113,0.24)",
                                  borderColor: "rgba(248,113,113,0.4)",
                                },
                              }}
                            >
                              <TrashIcon style={{ width: 16, height: 16 }} />
                            </IconButton>
                          </Box>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </Card>
      </div>

      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="إضافة عميل جديد"
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditModalOpen={isEditModalOpen}
        submitting={submitting}
      />

      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="تعديل بيانات العميل"
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditModalOpen={isEditModalOpen}
        submitting={submitting}
      />
    </div>
  );
}
