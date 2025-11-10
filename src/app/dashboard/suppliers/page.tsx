"use client";

import { useState, useEffect } from "react";
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
} from "@mui/joy";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Supplier {
  id: string;
  nameAr: string;
  nameEn?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditModalOpen
        ? `/api/suppliers/${selectedSupplier?.id}`
        : "/api/suppliers";
      const method = isEditModalOpen ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchSuppliers();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      nameAr: supplier.nameAr,
      nameEn: supplier.nameEn || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      taxNumber: supplier.taxNumber || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المورد؟")) {
      try {
        const response = await fetch(`/api/suppliers/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchSuppliers();
        }
      } catch (error) {
        console.error("Error deleting supplier:", error);
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
    });
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.includes(searchTerm) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SupplierModal = ({
    isOpen,
    onClose,
    title,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
  }) => (
    <Modal open={isOpen} onClose={onClose}>
      <ModalDialog
        sx={{
          width: "90vw",
          maxWidth: 500,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
            textAlign: "right",
          }}
        >
          {title}
        </DialogTitle>
        <ModalClose />

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl required>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  اسم المورد بالعربية *
                </FormLabel>
                <Input
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    direction: "rtl",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  اسم المورد بالإنجليزية
                </FormLabel>
                <Input
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  الشخص المسؤول
                </FormLabel>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    direction: "rtl",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
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
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
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
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  العنوان
                </FormLabel>
                <Textarea
                  minRows={3}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    direction: "rtl",
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  الرقم الضريبي
                </FormLabel>
                <Input
                  value={formData.taxNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, taxNumber: e.target.value })
                  }
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
                <Button type="submit" sx={{ flex: 1 }}>
                  {isEditModalOpen ? "تحديث" : "إضافة"}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onClose}
                  sx={{ flex: 1 }}
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-arabic">
            إدارة الموردين
          </h1>
          <p className="text-gray-600 font-arabic mt-1">
            إضافة وإدارة بيانات الموردين
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="font-arabic">إضافة مورد جديد</span>
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <Box sx={{ p: 2 }}>
          <Input
            placeholder="البحث عن الموردين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startDecorator={<MagnifyingGlassIcon className="w-5 h-5" />}
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              direction: "rtl",
              "& input": { textAlign: "right" },
            }}
          />
        </Box>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography
            level="title-lg"
            sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
          >
            قائمة الموردين ({filteredSuppliers.length})
          </Typography>
        </Box>
        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  border: "2px solid",
                  borderColor: "primary.200",
                  borderTopColor: "primary.600",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  mx: "auto",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              <Typography
                sx={{
                  mt: 1,
                  color: "text.secondary",
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                }}
              >
                جاري التحميل...
              </Typography>
            </Box>
          ) : filteredSuppliers.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
              <Typography
                sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
              >
                لا توجد موردين مطابقين للبحث
              </Typography>
            </Box>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                      اسم المورد
                    </th>
                    <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                      الشخص المسؤول
                    </th>
                    <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                      الهاتف
                    </th>
                    <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                      البريد الإلكتروني
                    </th>
                    <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                      الحالة
                    </th>
                    <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-3">
                        <div className="font-arabic">
                          <div className="font-medium text-gray-900">
                            {supplier.nameAr}
                          </div>
                          {supplier.nameEn && (
                            <div className="text-sm text-gray-500">
                              {supplier.nameEn}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-900 font-arabic">
                        {supplier.contactPerson || "-"}
                      </td>
                      <td className="p-3 text-gray-900">
                        {supplier.phone || "-"}
                      </td>
                      <td className="p-3 text-gray-900">
                        {supplier.email || "-"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-arabic ${
                            supplier.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {supplier.isActive ? "نشط" : "غير نشط"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => handleDelete(supplier.id)}
                            sx={{
                              color: "danger.500",
                              borderColor: "danger.200",
                              "&:hover": {
                                color: "danger.600",
                                backgroundColor: "danger.50",
                              },
                            }}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Box>
      </Card>

      {/* Add Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="إضافة مورد جديد"
      />

      {/* Edit Supplier Modal */}
      <SupplierModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="تعديل بيانات المورد"
      />
    </div>
  );
}
