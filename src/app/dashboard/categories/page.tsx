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
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Typography,
  Box,
  Stack,
  Chip,
} from "@mui/joy";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Category {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    items: number;
  };
}

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

function CategoryModal({
  isOpen,
  onClose,
  title,
  formData,
  setFormData,
  handleSubmit,
  isEditModalOpen,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: { nameAr: string; nameEn: string; description: string };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      nameAr: string;
      nameEn: string;
      description: string;
    }>
  >;
  handleSubmit: (e: React.FormEvent) => void;
  isEditModalOpen: boolean;
  submitting: boolean;
}) {
  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalDialog
        sx={{
          ...glassModalSx,
          maxWidth: "md",
          maxHeight: "90vh",
          overflow: "auto",
          fontFamily: "var(--font-noto-sans-arabic), sans-serif",
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
            textAlign: "right",
            color: "#0f172a",
          }}
        >
          {title}
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
                  اسم التصنيف بالعربية *
                </FormLabel>
                <Input
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    direction: "rtl",
                    textAlign: "right",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    borderRadius: 16,
                    "&:focus-within": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(59,130,246,0.15)",
                    },
                    "& input": {
                      direction: "rtl",
                    },
                    "& input:focus": {
                      outline: "none",
                    },
                  }}
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
                  اسم التصنيف بالإنجليزية
                </FormLabel>
                <Input
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    borderRadius: 16,
                    "&:focus-within": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(59,130,246,0.15)",
                    },
                    "& input:focus": {
                      outline: "none",
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
                  الوصف
                </FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  sx={{
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    direction: "rtl",
                    textAlign: "right",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    borderRadius: 16,
                    "&:focus-within": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(59,130,246,0.15)",
                    },
                    "& textarea:focus": {
                      outline: "none",
                    },
                  }}
                  minRows={3}
                />
              </FormControl>

              <Box sx={{ display: "flex", gap: 2, pt: 2 }}>
                <Button
                  type="submit"
                  disabled={submitting}
                  loading={submitting}
                  sx={{
                    flex: 1,
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    borderRadius: 16,
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.8))",
                    color: "#fff",
                    boxShadow: "0 18px 45px -20px rgba(59,130,246,0.6)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,1), rgba(14,165,233,0.9))",
                    },
                  }}
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
                  sx={{
                    flex: 1,
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                    borderRadius: 16,
                    borderColor: "rgba(148,163,184,0.45)",
                    color: "#1e293b",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    "&:hover": {
                      backgroundColor: "rgba(241,245,249,0.9)",
                      borderColor: "rgba(148,163,184,0.6)",
                    },
                  }}
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
}
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = isEditModalOpen
        ? `/api/categories/${selectedCategory?.id}`
        : "/api/categories";
      const method = isEditModalOpen ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCategories();
        resetForm();
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      nameAr: category.nameAr,
      nameEn: category.nameEn || "",
      description: category.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCategories();
        toast.success("تم حذف التصنيف بنجاح");
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "خطأ في حذف التصنيف");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      const errorMessage =
        error instanceof Error ? error.message : "حدث خطأ في حذف التصنيف";
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
    });
    setSelectedCategory(null);
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchCardSx = {
    ...glassCardBaseSx,
    p: { xs: 2.5, md: 3 },
  } as const;

  const categoryCardSx = {
    ...glassCardBaseSx,
    p: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    transition: "all 0.3s ease",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(241,245,249,0.65))",
    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: "0 45px 95px -55px rgba(59,130,246,0.45)",
      borderColor: "rgba(59,130,246,0.45)",
    },
  } as const;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-sky-300/12 blur-[120px]" />
      </div>
      <div className="relative z-10 space-y-6 lg:space-y-8">
        <div className="glass-surface-dark glass-highlight rounded-3xl border border-white/15 p-4 sm:p-6 lg:p-8 text-white shadow-[0_40px_95px_-55px_rgba(14,165,233,0.35)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-right">
              <Typography
                level="h1"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  fontSize: { xs: "1.75rem", lg: "2rem" },
                  color: "#f8fafc",
                }}
              >
                إدارة التصنيفات
              </Typography>
              <Typography
                level="body-md"
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "rgba(255,255,255,0.8)",
                  mt: 1,
                }}
              >
                إضافة وإدارة تصنيفات المنتجات
              </Typography>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: 999,
                px: 3,
                py: 1.5,
                background:
                  "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.85))",
                color: "#fff",
                boxShadow: "0 35px 85px -45px rgba(14,165,233,0.65)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(14,165,233,0.9))",
                },
              }}
            >
              <PlusIcon style={{ width: 20, height: 20 }} />
              إضافة تصنيف جديد
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
              placeholder="البحث عن التصنيفات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                direction: "rtl",
                textAlign: "right",
                pr: 6,
                pl: 3,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                backgroundColor: "rgba(255,255,255,0.75)",
                "&:focus-within": {
                  borderColor: "rgba(59,130,246,0.6)",
                  boxShadow: "0 0 0 3px rgba(59,130,246,0.12)",
                },
                "& input": {
                  direction: "rtl",
                  color: "#0f172a",
                },
              }}
            />
          </Box>
        </Card>

        {loading ? (
          <Card className="glass-highlight" sx={{ ...glassCardBaseSx, py: 6 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                border: "3px solid rgba(148,163,184,0.35)",
                borderTopColor: "rgba(14,165,233,0.85)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                mx: "auto",
                mb: 2,
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
          </Card>
        ) : filteredCategories.length === 0 ? (
          <Card className="glass-highlight" sx={{ ...glassCardBaseSx, py: 8 }}>
            <Typography
              sx={{
                textAlign: "center",
                color: "#475569",
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              }}
            >
              لا توجد تصنيفات مطابقة للبحث
            </Typography>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="glass-highlight"
                sx={categoryCardSx}
              >
                <Box
                  sx={{
                    p: { xs: 3, lg: 3.5 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        level="title-md"
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          mb: 0.5,
                          color: "#0f172a",
                          fontWeight: 600,
                        }}
                      >
                        {category.nameAr}
                      </Typography>
                      {category.nameEn && (
                        <Typography
                          sx={{
                            fontSize: "sm",
                            color: "#64748b",
                            mb: 1,
                          }}
                        >
                          {category.nameEn}
                        </Typography>
                      )}
                      {category.description && (
                        <Typography
                          sx={{
                            fontSize: "sm",
                            color: "#475569",
                            fontFamily:
                              "var(--font-noto-sans-arabic), sans-serif",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {category.description}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      variant="soft"
                      size="sm"
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        ml: 1,
                        borderRadius: "999px",
                        px: 1.5,
                        backgroundColor: category.isActive
                          ? "rgba(34,197,94,0.18)"
                          : "rgba(248,113,113,0.18)",
                        color: category.isActive ? "#047857" : "#b91c1c",
                        border: "1px solid rgba(148,163,184,0.25)",
                      }}
                    >
                      {category.isActive ? "نشط" : "غير نشط"}
                    </Chip>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: "auto",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "sm",
                        color: "#475569",
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    >
                      {category._count.items} منتجات
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        sx={{
                          borderRadius: 12,
                          backdropFilter: "blur(8px)",
                          backgroundColor: "rgba(59,130,246,0.15)",
                          color: "#1d4ed8",
                          border: "1px solid rgba(59,130,246,0.25)",
                          minWidth: 0,
                          "&:hover": {
                            backgroundColor: "rgba(59,130,246,0.22)",
                          },
                        }}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => handleDeleteClick(category)}
                        sx={{
                          borderRadius: 12,
                          backdropFilter: "blur(8px)",
                          backgroundColor: "rgba(248,113,113,0.16)",
                          color: "#be123c",
                          border: "1px solid rgba(248,113,113,0.25)",
                          minWidth: 0,
                          "&:hover": {
                            backgroundColor: "rgba(248,113,113,0.24)",
                          },
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <CategoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="إضافة تصنيف جديد"
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditModalOpen={isEditModalOpen}
        submitting={submitting}
      />

      {/* Edit Category Modal */}
      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="تعديل التصنيف"
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        isEditModalOpen={isEditModalOpen}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalDialog
          variant="outlined"
          role="alertdialog"
          sx={{
            ...glassModalSx,
            maxWidth: "md",
            fontFamily: "var(--font-noto-sans-arabic), sans-serif",
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              textAlign: "right",
              color: "#0f172a",
            }}
          >
            تأكيد الحذف
          </DialogTitle>
          <ModalClose />
          <DialogContent
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              textAlign: "right",
              color: "#1e293b",
            }}
          >
            <Typography
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                mb: 2,
                color: "#0f172a",
              }}
            >
              هل أنت متأكد من حذف التصنيف &quot;{selectedCategory?.nameAr}
              &quot;؟
            </Typography>
            {selectedCategory && selectedCategory._count.items > 0 && (
              <Typography
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  color: "warning.500",
                  fontSize: "sm",
                }}
              >
                تحذير: هذا التصنيف يحتوي على {selectedCategory._count.items}{" "}
                منتج. لا يمكن حذفه إلا بعد حذف جميع المنتجات المرتبطة به.
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "flex-end",
                pt: 2,
              }}
            >
              <Button
                variant="solid"
                color="danger"
                onClick={handleDeleteConfirm}
                disabled={deleting || (selectedCategory?._count.items ?? 0) > 0}
                loading={deleting}
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  borderRadius: 14,
                  boxShadow: "0 25px 65px -40px rgba(248,113,113,0.6)",
                }}
              >
                {deleting ? "جاري الحذف..." : "حذف"}
              </Button>
              <Button
                variant="soft"
                color="neutral"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                sx={{
                  fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(148,163,184,0.35)",
                  color: "#1e293b",
                  "&:hover": {
                    backgroundColor: "rgba(241,245,249,0.85)",
                  },
                }}
              >
                إلغاء
              </Button>
            </Box>
          </DialogContent>
        </ModalDialog>
      </Modal>
    </div>
  );
}
