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
  ListItemDecorator,
} from "@mui/joy";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { formatDate, formatCurrency, formatDateTime } from "@/lib/utils";
import { IncomingOrderReceipt } from "@/components/receipts/IncomingOrderReceipt";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { exportElementToPDF } from "@/lib/pdf";

interface Supplier {
  id: string;
  nameAr: string;
  nameEn?: string;
  phone?: string;
}

interface Item {
  id: string;
  nameAr: string;
  nameEn?: string;
  sku: string;
  unit: string;
}

interface OrderItem {
  id?: string;
  itemId: string;
  item?: Item;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface IncomingOrder {
  id: string;
  orderNumber: string;
  supplierInvoice?: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  supplierId: string;
  supplier: Supplier;
  items: OrderItem[];
  user: {
    name: string;
  };
}

const statusLabels: Record<string, { label: string; color: any }> = {
  PENDING: { label: "قيد الانتظار", color: "warning" },
  CONFIRMED: { label: "مؤكدة", color: "primary" },
  COMPLETED: { label: "مكتملة", color: "success" },
  CANCELLED: { label: "ملغية", color: "danger" },
};

const statusSequence: IncomingOrder["status"][] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

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
  backgroundColor: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(148,163,184,0.35)",
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
  "& textarea": {
    direction: "rtl" as const,
    color: "#0f172a",
  },
  "& textarea:focus": {
    outline: "none",
  },
} as const;

const primaryButtonSx = {
  borderRadius: 18,
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
  borderRadius: 18,
  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
  borderColor: "rgba(148,163,184,0.45)",
  color: "#1e293b",
  backgroundColor: "rgba(255,255,255,0.7)",
  "&:hover": {
    backgroundColor: "rgba(241,245,249,0.92)",
    borderColor: "rgba(148,163,184,0.6)",
  },
} as const;

const iconButtonBaseSx = {
  borderRadius: 14,
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(148,163,184,0.3)",
  backgroundColor: "rgba(255,255,255,0.6)",
  color: "#0f172a",
  transition: "all 0.2s ease",
  minWidth: 0,
  padding: 1,
} as const;

const filtersCardSx = {
  ...glassCardBaseSx,
  p: { xs: 2.5, md: 3 },
  borderRadius: 28,
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
  backgroundColor: "rgba(255,255,255,0.55)",
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
  "&:hover": {
    backgroundColor: "rgba(226,232,240,0.48)",
  },
  "& td": {
    borderBottom: "1px solid rgba(148,163,184,0.18)",
  },
} as const;

const chipBaseSx = {
  borderRadius: 18,
  fontSize: 13,
  fontWeight: 600,
  backdropFilter: "blur(8px)",
  px: 1.2,
  py: 0.4,
} as const;

const selectListboxSx = {
  ...glassCardBaseSx,
  borderRadius: 20,
  p: 1,
  boxShadow: "0 45px 110px -65px rgba(14,165,233,0.5)",
} as const;

const OrderModal = ({
  isOpen,
  onClose,
  order,
  onSave,
  suppliers,
  items,
}: {
  isOpen: boolean;
  onClose: () => void;
  order?: IncomingOrder;
  onSave: (orderData: any) => void;
  suppliers: Supplier[];
  items: Item[];
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    supplierId: string;
    supplierInvoice: string;
    notes: string;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  }>({
    supplierId: "",
    supplierInvoice: "",
    notes: "",
    status: "PENDING",
  });
  const [orderItems, setOrderItems] = useState<
    Array<{
      itemId: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  useEffect(() => {
    if (order) {
      setFormData({
        supplierId: order.supplierId,
        supplierInvoice: order.supplierInvoice || "",
        notes: order.notes || "",
        status: order.status,
      });
      setOrderItems(
        order.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
    } else {
      setFormData({
        supplierId: "",
        supplierInvoice: "",
        notes: "",
        status: "PENDING",
      });
      setOrderItems([]);
    }
  }, [order, isOpen]);

  const addOrderItem = () => {
    setOrderItems([
      ...orderItems,
      {
        itemId: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const updateOrderItem = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    setOrderItems(updated);
  };

  const removeOrderItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("يرجى اختيار المورد");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("يرجى إضافة عنصر واحد على الأقل");
      return;
    }

    const invalidItems = orderItems.some(
      (item) => !item.itemId || item.quantity <= 0 || item.unitPrice <= 0
    );

    if (invalidItems) {
      toast.error("يرجى التأكد من صحة بيانات العناصر");
      return;
    }

    setLoading(true);

    try {
      await onSave({
        ...formData,
        items: orderItems,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalDialog
        size="lg"
        sx={{
          ...glassModalSx,
          width: "90vw",
          maxWidth: "820px",
          maxHeight: "90vh",
          overflow: "auto",
          p: 0,
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
            fontSize: 24,
            fontWeight: 700,
            pl: 5,
            pt: 3,
          }}
          component={"div"}
        >
          <p className="w-full text-left p-1">
            {order ? "تعديل الطلبية الواردة" : "إضافة طلبية واردة جديدة"}
          </p>
        </DialogTitle>
        <ModalClose />

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={3}>
              {/* Basic Information */}
              <Stack spacing={2}>
                <FormControl required>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    المورد
                  </FormLabel>
                  <Select
                    value={formData.supplierId}
                    onChange={(_, value) =>
                      setFormData({ ...formData, supplierId: value || "" })
                    }
                    disabled={loading}
                    placeholder="اختر المورد"
                    sx={selectBaseSx}
                    slotProps={{
                      listbox: {
                        sx: selectListboxSx,
                      },
                    }}
                  >
                    {suppliers.map((supplier) => (
                      <Option key={supplier.id} value={supplier.id}>
                        {supplier.nameAr}
                        {supplier.nameEn && ` (${supplier.nameEn})`}
                      </Option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    رقم فاتورة المورد
                  </FormLabel>
                  <Input
                    value={formData.supplierInvoice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplierInvoice: e.target.value,
                      })
                    }
                    disabled={loading}
                    sx={inputBaseSx}
                  />
                </FormControl>

                {order && (
                  <FormControl>
                    <FormLabel
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      حالة الطلبية
                    </FormLabel>
                    <Select
                      value={formData.status}
                      onChange={(_, value) =>
                        setFormData({
                          ...formData,
                          status: value as any,
                        })
                      }
                      disabled={loading}
                      sx={selectBaseSx}
                      slotProps={{
                        listbox: {
                          sx: selectListboxSx,
                        },
                      }}
                    >
                      {Object.entries(statusLabels).map(
                        ([status, { label }]) => (
                          <Option key={status} value={status}>
                            {label}
                          </Option>
                        )
                      )}
                    </Select>
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    ملاحظات
                  </FormLabel>
                  <Textarea
                    minRows={2}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    disabled={loading}
                    sx={textareaBaseSx}
                  />
                </FormControl>
              </Stack>

              <Divider />

              {/* Order Items */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography
                    level="h4"
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    عناصر الطلبية
                  </Typography>
                  <Button
                    size="sm"
                    startDecorator={<PlusIcon className="w-4 h-4" />}
                    onClick={addOrderItem}
                    disabled={loading}
                    variant="outlined"
                    sx={{ ...secondaryButtonSx, px: 2.5 }}
                  >
                    إضافة عنصر
                  </Button>
                </Stack>

                <Box sx={{ ...tableWrapperSx, mt: 0 }}>
                  <Table
                    hoverRow
                    sx={{
                      minWidth: 720,
                      direction: "rtl",
                      textAlign: "center",
                      "& thead th": {
                        ...tableHeaderCellSx,
                        textAlign: "center",
                      },
                      "& tbody tr": tableRowSx,
                      "& tbody td": {
                        textAlign: "center",
                        verticalAlign: "middle",
                      },
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ width: 220 }}>المنتج</th>
                        <th style={{ width: 120 }}>الكمية</th>
                        <th style={{ width: 140 }}>سعر الوحدة</th>
                        <th style={{ width: 140 }}>المجموع</th>
                        <th style={{ width: 100 }}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((orderItem, index) => {
                        const item = items.find(
                          (i) => i.id === orderItem.itemId
                        );
                        return (
                          <tr key={index}>
                            <td>
                              <Select
                                value={orderItem.itemId}
                                onChange={(_, value) =>
                                  updateOrderItem(index, "itemId", value || "")
                                }
                                placeholder="اختر المنتج"
                                disabled={loading}
                                sx={{ minWidth: 200, ...selectBaseSx }}
                                slotProps={{
                                  listbox: {
                                    sx: selectListboxSx,
                                  },
                                }}
                              >
                                {items.map((item) => (
                                  <Option key={item.id} value={item.id}>
                                    {item.nameAr} ({item.sku})
                                  </Option>
                                ))}
                              </Select>
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={orderItem.quantity}
                                onChange={(e) =>
                                  updateOrderItem(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                slotProps={{
                                  input: {
                                    min: 1,
                                  },
                                }}
                                disabled={loading}
                                sx={{
                                  ...inputBaseSx,
                                  width: 110,
                                  "& input": {
                                    direction: "rtl",
                                    color: "#0f172a",
                                    textAlign: "center",
                                  },
                                }}
                              />
                              {item && item.unit && (
                                <Typography level="body-xs" sx={{ mt: 0.5 }}>
                                  {item.unit}
                                </Typography>
                              )}
                            </td>
                            <td>
                              <Input
                                type="number"
                                value={orderItem.unitPrice}
                                onChange={(e) =>
                                  updateOrderItem(
                                    index,
                                    "unitPrice",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                slotProps={{
                                  input: {
                                    min: 0,
                                    step: "0.01",
                                  },
                                }}
                                disabled={loading}
                                sx={{
                                  ...inputBaseSx,
                                  width: 120,
                                  "& input": {
                                    direction: "rtl",
                                    color: "#0f172a",
                                    textAlign: "center",
                                  },
                                }}
                              />
                            </td>
                            <td>
                              <Typography level="body-sm" fontWeight="md">
                                {(
                                  orderItem.quantity * orderItem.unitPrice
                                ).toFixed(2)}
                              </Typography>
                            </td>
                            <td>
                              <IconButton
                                size="sm"
                                color="danger"
                                onClick={() => removeOrderItem(index)}
                                disabled={loading}
                                sx={{ ...iconButtonBaseSx, color: "#ef4444" }}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </IconButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Box>

                {orderItems.length > 0 && (
                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Typography
                      level="h4"
                      color="primary"
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      المجموع الإجمالي: {totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>

          <Box
            sx={{
              p: { xs: 2, md: 3 },
              display: "flex",
              gap: 1,
              justifyContent: "flex-end",
              borderTop: "1px solid rgba(148,163,184,0.2)",
            }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
              sx={secondaryButtonSx}
            >
              إلغاء
            </Button>
            <Button type="submit" loading={loading} sx={primaryButtonSx}>
              {order ? "تحديث" : "إضافة"}
            </Button>
          </Box>
        </form>
      </ModalDialog>
    </Modal>
  );
};

export default function IncomingOrdersPage() {
  const [orders, setOrders] = useState<IncomingOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IncomingOrder | null>(
    null
  );
  const [viewOrder, setViewOrder] = useState<IncomingOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const { settings: companySettings, error: companySettingsError } =
    useCompanySettings();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const bulkReceiptRef = useRef<HTMLDivElement | null>(null);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id)),
    [orders, selectedOrderIds]
  );

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchItems();
  }, [searchTerm, statusFilter, supplierFilter]);

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
  }, [viewOrder?.id]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (supplierFilter) params.append("supplierId", supplierFilter);

      const response = await fetch(`/api/incoming-orders?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("حدث خطأ في جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleSave = async (orderData: any) => {
    try {
      const url = selectedOrder
        ? `/api/incoming-orders/${selectedOrder.id}`
        : "/api/incoming-orders";

      const method = selectedOrder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success(
        selectedOrder ? "تم تحديث الطلبية بنجاح" : "تم إضافة الطلبية بنجاح"
      );

      setIsModalOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ");
    }
  };

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
    const visibleIds = orders.map((order) => order.id);

    setSelectedOrderIds((prev) => {
      if (checked) {
        const merged = new Set([...prev, ...visibleIds]);
        return Array.from(merged);
      }

      return prev.filter((id) => !visibleIds.includes(id));
    });
  };

  const allVisibleSelected =
    orders.length > 0 &&
    orders.every((order) => selectedOrderIds.includes(order.id));

  const someVisibleSelected =
    orders.some((order) => selectedOrderIds.includes(order.id)) &&
    !allVisibleSelected;

  const handleOpenView = (order: IncomingOrder) => {
    setViewOrder(order);
    setIsViewModalOpen(true);
    setShowReceiptPreview(false);
  };

  const handleDownloadCurrentReceipt = async () => {
    if (!viewOrder) {
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
        filename: `incoming-${viewOrder.orderNumber}.pdf`,
        margin: 8,
      });
      toast.success("تم تصدير الإيصال");
    } catch (error) {
      console.error("Failed to export incoming order receipt", error);
      toast.error("تعذر تصدير الإيصال");
    }
  };

  const handleBulkDownloadReceipts = async () => {
    if (selectedOrders.length === 0) {
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
        filename: `incoming-receipts-${
          new Date().toISOString().split("T")[0]
        }.pdf`,
        margin: 8,
      });
      toast.success("تم تصدير الإيصالات المختارة");
    } catch (error) {
      console.error("Failed to export bulk incoming receipts", error);
      toast.error("تعذر تصدير الإيصالات");
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleDelete = async (orderId: string) => {
    const confirmed = confirm("هل أنت متأكد من حذف هذه الطلبية؟");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/incoming-orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success("تم حذف الطلبية بنجاح");
      fetchOrders();
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
      if (viewOrder?.id === orderId) {
        setViewOrder(null);
        setIsViewModalOpen(false);
        setShowReceiptPreview(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ في الحذف");
    }
  };

  const handleStatusChange = async (
    order: IncomingOrder,
    newStatus: IncomingOrder["status"]
  ) => {
    if (order.status === newStatus) {
      return;
    }

    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      toast.error("لا يمكن تعديل حالة طلبية مكتملة أو ملغية");
      return;
    }

    setStatusUpdatingId(order.id);

    try {
      const response = await fetch(`/api/incoming-orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "تعذر تحديث حالة الطلبية");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );

      setViewOrder((prev) =>
        prev?.id === order.id ? { ...prev, status: newStatus } : prev
      );

      setSelectedOrder((prev) =>
        prev?.id === order.id ? { ...prev, status: newStatus } : prev
      );

      toast.success(`تم تغيير الحالة إلى ${statusLabels[newStatus].label}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error instanceof Error ? error.message : "حدث خطأ في تغيير الحالة"
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = (order: IncomingOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

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
            {viewOrder && (
              <IncomingOrderReceipt
                order={viewOrder}
                company={companySettings}
              />
            )}
          </div>
          <div ref={bulkReceiptRef}>
            {selectedOrders.map((order) => (
              <div key={order.id} style={{ marginBottom: "24px" }}>
                <IncomingOrderReceipt order={order} company={companySettings} />
              </div>
            ))}
          </div>
        </Box>

        <div className="glass-surface-dark glass-highlight rounded-3xl border border-white/15 p-5 sm:p-6 lg:p-8 text-white shadow-[0_40px_95px_-55px_rgba(14,165,233,0.38)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-right">
              <Typography
                level="h1"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontSize: { xs: "1.75rem", lg: "2rem" },
                  color: "#f8fafc",
                }}
              >
                الطلبات الواردة
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "rgba(255,255,255,0.82)",
                  mt: 1,
                }}
              >
                تتبع الطلبيات الواردة، تأكيدها وطباعة إيصالات الموردين
              </Typography>
            </div>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              gap={1.5}
              justifyContent="flex-end"
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                startDecorator={<PlusIcon className="w-5 h-5" />}
                onClick={handleAdd}
                sx={{
                  ...primaryButtonSx,
                  borderRadius: 999,
                  px: { xs: 2.8, sm: 3.4 },
                  py: 1.3,
                  boxShadow: "0 35px 85px -45px rgba(14,165,233,0.65)",
                }}
              >
                طلبية جديدة
              </Button>
              <Button
                variant="outlined"
                startDecorator={<PrinterIcon className="w-5 h-5" />}
                onClick={handleBulkDownloadReceipts}
                loading={isBulkGenerating}
                disabled={selectedOrders.length === 0 || isBulkGenerating}
                sx={{
                  ...secondaryButtonSx,
                  borderRadius: 999,
                  px: { xs: 2.6, sm: 3 },
                  py: 1.2,
                  color: "#f8fafc",
                  borderColor: "rgba(255,255,255,0.35)",
                  backgroundColor: "rgba(15,23,42,0.35)",
                  "&:hover": {
                    backgroundColor: "rgba(30,64,175,0.45)",
                    borderColor: "rgba(255,255,255,0.45)",
                  },
                }}
              >
                طباعة الإيصالات المختارة
              </Button>
            </Stack>
          </div>
        </div>

        <Card className="glass-highlight" sx={filtersCardSx}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2.5}
            alignItems={{ xs: "stretch", md: "flex-end" }}
            flexWrap="wrap"
            // rowGap={2.5}
            gap={2.5}
          >
            <FormControl sx={{ minWidth: { xs: "100%", md: 240 } }}>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontWeight: 600,
                }}
              >
                البحث
              </FormLabel>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في الطلبات..."
                startDecorator={<MagnifyingGlassIcon className="w-4 h-4" />}
                sx={{
                  ...inputBaseSx,
                  minHeight: 36,
                  backgroundColor: "rgba(255,255,255,0.75)",
                }}
                size="sm"
              />
            </FormControl>

            <FormControl sx={{ minWidth: { xs: "100%", md: 200 } }}>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontWeight: 600,
                }}
              >
                الحالة
              </FormLabel>
              <Select
                value={statusFilter}
                onChange={(_, value) => setStatusFilter(value || "")}
                placeholder="جميع الحالات"
                sx={selectBaseSx}
                slotProps={{
                  listbox: {
                    sx: selectListboxSx,
                  },
                }}
              >
                <Option value="">جميع الحالات</Option>
                {Object.entries(statusLabels).map(([status, { label }]) => (
                  <Option key={status} value={status}>
                    {label}
                  </Option>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: { xs: "100%", md: 240 } }}>
              <FormLabel
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontWeight: 600,
                }}
              >
                المورد
              </FormLabel>
              <Select
                value={supplierFilter}
                onChange={(_, value) => setSupplierFilter(value || "")}
                placeholder="جميع الموردين"
                sx={selectBaseSx}
                slotProps={{
                  listbox: {
                    sx: selectListboxSx,
                  },
                }}
              >
                <Option value="">جميع الموردين</Option>
                {suppliers.map((supplier) => (
                  <Option key={supplier.id} value={supplier.id}>
                    {supplier.nameAr}
                  </Option>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Orders Table */}
        {loading ? (
          <Card
            className="glass-highlight"
            sx={{
              ...tableCardSx,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}
          >
            <Typography
              level="body-lg"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                color: "text.secondary",
              }}
            >
              جاري التحميل...
            </Typography>
          </Card>
        ) : (
          <Card className="glass-highlight" sx={tableCardSx}>
            <Box sx={{ ...tableWrapperSx, mt: 0 }}>
              <Table
                hoverRow
                sx={{
                  minWidth: 980,
                  direction: "rtl",
                  textAlign: "center",
                  borderCollapse: "separate",
                  // borderSpacing: "0 8px",
                  "& thead th": {
                    ...tableHeaderCellSx,
                    textAlign: "center",
                  },
                  // backgroundColor: "rgba(226,232,240,0.7)",
                  "& tbody tr": {
                    ...tableRowSx,
                    backgroundColor: "rgba(248,250,252,0.75)",
                  },
                  "& tbody td": {
                    textAlign: "center",
                    borderBottom: "none",
                    padding: "16px 12px",
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: "center" }}>
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
                    <th style={{ width: 120, textAlign: "center" }}>
                      رقم الطلبية
                    </th>
                    <th style={{ width: 160, textAlign: "center" }}>المورد</th>
                    <th style={{ width: 120, textAlign: "center" }}>
                      فاتورة المورد
                    </th>
                    <th style={{ width: 120, textAlign: "center" }}>
                      المبلغ الإجمالي
                    </th>
                    <th style={{ width: 120, textAlign: "center" }}>الحالة</th>
                    <th style={{ width: 160, textAlign: "center" }}>
                      تاريخ الإنشاء
                    </th>
                    <th style={{ width: 120, textAlign: "center" }}>المسؤول</th>
                    <th style={{ width: 180, textAlign: "center" }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
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
                        <Typography
                          level="body-sm"
                          fontWeight="md"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {order.orderNumber}
                        </Typography>
                      </td>
                      <td>
                        <Box>
                          <Typography
                            level="body-sm"
                            sx={{
                              fontFamily:
                                "var(--font-noto-sans-arabic), sans-serif",
                            }}
                          >
                            {order.supplier.nameAr}
                          </Typography>
                          {order.supplier.phone && (
                            <Typography
                              level="body-xs"
                              sx={{
                                color: "text.secondary",
                                fontFamily:
                                  "var(--font-noto-sans-arabic), sans-serif",
                              }}
                            >
                              {order.supplier.phone}
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {order.supplierInvoice || "-"}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          level="body-sm"
                          fontWeight="md"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {formatCurrency(Number(order.totalAmount))}
                        </Typography>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          color={statusLabels[order.status].color}
                          variant="soft"
                          sx={chipBaseSx}
                        >
                          {statusLabels[order.status].label}
                        </Chip>
                      </td>
                      <td>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {formatDate(order.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          level="body-sm"
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                          }}
                        >
                          {order.user.name}
                        </Typography>
                      </td>
                      <td>
                        <Dropdown>
                          <MenuButton
                            slots={{ root: IconButton }}
                            slotProps={{
                              root: {
                                sx: {
                                  ...iconButtonBaseSx,
                                  width: 40,
                                  height: 40,
                                  borderRadius: 16,
                                  color: "#0f172a",
                                },
                              },
                            }}
                          >
                            <EllipsisVerticalIcon className="w-5 h-5" />
                          </MenuButton>
                          <Menu
                            placement="bottom-end"
                            sx={{
                              minWidth: 220,
                              "--List-padding": "12px",
                              backgroundColor: "rgba(15,23,42,0.92)",
                              borderRadius: 20,
                              border: "1px solid rgba(148,163,184,0.28)",
                              backdropFilter: "blur(18px)",
                              boxShadow:
                                "0 35px 90px -55px rgba(14,165,233,0.45)",
                              // color: "rgba(226,232,240,0.95)",
                              // color: "#e0e7ff",
                              direction: "rtl",
                              "& .MuiMenuItem-root": {
                                borderRadius: 14,
                                fontFamily:
                                  "var(--font-noto-sans-arabic), sans-serif",
                              },
                            }}
                          >
                            <MenuItem
                              onClick={() => handleOpenView(order)}
                              sx={{
                                color: "#e0e7ff",
                              }}
                            >
                              <ListItemDecorator sx={{ minWidth: 24 }}>
                                <EyeIcon className="w-4 h-4" />
                              </ListItemDecorator>
                              عرض التفاصيل
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleEdit(order)}
                              disabled={
                                order.status === "COMPLETED" ||
                                order.status === "CANCELLED"
                              }
                              sx={{
                                color: "#e0e7ff",
                              }}
                            >
                              <ListItemDecorator sx={{ minWidth: 24 }}>
                                <PencilIcon className="w-4 h-4" />
                              </ListItemDecorator>
                              تعديل الطلبية
                            </MenuItem>
                            <MenuItem
                              onClick={() => handleDelete(order.id)}
                              disabled={order.status === "COMPLETED"}
                              sx={{ color: "#fca5a5" }}
                            >
                              <ListItemDecorator sx={{ minWidth: 24 }}>
                                <TrashIcon className="w-4 h-4" />
                              </ListItemDecorator>
                              حذف الطلبية
                            </MenuItem>
                            <ListDivider
                              sx={{ borderColor: "rgba(148,163,184,0.25)" }}
                            />
                            <MenuItem
                              disabled
                              sx={{
                                fontWeight: 600,
                                fontSize: 12,
                                opacity: 0.7,
                                cursor: "default",
                                justifyContent: "flex-end",
                              }}
                            >
                              تغيير الحالة
                            </MenuItem>
                            {statusSequence.map((status) => (
                              <MenuItem
                                key={status}
                                onClick={() =>
                                  handleStatusChange(order, status)
                                }
                                disabled={
                                  status === order.status ||
                                  statusUpdatingId === order.id ||
                                  order.status === "COMPLETED" ||
                                  order.status === "CANCELLED"
                                }
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 1,
                                  color: "#e0e7ff",
                                }}
                              >
                                <span>{statusLabels[status].label}</span>
                                {order.status === status && (
                                  <CheckIcon className="w-4 h-4" />
                                )}
                              </MenuItem>
                            ))}
                          </Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {orders.length === 0 && (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography level="body-lg" sx={{ color: "text.secondary" }}>
                    لا توجد طلبات واردة
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        )}
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder || undefined}
        onSave={handleSave}
        suppliers={suppliers}
        items={items}
      />

      <Modal
        open={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setShowReceiptPreview(false);
          setViewOrder(null);
        }}
      >
        <ModalDialog
          sx={{
            ...glassModalSx,
            maxHeight: "90vh",
            overflow: "auto",
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
            width: { xs: "95vw", sm: "80vw", md: "70vw" },
            p: { xs: 2.5, md: 3 },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              mr: 4,
              fontSize: 24,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            تفاصيل الطلبية الواردة
          </DialogTitle>
          <ModalClose />
          <DialogContent
            sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
          >
            {viewOrder && (
              <Stack spacing={3}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    <Typography
                      level="title-lg"
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      {viewOrder.orderNumber}
                    </Typography>
                    <Typography
                      level="body-sm"
                      sx={{
                        color: "text.secondary",
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    >
                      {formatDateTime(viewOrder.createdAt)}
                    </Typography>
                    {viewOrder.supplierInvoice && (
                      <Typography
                        level="body-xs"
                        sx={{
                          color: "text.secondary",
                          mt: 0.5,
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                        }}
                      >
                        فاتورة المورد: {viewOrder.supplierInvoice}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    size="md"
                    variant="soft"
                    color={statusLabels[viewOrder.status].color}
                    sx={chipBaseSx}
                  >
                    {statusLabels[viewOrder.status].label}
                  </Chip>
                </Box>

                <Box>
                  <Typography
                    level="title-md"
                    sx={{
                      mb: 1,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    }}
                  >
                    بيانات المورد
                  </Typography>
                  <Card
                    className="glass-highlight"
                    sx={{
                      ...glassCardBaseSx,
                      p: { xs: 2, md: 2.5 },
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(231,245,255,0.78))",
                    }}
                  >
                    <Typography level="body-sm" fontWeight="lg">
                      {viewOrder.supplier.nameAr}
                    </Typography>
                    {viewOrder.supplier.phone && (
                      <Typography
                        level="body-xs"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                      >
                        هاتف: {viewOrder.supplier.phone}
                      </Typography>
                    )}
                  </Card>
                </Box>

                <Box>
                  <Typography
                    level="title-md"
                    sx={{
                      mb: 1,
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    }}
                  >
                    عناصر الطلبية
                  </Typography>
                  <Stack spacing={1.5}>
                    {viewOrder.items.map((item) => (
                      <Card
                        className="glass-highlight"
                        key={
                          item.id ??
                          `${item.itemId}-${item.quantity}-${item.unitPrice}`
                        }
                        sx={{
                          ...glassCardBaseSx,
                          p: 0,
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(226,232,240,0.82))",
                        }}
                      >
                        <Box
                          sx={{
                            p: { xs: 2, md: 2.4 },
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography level="body-sm" fontWeight="lg">
                              {item.item?.nameAr || "-"}
                            </Typography>
                            <Typography
                              level="body-xs"
                              sx={{ color: "text.secondary" }}
                            >
                              {item.item?.sku && `رمز: ${item.item?.sku}`}
                              {item.item?.unit &&
                                ` | الوحدة: ${item.item?.unit}`}
                            </Typography>
                          </Box>
                          <Typography level="body-sm" fontWeight="lg">
                            {item.quantity} ×{" "}
                            {formatCurrency(Number(item.unitPrice))}
                          </Typography>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                <Box
                  sx={{
                    ...glassCardBaseSx,
                    p: { xs: 2, md: 2.5 },
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(226,232,240,0.78))",
                  }}
                >
                  <Stack spacing={1}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography level="body-sm">إجمالي الطلبية</Typography>
                      <Typography level="title-sm" fontWeight="lg">
                        {formatCurrency(Number(viewOrder.totalAmount))}
                      </Typography>
                    </Box>
                    {viewOrder.notes && (
                      <Typography
                        level="body-xs"
                        sx={{ color: "text.secondary" }}
                      >
                        ملاحظات: {viewOrder.notes}
                      </Typography>
                    )}
                  </Stack>
                </Box>

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
                        ...glassCardBaseSx,
                        borderRadius: 24,
                        overflow: "auto",
                        maxHeight: "60vh",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(226,232,240,0.88))",
                        p: { xs: 1.5, md: 2 },
                      }}
                    >
                      <IncomingOrderReceipt
                        order={viewOrder}
                        company={companySettings}
                      />
                    </Box>
                  </Box>
                )}

                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="outlined"
                    startDecorator={<PrinterIcon className="w-4 h-4" />}
                    onClick={() => setShowReceiptPreview((prev) => !prev)}
                    sx={{
                      ...secondaryButtonSx,
                      borderRadius: 18,
                      px: 2.8,
                    }}
                  >
                    {showReceiptPreview ? "إخفاء الإيصال" : "عرض الإيصال"}
                  </Button>
                  <Button
                    startDecorator={<ArrowDownTrayIcon className="w-4 h-4" />}
                    onClick={handleDownloadCurrentReceipt}
                    sx={{
                      ...primaryButtonSx,
                      borderRadius: 18,
                      px: 3,
                    }}
                  >
                    تحميل PDF
                  </Button>
                </Box>
              </Stack>
            )}
          </DialogContent>
        </ModalDialog>
      </Modal>
    </div>
  );
}
