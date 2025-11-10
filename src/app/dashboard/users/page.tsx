"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Switch,
  Typography,
} from "@mui/joy";
import {
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { DEFAULT_PERMISSIONS, PERMISSIONS } from "@/lib/permissions";
import type { AppUser, AppRole } from "@/types/user";

interface UserFormState {
  name: string;
  email: string;
  role: AppRole;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  permissions: Record<string, boolean>;
}

interface UserModalProps {
  open: boolean;
  title: string;
  isEdit?: boolean;
  submitting: boolean;
  formData: UserFormState;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof UserFormState, value: any) => void;
  onTogglePermission: (permission: string, value: boolean) => void;
  onApplyRoleDefaults: () => void;
}

const PERMISSION_KEYS = Object.values(PERMISSIONS);

const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.DASHBOARD]: "لوحة التحكم",
  [PERMISSIONS.CUSTOMERS]: "العملاء",
  [PERMISSIONS.CATEGORIES]: "التصنيفات",
  [PERMISSIONS.ITEMS]: "الأصناف",
  [PERMISSIONS.SUPPLIERS]: "الموردون",
  [PERMISSIONS.INCOMING_ORDERS]: "الطلبيات الواردة",
  [PERMISSIONS.OUTGOING_ORDERS]: "الطلبيات الصادرة",
  [PERMISSIONS.INVENTORY]: "المخزون",
  [PERMISSIONS.TREASURY]: "الخزينة",
  [PERMISSIONS.USERS]: "المستخدمون",
  [PERMISSIONS.SETTINGS]: "الإعدادات",
  [PERMISSIONS.REPORTS]: "التقارير",
};

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "مدير النظام",
  MANAGER: "مدير",
  USER: "مستخدم",
};

const initialFormState: UserFormState = {
  name: "",
  email: "",
  role: "USER",
  password: "",
  confirmPassword: "",
  isActive: true,
  permissions: { ...DEFAULT_PERMISSIONS.USER },
};

const UserModal: React.FC<UserModalProps> = ({
  open,
  title,
  formData,
  onClose,
  onSubmit,
  onChange,
  onTogglePermission,
  onApplyRoleDefaults,
  isEdit = false,
  submitting,
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        sx={{
          maxHeight: "90vh",
          overflow: "auto",
          fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
        }}
        minWidth={"md"}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
            mr: 4,
          }}
        >
          {title}
        </DialogTitle>
        <ModalClose disabled={submitting} />
        <DialogContent
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
          }}
        >
          <form onSubmit={onSubmit}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                gap={2}
              >
                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      textAlign: "right",
                    }}
                  >
                    الاسم الكامل
                  </FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(event) => onChange("name", event.target.value)}
                    required
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      direction: "rtl",
                      textAlign: "right",
                      "&:focus-within": { outline: "none", boxShadow: "none" },
                      "& input:focus": { outline: "none", boxShadow: "none" },
                    }}
                  />
                </FormControl>
                <FormControl required sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      textAlign: "right",
                    }}
                  >
                    البريد الإلكتروني
                  </FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      onChange("email", event.target.value.toLowerCase())
                    }
                    required
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      direction: "ltr",
                      textAlign: "left",
                      "&:focus-within": { outline: "none", boxShadow: "none" },
                      "& input:focus": { outline: "none", boxShadow: "none" },
                    }}
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
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      textAlign: "right",
                    }}
                  >
                    الدور الوظيفي
                  </FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(_, value) => {
                      if (!value) return;
                      onChange("role", value as AppRole);
                    }}
                    placeholder="اختر الدور"
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      direction: "rtl",
                      textAlign: "right",
                      "&:focus-within": { outline: "none", boxShadow: "none" },
                      "& button:focus": { outline: "none", boxShadow: "none" },
                    }}
                  >
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <Option
                        key={role}
                        value={role}
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), system-ui, sans-serif",
                          textAlign: "right",
                        }}
                      >
                        {label}
                      </Option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      textAlign: "right",
                    }}
                  >
                    حالة الحساب
                  </FormLabel>
                  <Sheet
                    variant="soft"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      borderRadius: "md",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily:
                          "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      }}
                    >
                      {formData.isActive ? "نشط" : "معطل"}
                    </Typography>
                    <Switch
                      checked={formData.isActive}
                      onChange={(event) =>
                        onChange("isActive", event.target.checked)
                      }
                    />
                  </Sheet>
                </FormControl>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                gap={2}
              >
                <FormControl
                  required={!isEdit || !!formData.password}
                  sx={{ flex: 1 }}
                >
                  <FormLabel
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      textAlign: "right",
                    }}
                  >
                    {isEdit ? "كلمة المرور الجديدة" : "كلمة المرور"}
                  </FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                      onChange("password", event.target.value)
                    }
                    required={!isEdit}
                    placeholder={
                      isEdit
                        ? "اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية"
                        : ""
                    }
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      direction: "rtl",
                      textAlign: "right",
                      "&:focus-within": { outline: "none", boxShadow: "none" },
                      "& input:focus": { outline: "none", boxShadow: "none" },
                    }}
                  />
                </FormControl>
                <FormControl required={!isEdit} sx={{ flex: 1 }}>
                  <FormLabel
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      textAlign: "right",
                    }}
                  >
                    تأكيد كلمة المرور
                  </FormLabel>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(event) =>
                      onChange("confirmPassword", event.target.value)
                    }
                    required={!isEdit || !!formData.password}
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      direction: "rtl",
                      textAlign: "right",
                      "&:focus-within": { outline: "none", boxShadow: "none" },
                      "& input:focus": { outline: "none", boxShadow: "none" },
                    }}
                  />
                </FormControl>
              </Stack>

              <Box>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 1.5 }}
                >
                  <Typography
                    level="title-lg"
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                    }}
                  >
                    صلاحيات الوصول
                  </Typography>
                  <Button
                    type="button"
                    variant="outlined"
                    size="sm"
                    onClick={onApplyRoleDefaults}
                    startDecorator={
                      <ArrowPathIcon style={{ width: 16, height: 16 }} />
                    }
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                    }}
                  >
                    استعادة الافتراضية حسب الدور
                  </Button>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(1, minmax(0, 1fr))",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  {PERMISSION_KEYS.map((permissionKey) => {
                    const checkboxId = `perm-${permissionKey}`;
                    const checked =
                      formData.permissions[permissionKey] ?? false;
                    return (
                      <Box
                        key={permissionKey}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          direction: "rtl",
                        }}
                      >
                        <Checkbox
                          id={checkboxId}
                          checked={checked}
                          onChange={(event) =>
                            onTogglePermission(
                              permissionKey,
                              event.target.checked
                            )
                          }
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), system-ui, sans-serif",
                            "--Checkbox-gap": "0px",
                          }}
                        />
                        <Typography
                          component="label"
                          htmlFor={checkboxId}
                          sx={{
                            fontFamily:
                              "var(--font-noto-sans-arabic), system-ui, sans-serif",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          {PERMISSION_LABELS[permissionKey]}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Stack
                direction="row"
                spacing={2}
                gap={2}
                justifyContent="space-between"
              >
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  sx={{
                    flex: 1,
                    fontFamily:
                      "var(--font-noto-sans-arabic), system-ui, sans-serif",
                  }}
                >
                  {isEdit ? "تحديث المستخدم" : "إضافة المستخدم"}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onClose}
                  disabled={submitting}
                  sx={{
                    flex: 1,
                    fontFamily:
                      "var(--font-noto-sans-arabic), system-ui, sans-serif",
                  }}
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
};

function sanitizePermissions(permissions: Record<string, boolean>) {
  const sanitized: Record<string, boolean> = {};
  for (const key of PERMISSION_KEYS) {
    sanitized[key] = permissions[key] === true;
  }
  return sanitized;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<UserFormState>(initialFormState);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return users;
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        ROLE_LABELS[user.role].toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, searchTerm]);

  useEffect(() => {
    void fetchUsers();
     
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setAccessDenied(false);
      const response = await fetch("/api/users");

      if (response.status === 403) {
        setAccessDenied(true);
        setUsers([]);
        return;
      }

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحميل قائمة المستخدمين");
      }

      const data = (await response.json()) as AppUser[];
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error(
        error instanceof Error ? error.message : "تعذر تحميل قائمة المستخدمين"
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setSelectedUser(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      confirmPassword: "",
      isActive: user.isActive,
      permissions: sanitizePermissions(user.permissions),
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setFormData(initialFormState);
  };

  const handleChange = (field: keyof UserFormState, value: any) => {
    setFormData((prev) => {
      if (field === "role") {
        const roleValue = value as AppRole;
        return {
          ...prev,
          role: roleValue,
          permissions: { ...DEFAULT_PERMISSIONS[roleValue] },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleTogglePermission = (permission: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
      },
    }));
  };

  const applyRoleDefaults = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...DEFAULT_PERMISSIONS[prev.role] },
    }));
  };

  const validateForm = (isEdit: boolean) => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("الاسم مطلوب");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push("البريد الإلكتروني غير صحيح");
    }

    if (!isEdit || formData.password) {
      if (formData.password.length < 6) {
        errors.push("كلمة المرور يجب ألا تقل عن 6 أحرف");
      }
      if (formData.password !== formData.confirmPassword) {
        errors.push("كلمة المرور وتأكيدها غير متطابقين");
      }
    }

    return errors;
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const errors = validateForm(false);
      if (errors.length) {
        toast.error(errors.join("\n"));
        return;
      }

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        password: formData.password,
        isActive: formData.isActive,
        permissions: sanitizePermissions(formData.permissions),
      };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر إنشاء المستخدم");
      }

      toast.success("تم إنشاء المستخدم بنجاح");
      closeModals();
      await fetchUsers();
    } catch (error) {
      console.error("Failed to create user", error);
      toast.error(
        error instanceof Error ? error.message : "تعذر إنشاء المستخدم"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);

    try {
      const errors = validateForm(true);
      if (errors.length) {
        toast.error(errors.join("\n"));
        return;
      }

      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        isActive: formData.isActive,
        permissions: sanitizePermissions(formData.permissions),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحديث بيانات المستخدم");
      }

      toast.success("تم تحديث بيانات المستخدم بنجاح");
      closeModals();
      await fetchUsers();
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error(
        error instanceof Error ? error.message : "تعذر تحديث بيانات المستخدم"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحديث حالة المستخدم");
      }

      toast.success("تم تحديث حالة المستخدم");
      await fetchUsers();
    } catch (error) {
      console.error("Failed to toggle user status", error);
      toast.error(
        error instanceof Error ? error.message : "تعذر تحديث حالة المستخدم"
      );
    }
  };

  return (
    <div className="space-y-6">
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            level="h1"
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
              fontSize: { xs: "1.5rem", lg: "1.875rem" },
              textAlign: "right",
            }}
          >
            إدارة المستخدمين
          </Typography>
          <Typography
            level="body-md"
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
              color: "text.secondary",
              textAlign: "right",
              mt: 0.5,
            }}
          >
            التحكم في حسابات وصلاحيات المستخدمين داخل النظام
          </Typography>
        </Box>
        <Button
          onClick={openAddModal}
          startDecorator={<PlusIcon style={{ width: 20, height: 20 }} />}
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
          }}
        >
          إضافة مستخدم جديد
        </Button>
      </Box>

      <Card sx={{ p: 2 }}>
        <Box sx={{ position: "relative" }}>
          <Input
            placeholder="البحث عن مستخدم..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), system-ui, sans-serif",
              direction: "rtl",
              textAlign: "right",
              "&:focus-within": { outline: "none", boxShadow: "none" },
              "& input:focus": { outline: "none", boxShadow: "none" },
            }}
          />
        </Box>
      </Card>

      {accessDenied ? (
        <Card sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center">
            <AdjustmentsHorizontalIcon
              style={{ width: 64, height: 64, color: "#9CA3AF" }}
            />
            <Typography
              level="title-lg"
              sx={{
                fontFamily:
                  "var(--font-noto-sans-arabic), system-ui, sans-serif",
              }}
            >
              لا تملك صلاحية الوصول لإدارة المستخدمين
            </Typography>
            <Typography
              sx={{
                fontFamily:
                  "var(--font-noto-sans-arabic), system-ui, sans-serif",
                color: "text.secondary",
              }}
            >
              يرجى التواصل مع مدير النظام لمنحك الصلاحية اللازمة.
            </Typography>
          </Stack>
        </Card>
      ) : (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography
              level="h3"
              sx={{
                fontFamily:
                  "var(--font-noto-sans-arabic), system-ui, sans-serif",
                textAlign: "right",
                mb: 3,
              }}
            >
              قائمة المستخدمين ({filteredUsers.length})
            </Typography>

            {loading ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                <Typography
                  sx={{
                    mt: 2,
                    fontFamily:
                      "var(--font-noto-sans-arabic), system-ui, sans-serif",
                  }}
                >
                  جاري التحميل...
                </Typography>
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography
                  sx={{
                    fontFamily:
                      "var(--font-noto-sans-arabic), system-ui, sans-serif",
                    color: "text.secondary",
                  }}
                >
                  لا يوجد مستخدمون مطابقون لبحثك حالياً
                </Typography>
              </Box>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" dir="rtl">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                        المستخدم
                      </th>
                      <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                        البريد الإلكتروني
                      </th>
                      <th className="text-right p-3 font-medium text-gray-900 font-arabic">
                        الدور
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
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <div className="font-arabic">
                            <div className="font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-900">{user.email}</td>
                        <td className="p-3 text-gray-900 font-arabic">
                          {ROLE_LABELS[user.role]}
                        </td>
                        <td className="p-3">
                          <Sheet
                            variant="soft"
                            color={user.isActive ? "success" : "neutral"}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "md",
                              fontFamily:
                                "var(--font-noto-sans-arabic), system-ui, sans-serif",
                            }}
                          >
                            <Switch
                              size="sm"
                              checked={user.isActive}
                              onChange={() => handleToggleActive(user)}
                            />
                            <Typography
                              sx={{
                                fontFamily:
                                  "var(--font-noto-sans-arabic), system-ui, sans-serif",
                              }}
                            >
                              {user.isActive ? "نشط" : "معطل"}
                            </Typography>
                          </Sheet>
                        </td>
                        <td className="p-3">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Button
                              size="sm"
                              variant="outlined"
                              onClick={() => openEditModal(user)}
                              startDecorator={
                                <PencilIcon style={{ width: 16, height: 16 }} />
                              }
                              sx={{
                                fontFamily:
                                  "var(--font-noto-sans-arabic), system-ui, sans-serif",
                              }}
                            >
                              تعديل
                            </Button>
                          </Stack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Box>
        </Card>
      )}

      <UserModal
        open={isAddModalOpen}
        title="إضافة مستخدم جديد"
        formData={formData}
        onClose={closeModals}
        onSubmit={handleCreateUser}
        onChange={handleChange}
        onTogglePermission={handleTogglePermission}
        onApplyRoleDefaults={applyRoleDefaults}
        submitting={submitting}
      />

      <UserModal
        open={isEditModalOpen}
        title="تعديل بيانات المستخدم"
        isEdit
        formData={formData}
        onClose={closeModals}
        onSubmit={handleUpdateUser}
        onChange={handleChange}
        onTogglePermission={handleTogglePermission}
        onApplyRoleDefaults={applyRoleDefaults}
        submitting={submitting}
      />
    </div>
  );
}
