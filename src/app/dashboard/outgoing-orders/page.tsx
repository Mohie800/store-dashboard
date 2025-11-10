"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  Button,
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
  Table,
  Divider,
  Checkbox,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  ListDivider,
} from "@mui/joy";
import {
  Plus,
  Trash2,
  Search,
  Eye,
  Check,
  X,
  Printer,
  Download,
  FileText,
  Clock3,
  BadgeCheck,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OutgoingOrderReceipt } from "@/components/receipts/OutgoingOrderReceipt";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { exportElementToPDF } from "@/lib/pdf";

interface Customer {
  id: string;
  nameAr: string;
  nameEn?: string;
  phone?: string;
  customerType: string;
  isActive: boolean;
}

interface Item {
  id: string;
  nameAr: string;
  nameEn?: string;
  unit: string;
  sku: string;
}

interface OrderItem {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

interface OutgoingOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  customer: {
    id: string;
    nameAr: string;
    nameEn?: string;
    phone?: string;
  };
  user: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    item: {
      id: string;
      nameAr: string;
      nameEn?: string;
      unit: string;
      sku: string;
    };
  }[];
  _count: {
    items: number;
  };
}

interface OrderFormData {
  customerId: string;
  discount: number;
  notes: string;
  items: OrderItem[];
}

const glassCardBaseSx = {
  backdropFilter: "blur(18px)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(241,245,249,0.58))",
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.3)",
  boxShadow: "0 35px 95px -55px rgba(59,130,246,0.48)",
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

const actionMenuButtonSx = {
  ...iconButtonBaseSx,
  backgroundColor: "rgba(148,163,184,0.18)",
  color: "#1d4ed8",
} as const;

const actionMenuSx = {
  ...glassCardBaseSx,
  direction: "rtl" as const,
  minWidth: 220,
  borderRadius: 20,
  p: 0.75,
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(226,232,240,0.86))",
  boxShadow: "0 45px 110px -65px rgba(14,165,233,0.5)",
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
} as const;

const actionMenuItemSx = {
  borderRadius: 14,
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  color: "#0f172a",
  fontSize: 14,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(226,232,240,0.65)",
  },
} as const;

const actionMenuItemContentSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1.2,
  width: "100%",
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
  mt: { xs: 1.5, md: 2 },
  borderRadius: 24,
  border: "1px solid rgba(148,163,184,0.28)",
  backgroundColor: "rgba(255,255,255,0.62)",
  overflow: "auto",
} as const;

const tableHeaderCellSx = {
  borderBottom: "1px solid rgba(148,163,184,0.35)",
  color: "#0f172a",
  fontWeight: 600,
  fontSize: 14,
  textAlign: "right" as const,
  // backgroundColor: "rgba(226,232,240,0.7)",
} as const;

const tableRowSx = {
  transition: "all 0.2s ease",
  backgroundColor: "rgba(248,250,252,0.9)",
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

const statusStyles: Record<
  OutgoingOrder["status"],
  { label: string; background: string; color: string; border: string }
> = {
  PENDING: {
    label: "قيد الانتظار",
    background:
      "linear-gradient(135deg, rgba(251,191,36,0.22), rgba(253,224,71,0.32))",
    color: "#92400e",
    border: "1px solid rgba(251,191,36,0.45)",
  },
  CONFIRMED: {
    label: "مؤكد",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(14,165,233,0.28))",
    color: "#1d4ed8",
    border: "1px solid rgba(59,130,246,0.48)",
  },
  COMPLETED: {
    label: "مكتمل",
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(74,222,128,0.28))",
    color: "#166534",
    border: "1px solid rgba(34,197,94,0.45)",
  },
  CANCELLED: {
    label: "ملغي",
    background:
      "linear-gradient(135deg, rgba(248,113,113,0.24), rgba(239,68,68,0.34))",
    color: "#b91c1c",
    border: "1px solid rgba(239,68,68,0.48)",
  },
};

const StatusChip = ({ status }: { status: OutgoingOrder["status"] }) => {
  const style = statusStyles[status];

  return (
    <Chip
      size="md"
      sx={{
        ...chipBaseSx,
        background: style?.background,
        color: style?.color,
        border: style?.border,
        boxShadow: "0 18px 45px -30px rgba(59,130,246,0.45)",
      }}
    >
      {style?.label ?? status}
    </Chip>
  );
};

const OutgoingOrdersPage = () => {
  const [orders, setOrders] = useState<OutgoingOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutgoingOrder | null>(
    null
  );
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Form data
  const [formData, setFormData] = useState<OrderFormData>({
    customerId: "",
    discount: 0,
    notes: "",
    items: [],
  });

  // Item selection states
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);

  const { settings: companySettings, error: companySettingsError } =
    useCompanySettings();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const bulkReceiptRef = useRef<HTMLDivElement | null>(null);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id)),
    [orders, selectedOrderIds]
  );

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((order) => order.status === "PENDING").length;
    const completed = orders.filter(
      (order) => order.status === "COMPLETED"
    ).length;
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.finalAmount ?? 0),
      0
    );

    return { total, pending, completed, revenue };
  }, [orders]);

  const selectedCount = selectedOrderIds.length;

  const statsCards = useMemo(
    () => [
      {
        title: "إجمالي الطلبات",
        value: stats.total.toLocaleString(),
        description: "كل الطلبات المسجلة",
        icon: FileText,
        bubble: {
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(14,165,233,0.2))",
          color: "#1d4ed8",
        },
      },
      {
        title: "طلبات قيد الانتظار",
        value: stats.pending.toLocaleString(),
        description: "تحتاج إلى متابعة",
        icon: Clock3,
        bubble: {
          background:
            "linear-gradient(135deg, rgba(251,191,36,0.28), rgba(253,224,71,0.22))",
          color: "#b45309",
        },
      },
      {
        title: "طلبات مكتملة",
        value: stats.completed.toLocaleString(),
        description: "تم تسليمها بالكامل",
        icon: BadgeCheck,
        bubble: {
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.26), rgba(74,222,128,0.24))",
          color: "#15803d",
        },
      },
      {
        title: "إجمالي العوائد",
        value: formatCurrency(stats.revenue),
        description: "القيمة النهائية المحققة",
        icon: TrendingUp,
        bubble: {
          background:
            "linear-gradient(135deg, rgba(129,140,248,0.25), rgba(99,102,241,0.22))",
          color: "#4338ca",
        },
      },
    ],
    [stats]
  );

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchItems();
  }, [statusFilter]);

  useEffect(() => {
    if (companySettingsError) {
      toast.error(companySettingsError);
    }
  }, [companySettingsError]);

  useEffect(() => {
    setSelectedOrderIds((prev) =>
      prev.filter((id) => orders.some((order) => order.id === id))
    );
  }, [orders]);

  useEffect(() => {
    setShowReceiptPreview(false);
  }, [selectedOrder?.id]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/outgoing-orders?status=${statusFilter}`
        : "/api/outgoing-orders";
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setOrders(data);
      } else {
        toast.error(data.error || "خطأ في جلب الطلبات");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.filter((c: Customer) => c.isActive));
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items");
      const data = await response.json();
      if (response.ok) {
        setItems(data.filter((item: any) => item.isActive));
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      discount: 0,
      notes: "",
      items: [],
    });
    setSelectedItemId("");
    setItemQuantity(1);
    setItemPrice(0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      toast.error("يجب إضافة صنف واحد على الأقل");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/outgoing-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم إنشاء الطلب بنجاح");
        setIsCreateModalOpen(false);
        resetForm();
        fetchOrders();
      } else {
        toast.error(data.error || "خطأ في إنشاء الطلب");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OutgoingOrder["status"]
  ) => {
    try {
      const response = await fetch(`/api/outgoing-orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم تحديث حالة الطلب بنجاح");
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error(data.error || "خطأ في تحديث الطلب");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("خطأ في الاتصال بالخادم");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطلب؟")) return;

    try {
      const response = await fetch(`/api/outgoing-orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("تم حذف الطلب بنجاح");
        fetchOrders();
        setIsViewModalOpen(false);
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
      } else {
        toast.error(data.error || "خطأ في حذف الطلب");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("خطأ في الاتصال بالخادم");
    }
  };

  const addItemToOrder = () => {
    if (!selectedItemId || itemQuantity <= 0 || itemPrice <= 0) {
      toast.error("يرجى ملء جميع بيانات الصنف");
      return;
    }

    const existingItemIndex = formData.items.findIndex(
      (item) => item.itemId === selectedItemId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex] = {
        itemId: selectedItemId,
        quantity: itemQuantity,
        unitPrice: itemPrice,
      };
      setFormData({ ...formData, items: updatedItems });
    } else {
      // Add new item
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            itemId: selectedItemId,
            quantity: itemQuantity,
            unitPrice: itemPrice,
          },
        ],
      });
    }

    // Reset item selection
    setSelectedItemId("");
    setItemQuantity(1);
    setItemPrice(0);
  };

  const removeItemFromOrder = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.itemId !== itemId),
    });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return subtotal - (formData.discount || 0);
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.nameAr || "";
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.nameAr || "";
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customer.nameAr.toLowerCase().includes(searchLower) ||
      order.customer.nameEn?.toLowerCase().includes(searchLower) ||
      order.user.name.toLowerCase().includes(searchLower)
    );
  });

  const waitForNextFrame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    const visibleIds = filteredOrders.map((order) => order.id);

    setSelectedOrderIds((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...visibleIds]);
        return Array.from(merged);
      }

      return prev.filter((id) => !visibleIds.includes(id));
    });
  };

  const allVisibleSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedOrderIds.includes(order.id));

  const someVisibleSelected =
    filteredOrders.some((order) => selectedOrderIds.includes(order.id)) &&
    !allVisibleSelected;

  const handleDownloadCurrentReceipt = async () => {
    if (!selectedOrder) {
      toast.error("لا يوجد طلب محدد للتحميل");
      return;
    }

    if (!receiptRef.current) {
      toast.error("الإيصال غير جاهز للتصدير");
      return;
    }

    try {
      await waitForNextFrame();
      await exportElementToPDF(receiptRef.current, {
        filename: `outgoing-${selectedOrder.orderNumber}.pdf`,
        margin: 8,
      });
      toast.success("تم تصدير الإيصال");
    } catch (error) {
      console.error("Failed to export outgoing order receipt", error);
      toast.error("تعذر تصدير الإيصال");
    }
  };

  const handleBulkDownloadReceipts = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error("يرجى اختيار طلب واحد على الأقل");
      return;
    }

    if (!bulkReceiptRef.current) {
      toast.error("الإيصالات غير جاهزة للتصدير");
      return;
    }

    try {
      setIsBulkGenerating(true);
      await waitForNextFrame();
      await exportElementToPDF(bulkReceiptRef.current, {
        filename: `outgoing-receipts-${
          new Date().toISOString().split("T")[0]
        }.pdf`,
        margin: 8,
      });
      toast.success("تم تصدير الإيصالات المختارة");
    } catch (error) {
      console.error("Failed to export bulk outgoing receipts", error);
      toast.error("تعذر تصدير الإيصالات");
    } finally {
      setIsBulkGenerating(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 3, md: 4 },
        px: { xs: 1.5, md: 3.5 },
        py: { xs: 3, md: 4 },
        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div ref={receiptRef}>
          {selectedOrder && (
            <OutgoingOrderReceipt
              order={selectedOrder}
              company={companySettings}
            />
          )}
        </div>
        <div ref={bulkReceiptRef}>
          {selectedOrders.map((order) => (
            <div key={order.id} style={{ marginBottom: "24px" }}>
              <OutgoingOrderReceipt order={order} company={companySettings} />
            </div>
          ))}
        </div>
      </Box>

      <Card
        className="glass-highlight"
        sx={{
          ...glassCardBaseSx,
          borderRadius: 32,
          overflow: "hidden",
          position: "relative",
          p: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at top left, rgba(59,130,246,0.45), transparent 55%), radial-gradient(circle at bottom right, rgba(14,165,233,0.28), transparent 60%)",
            opacity: 0.9,
          }}
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{ position: "relative" }}
        >
          <Box
            sx={{
              textAlign: { xs: "center", md: "right" },
              color: "#0f172a",
            }}
          >
            <Typography
              level="h2"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              الطلبات الصادرة
            </Typography>
            <Typography
              level="body-md"
              sx={{
                mt: 1,
                maxWidth: 460,
                color: "rgba(15,23,42,0.72)",
                mx: { xs: "auto", md: 0 },
              }}
            >
              إدارة دورة البيع وتتبع حالة الطلبات وإصدار الإيصالات
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            gap={2}
            alignItems="center"
            justifyContent="flex-end"
          >
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              sx={{
                ...primaryButtonSx,
                px: 3.5,
                py: 1.3,
                minWidth: 180,
              }}
              startDecorator={<Plus size={18} />}
            >
              طلب جديد
            </Button>
            <Button
              variant="outlined"
              onClick={handleBulkDownloadReceipts}
              disabled={selectedCount === 0 || isBulkGenerating}
              loading={isBulkGenerating}
              sx={{
                ...secondaryButtonSx,
                px: 3.2,
                py: 1.2,
                minWidth: 210,
              }}
              startDecorator={<Printer size={18} />}
            >
              طباعة الإيصالات المختارة
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {statsCards.map((stat) => (
          <Card key={stat.title} className="glass-highlight" sx={statsCardSx}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: stat.bubble.background,
              }}
            >
              <stat.icon size={26} style={{ color: stat.bubble.color }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography level="body-sm" sx={{ color: "rgba(15,23,42,0.7)" }}>
                {stat.title}
              </Typography>
              <Typography
                level="h3"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "#0f172a",
                  fontWeight: 700,
                  mt: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                level="body-xs"
                sx={{ color: "rgba(15,23,42,0.6)", mt: 0.5 }}
              >
                {stat.description}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      <Card
        className="glass-highlight"
        sx={{ ...filtersCardSx, borderRadius: 30, gap: 2 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            flex={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="flex-end"
          >
            <Input
              placeholder="البحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startDecorator={<Search size={18} />}
              sx={{
                ...inputBaseSx,
                minWidth: { xs: "100%", sm: 240 },
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.85)",
              }}
            />
            <Select
              placeholder="كل الحالات"
              value={statusFilter}
              onChange={(_, value) => setStatusFilter(value || "")}
              sx={{
                ...selectBaseSx,
                minWidth: { xs: "100%", sm: 190 },
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.85)",
              }}
              slotProps={{
                listbox: {
                  sx: selectListboxSx,
                },
              }}
            >
              <Option value="">جميع الحالات</Option>
              <Option value="PENDING">قيد الانتظار</Option>
              <Option value="CONFIRMED">مؤكد</Option>
              <Option value="COMPLETED">مكتمل</Option>
              <Option value="CANCELLED">ملغي</Option>
            </Select>
          </Stack>

          {selectedCount > 0 && (
            <Chip
              sx={{
                ...chipBaseSx,
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(14,165,233,0.18))",
                color: "#1d4ed8",
                border: "1px solid rgba(59,130,246,0.35)",
                alignSelf: { xs: "flex-start", md: "center" },
              }}
            >
              تم اختيار {selectedCount} طلب
            </Chip>
          )}
        </Stack>
      </Card>

      <Card
        className="glass-highlight"
        sx={{ ...tableCardSx, borderRadius: 32 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 1,
            pb: { xs: 1, md: 1.5 },
            borderBottom: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          <Box sx={{ textAlign: { xs: "center", sm: "right" } }}>
            <Typography
              level="title-lg"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                color: "#0f172a",
              }}
            >
              قائمة الطلبات
            </Typography>
            <Typography
              level="body-xs"
              sx={{ color: "rgba(15,23,42,0.55)", mt: 0.5 }}
            >
              {filteredOrders.length
                ? `${filteredOrders.length} طلب ظاهر`
                : "لا توجد طلبات مطابقة"}
            </Typography>
          </Box>

          {selectedCount > 0 && (
            <Chip
              sx={{
                ...chipBaseSx,
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(59,130,246,0.2))",
                color: "#1e3a8a",
                border: "1px solid rgba(59,130,246,0.32)",
              }}
            >
              اختيار جماعي مفعل
            </Chip>
          )}
        </Box>

        <Box sx={tableWrapperSx}>
          <Table
            stickyHeader
            sx={{
              minWidth: 1000,
              direction: "rtl",
              "& thead th": tableHeaderCellSx,
              "& tbody tr": tableRowSx,
              "& tbody td": { color: "#0f172a", fontSize: 14 },
            }}
          >
            <thead>
              <tr>
                <th style={{ width: 52, textAlign: "center" }}>
                  <Checkbox
                    color="primary"
                    size="sm"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={(event) =>
                      toggleSelectAllVisible(event.target.checked)
                    }
                    sx={{ "--Checkbox-gap": "0px" }}
                  />
                </th>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>عدد الأصناف</th>
                <th>المبلغ الإجمالي</th>
                <th>الخصم</th>
                <th>المبلغ النهائي</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th>المُنشئ</th>
                <th style={{ textAlign: "center" }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const showConfirm = order.status === "PENDING";
                  const showComplete = order.status === "CONFIRMED";
                  const showCancel =
                    order.status !== "CANCELLED" &&
                    order.status !== "COMPLETED";
                  const showDelete = order.status === "PENDING";
                  const hasStatusActions =
                    showConfirm || showComplete || showCancel;

                  return (
                    <tr key={order.id}>
                      <td style={{ textAlign: "center" }}>
                        <Checkbox
                          color="primary"
                          size="sm"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          sx={{ "--Checkbox-gap": "0px" }}
                        />
                      </td>
                      <td>
                        <Typography level="body-sm" fontWeight="lg">
                          {order.orderNumber}
                        </Typography>
                      </td>
                      <td>
                        <Box>
                          <Typography level="body-sm" fontWeight="lg">
                            {order.customer.nameAr}
                          </Typography>
                          {order.customer.phone && (
                            <Typography
                              level="body-xs"
                              sx={{ color: "rgba(15,23,42,0.6)" }}
                            >
                              {order.customer.phone}
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          sx={{
                            ...chipBaseSx,
                            background:
                              "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(59,130,246,0.2))",
                            color: "#1d4ed8",
                            border: "1px solid rgba(59,130,246,0.3)",
                          }}
                        >
                          {order._count.items}
                        </Chip>
                      </td>
                      <td>
                        <Typography level="body-sm" fontWeight="lg">
                          {formatCurrency(Number(order.totalAmount))}
                        </Typography>
                      </td>
                      <td>
                        {order.discount > 0 ? (
                          <Typography
                            level="body-sm"
                            sx={{ color: "#dc2626", fontWeight: 600 }}
                          >
                            -{formatCurrency(Number(order.discount))}
                          </Typography>
                        ) : (
                          <Typography
                            level="body-sm"
                            sx={{ color: "rgba(15,23,42,0.65)" }}
                          >
                            —
                          </Typography>
                        )}
                      </td>
                      <td>
                        <Typography
                          level="body-sm"
                          fontWeight="lg"
                          sx={{ color: "#15803d" }}
                        >
                          {formatCurrency(Number(order.finalAmount))}
                        </Typography>
                      </td>
                      <td>
                        <StatusChip status={order.status} />
                      </td>
                      <td>
                        <Typography level="body-xs">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-xs">
                          {order.user.name}
                        </Typography>
                      </td>
                      <td>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Dropdown>
                            <MenuButton
                              slots={{ root: IconButton }}
                              slotProps={{
                                root: {
                                  size: "sm",
                                  sx: actionMenuButtonSx,
                                },
                              }}
                            >
                              <MoreVertical size={18} />
                            </MenuButton>
                            <Menu
                              placement="bottom-end"
                              sx={actionMenuSx}
                              disablePortal
                            >
                              <MenuItem
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsViewModalOpen(true);
                                  setShowReceiptPreview(false);
                                }}
                                sx={actionMenuItemSx}
                              >
                                <Box sx={actionMenuItemContentSx}>
                                  <Typography
                                    level="body-sm"
                                    sx={{
                                      fontWeight: 600,
                                      color: "#1d4ed8",
                                    }}
                                  >
                                    عرض التفاصيل
                                  </Typography>
                                  <Eye size={16} color="#1d4ed8" />
                                </Box>
                              </MenuItem>

                              {hasStatusActions && (
                                <ListDivider
                                  sx={{
                                    my: 0.5,
                                    borderColor: "rgba(148,163,184,0.35)",
                                  }}
                                />
                              )}

                              {showConfirm && (
                                <MenuItem
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      "CONFIRMED"
                                    )
                                  }
                                  sx={actionMenuItemSx}
                                >
                                  <Box sx={actionMenuItemContentSx}>
                                    <Typography
                                      level="body-sm"
                                      sx={{ fontWeight: 600, color: "#15803d" }}
                                    >
                                      تأكيد الطلب
                                    </Typography>
                                    <Check size={16} color="#15803d" />
                                  </Box>
                                </MenuItem>
                              )}

                              {showComplete && (
                                <MenuItem
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      "COMPLETED"
                                    )
                                  }
                                  sx={actionMenuItemSx}
                                >
                                  <Box sx={actionMenuItemContentSx}>
                                    <Typography
                                      level="body-sm"
                                      sx={{ fontWeight: 600, color: "#15803d" }}
                                    >
                                      إكمال الطلب
                                    </Typography>
                                    <Check size={16} color="#15803d" />
                                  </Box>
                                </MenuItem>
                              )}

                              {showCancel && (
                                <MenuItem
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      "CANCELLED"
                                    )
                                  }
                                  sx={actionMenuItemSx}
                                >
                                  <Box sx={actionMenuItemContentSx}>
                                    <Typography
                                      level="body-sm"
                                      sx={{ fontWeight: 600, color: "#b45309" }}
                                    >
                                      إلغاء الطلب
                                    </Typography>
                                    <X size={16} color="#b45309" />
                                  </Box>
                                </MenuItem>
                              )}

                              {showDelete && (
                                <>
                                  <ListDivider
                                    sx={{
                                      my: 0.5,
                                      borderColor: "rgba(148,163,184,0.35)",
                                    }}
                                  />
                                  <MenuItem
                                    onClick={() => handleDeleteOrder(order.id)}
                                    sx={actionMenuItemSx}
                                  >
                                    <Box sx={actionMenuItemContentSx}>
                                      <Typography
                                        level="body-sm"
                                        sx={{
                                          fontWeight: 600,
                                          color: "#b91c1c",
                                        }}
                                      >
                                        حذف الطلب
                                      </Typography>
                                      <Trash2 size={16} color="#b91c1c" />
                                    </Box>
                                  </MenuItem>
                                </>
                              )}
                            </Menu>
                          </Dropdown>
                        </Box>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Box>
      </Card>

      {/* Create Order Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <ModalDialog
          sx={{
            ...glassModalSx,
            width: { xs: "94vw", sm: "80vw", md: "68vw", lg: "58vw" },
            maxHeight: "90vh",
            overflow: "hidden",
            p: { xs: 2.5, md: 3.5 },
            direction: "rtl",
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              fontWeight: 700,
              fontSize: 22,
              pr: 2,
              mr: 4,
            }}
          >
            طلب صادر جديد
          </DialogTitle>
          <ModalClose />
          <DialogContent
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              pt: 0,
              maxHeight: "70vh",
              overflow: "auto",
              pr: { xs: 0.5, md: 1 },
            }}
          >
            <form onSubmit={handleCreateOrder}>
              <Stack spacing={3}>
                {/* Customer Selection */}
                <FormControl required>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    العميل
                  </FormLabel>
                  <Select
                    value={formData.customerId}
                    onChange={(_, value) =>
                      setFormData({ ...formData, customerId: value || "" })
                    }
                    placeholder="اختر العميل"
                    sx={selectBaseSx}
                    slotProps={{
                      listbox: {
                        sx: selectListboxSx,
                      },
                    }}
                  >
                    {customers.map((customer) => (
                      <Option key={customer.id} value={customer.id}>
                        {customer.nameAr}
                        {customer.phone && ` - ${customer.phone}`}
                      </Option>
                    ))}
                  </Select>
                </FormControl>

                {/* Items Section */}
                <Divider
                  sx={{ my: 1.5, borderColor: "rgba(148,163,184,0.35)" }}
                />
                <Typography
                  level="title-md"
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    color: "#0f172a",
                  }}
                >
                  الأصناف
                </Typography>

                {/* Add Item Form */}
                <Box
                  sx={{
                    ...glassCardBaseSx,
                    borderRadius: 24,
                    p: { xs: 2, md: 2.5 },
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(226,232,240,0.78))",
                    boxShadow: "none",
                  }}
                >
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <FormControl sx={{ flex: 2, minWidth: 200 }}>
                        <FormLabel
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                          }}
                        >
                          الصنف
                        </FormLabel>
                        <Select
                          value={selectedItemId}
                          onChange={(_, value) =>
                            setSelectedItemId(value || "")
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
                              {item.nameAr} - {item.sku} ({item.unit})
                            </Option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl sx={{ flex: 1, minWidth: 100 }}>
                        <FormLabel
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                          }}
                        >
                          الكمية
                        </FormLabel>
                        <Input
                          type="number"
                          value={itemQuantity}
                          onChange={(e) =>
                            setItemQuantity(Number(e.target.value))
                          }
                          slotProps={{ input: { min: 1, dir: "rtl" } }}
                          sx={{ ...inputBaseSx, minWidth: "100%" }}
                        />
                      </FormControl>

                      <FormControl sx={{ flex: 1, minWidth: 120 }}>
                        <FormLabel
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            color: "#0f172a",
                          }}
                        >
                          سعر الوحدة (ج.س)
                        </FormLabel>
                        <Input
                          type="number"
                          value={itemPrice}
                          onChange={(e) => setItemPrice(Number(e.target.value))}
                          slotProps={{
                            input: { min: 0, step: 0.01, dir: "rtl" },
                          }}
                          sx={{ ...inputBaseSx, minWidth: "100%" }}
                        />
                      </FormControl>

                      <Box sx={{ display: "flex", alignItems: "end" }}>
                        <Button
                          onClick={addItemToOrder}
                          disabled={!selectedItemId}
                          startDecorator={<Plus size={16} />}
                          sx={{
                            ...primaryButtonSx,
                            borderRadius: 16,
                            px: 3,
                            py: 1.1,
                          }}
                        >
                          إضافة
                        </Button>
                      </Box>
                    </Box>
                  </Stack>
                </Box>

                {/* Selected Items List */}
                {formData.items.length > 0 && (
                  <Box>
                    <Typography
                      level="title-sm"
                      sx={{
                        mb: 2,
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        color: "#0f172a",
                      }}
                    >
                      الأصناف المضافة
                    </Typography>
                    <Stack spacing={1}>
                      {formData.items.map((item) => (
                        <Box
                          key={item.itemId}
                          sx={{
                            ...glassCardBaseSx,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: { xs: 2, md: 2.5 },
                            borderRadius: 24,
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(241,245,249,0.8))",
                            boxShadow: "none",
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography level="body-sm" fontWeight="lg">
                              {getItemName(item.itemId)}
                            </Typography>
                            <Typography
                              level="body-xs"
                              sx={{ color: "text.secondary" }}
                            >
                              الكمية: {item.quantity} | سعر الوحدة:{" "}
                              {formatCurrency(Number(item.unitPrice))}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Typography level="body-sm" fontWeight="lg">
                              {(
                                item.quantity * item.unitPrice
                              ).toLocaleString()}{" "}
                              ج.س
                            </Typography>
                            <IconButton
                              size="sm"
                              onClick={() => removeItemFromOrder(item.itemId)}
                              sx={{
                                ...iconButtonBaseSx,
                                backgroundColor: "rgba(248,113,113,0.18)",
                                color: "#b91c1c",
                              }}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Discount and Notes */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        color: "#0f172a",
                      }}
                    >
                      الخصم (ج.س)
                    </FormLabel>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount: Number(e.target.value),
                        })
                      }
                      slotProps={{ input: { min: 0, step: 0.01, dir: "rtl" } }}
                      sx={inputBaseSx}
                    />
                  </FormControl>
                </Box>

                <FormControl>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    ملاحظات
                  </FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="ملاحظات إضافية..."
                    minRows={2}
                    sx={textareaBaseSx}
                  />
                </FormControl>

                {/* Total */}
                {formData.items.length > 0 && (
                  <Box
                    sx={{
                      ...glassCardBaseSx,
                      textAlign: "center",
                      p: { xs: 2, md: 2.5 },
                      borderRadius: 24,
                      background:
                        "linear-gradient(135deg, rgba(226,232,240,0.7), rgba(255,255,255,0.85))",
                      boxShadow: "none",
                    }}
                  >
                    <Typography
                      level="title-lg"
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        color: "#0f172a",
                      }}
                    >
                      المبلغ الإجمالي: {formatCurrency(calculateTotal())}
                    </Typography>
                  </Box>
                )}

                <Box
                  sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                >
                  <Button
                    type="button"
                    variant="outlined"
                    color="neutral"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                    sx={{
                      ...secondaryButtonSx,
                      px: 3,
                      py: 1.1,
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={
                      formData.items.length === 0 || !formData.customerId
                    }
                    sx={{
                      ...primaryButtonSx,
                      px: 3.5,
                      py: 1.2,
                    }}
                  >
                    إنشاء الطلب
                  </Button>
                </Box>
              </Stack>
            </form>
          </DialogContent>
        </ModalDialog>
      </Modal>

      {/* View Order Modal */}
      <Modal
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setShowReceiptPreview(false);
          setSelectedOrder(null);
        }}
      >
        <ModalDialog
          sx={{
            ...glassModalSx,
            width: { xs: "94vw", sm: "78vw", md: "68vw" },
            maxHeight: "90vh",
            overflow: "hidden",
            p: { xs: 2.5, md: 3.5 },
            direction: "rtl",
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              fontWeight: 700,
              fontSize: 22,
              pr: 2,
              mr: 4,
            }}
          >
            تفاصيل الطلب الصادر
          </DialogTitle>
          <ModalClose />
          <DialogContent
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              pt: 0,
              maxHeight: "70vh",
              overflow: "auto",
              pr: { xs: 0.5, md: 1 },
            }}
          >
            {selectedOrder && (
              <Stack spacing={3}>
                {/* Order Info */}
                <Card
                  className="glass-highlight"
                  sx={{
                    ...glassCardBaseSx,
                    boxShadow: "none",
                    p: { xs: 2.5, md: 3 },
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ textAlign: { xs: "right", sm: "right" } }}>
                    <Typography
                      level="title-lg"
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      {selectedOrder.orderNumber}
                    </Typography>
                    <Typography
                      level="body-sm"
                      sx={{ color: "rgba(15,23,42,0.65)" }}
                    >
                      {formatDate(selectedOrder.createdAt)}
                    </Typography>
                  </Box>
                  <StatusChip status={selectedOrder.status} />
                </Card>

                {/* Customer Info */}
                <Box>
                  <Typography
                    level="title-md"
                    sx={{
                      mb: 1,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    معلومات العميل
                  </Typography>
                  <Card
                    className="glass-highlight"
                    sx={{
                      ...glassCardBaseSx,
                      boxShadow: "none",
                      p: { xs: 2.5, md: 3 },
                    }}
                  >
                    <Typography level="body-sm" fontWeight="lg">
                      {selectedOrder.customer.nameAr}
                    </Typography>
                    {selectedOrder.customer.phone && (
                      <Typography
                        level="body-xs"
                        sx={{ color: "rgba(15,23,42,0.6)", mt: 0.5 }}
                      >
                        {selectedOrder.customer.phone}
                      </Typography>
                    )}
                  </Card>
                </Box>

                {/* Order Items */}
                <Box>
                  <Typography
                    level="title-md"
                    sx={{
                      mb: 2,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      color: "#0f172a",
                    }}
                  >
                    أصناف الطلب
                  </Typography>
                  <Stack spacing={1.2}>
                    {selectedOrder.items.map((item) => (
                      <Card
                        key={item.id}
                        className="glass-highlight"
                        sx={{
                          ...glassCardBaseSx,
                          boxShadow: "none",
                          p: { xs: 2.5, md: 3 },
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography level="body-sm" fontWeight="lg">
                            {item.item.nameAr}
                          </Typography>
                          <Typography
                            level="body-xs"
                            sx={{ color: "rgba(15,23,42,0.6)", mt: 0.5 }}
                          >
                            {item.item.sku} - {item.item.unit}
                          </Typography>
                          <Typography level="body-xs" sx={{ mt: 0.5 }}>
                            الكمية: {item.quantity} ×{" "}
                            {formatCurrency(Number(item.unitPrice))}
                          </Typography>
                        </Box>
                        <Typography
                          level="body-sm"
                          fontWeight="lg"
                          sx={{ color: "#0f172a" }}
                        >
                          {formatCurrency(Number(item.totalPrice))}
                        </Typography>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                {/* Order Summary */}
                <Card
                  className="glass-highlight"
                  sx={{
                    ...glassCardBaseSx,
                    boxShadow: "none",
                    p: { xs: 2.5, md: 3 },
                  }}
                >
                  <Stack spacing={1.4}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#0f172a",
                      }}
                    >
                      <Typography level="body-sm">المجموع الفرعي</Typography>
                      <Typography level="body-sm">
                        {formatCurrency(Number(selectedOrder.totalAmount))}
                      </Typography>
                    </Box>
                    {selectedOrder.discount > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          color: "#dc2626",
                        }}
                      >
                        <Typography level="body-sm">الخصم</Typography>
                        <Typography level="body-sm">
                          -{formatCurrency(Number(selectedOrder.discount))}
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ borderColor: "rgba(148,163,184,0.35)" }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "#0f172a",
                      }}
                    >
                      <Typography
                        level="title-md"
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                        }}
                      >
                        المبلغ النهائي
                      </Typography>
                      <Typography
                        level="title-md"
                        sx={{ color: "#15803d", fontWeight: 700 }}
                      >
                        {formatCurrency(Number(selectedOrder.finalAmount))}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Box>
                    <Typography
                      level="title-sm"
                      sx={{
                        mb: 1,
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    >
                      ملاحظات
                    </Typography>
                    <Card
                      className="glass-highlight"
                      sx={{
                        ...glassCardBaseSx,
                        boxShadow: "none",
                        p: { xs: 2.5, md: 3 },
                      }}
                    >
                      <Typography level="body-sm" sx={{ color: "#0f172a" }}>
                        {selectedOrder.notes}
                      </Typography>
                    </Card>
                  </Box>
                )}

                {/* User Info */}
                <Typography
                  level="body-xs"
                  sx={{ color: "rgba(15,23,42,0.6)" }}
                >
                  أُنشئ بواسطة: {selectedOrder.user.name}
                </Typography>

                {showReceiptPreview && (
                  <Box>
                    <Typography
                      level="title-sm"
                      sx={{
                        mb: 1,
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    >
                      معاينة الإيصال
                    </Typography>
                    <Box
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: "md",
                        overflow: "auto",
                        maxHeight: "60vh",
                        bgcolor: "#fff",
                        p: 2,
                      }}
                    >
                      <OutgoingOrderReceipt
                        order={selectedOrder}
                        company={companySettings}
                      />
                    </Box>
                  </Box>
                )}

                {/* Action Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                    pt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setShowReceiptPreview((prev) => !prev)}
                    sx={{
                      ...secondaryButtonSx,
                      px: 3,
                      py: 1.1,
                    }}
                    startDecorator={<Printer size={18} />}
                  >
                    {showReceiptPreview ? "إخفاء الإيصال" : "عرض الإيصال"}
                  </Button>

                  <Button
                    onClick={handleDownloadCurrentReceipt}
                    sx={{
                      ...primaryButtonSx,
                      px: 3.2,
                      py: 1.15,
                    }}
                    startDecorator={<Download size={18} />}
                  >
                    تحميل PDF
                  </Button>

                  {selectedOrder.status === "PENDING" && (
                    <>
                      <Button
                        color="success"
                        variant="soft"
                        onClick={() =>
                          handleUpdateOrderStatus(selectedOrder.id, "CONFIRMED")
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                        }}
                      >
                        تأكيد الطلب
                      </Button>
                      <Button
                        color="danger"
                        variant="soft"
                        onClick={() => handleDeleteOrder(selectedOrder.id)}
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                        }}
                      >
                        حذف الطلب
                      </Button>
                    </>
                  )}

                  {selectedOrder.status === "CONFIRMED" && (
                    <Button
                      color="success"
                      onClick={() =>
                        handleUpdateOrderStatus(selectedOrder.id, "COMPLETED")
                      }
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    >
                      إكمال الطلب
                    </Button>
                  )}

                  {selectedOrder.status !== "CANCELLED" &&
                    selectedOrder.status !== "COMPLETED" && (
                      <Button
                        color="warning"
                        variant="soft"
                        onClick={() =>
                          handleUpdateOrderStatus(selectedOrder.id, "CANCELLED")
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                        }}
                      >
                        إلغاء الطلب
                      </Button>
                    )}
                </Box>
              </Stack>
            )}
          </DialogContent>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default OutgoingOrdersPage;
