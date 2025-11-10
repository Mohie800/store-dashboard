"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Textarea,
  Typography,
} from "@mui/joy";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface SettingsFormState {
  nameAr: string;
  nameEn: string;
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  taxNumber: string;
  logo: string;
  footerText: string;
}

const initialFormState: SettingsFormState = {
  nameAr: "",
  nameEn: "",
  address: "",
  phone1: "",
  phone2: "",
  email: "",
  taxNumber: "",
  logo: "",
  footerText: "",
};

export default function SettingsPage() {
  const { settings, loading, error, refresh } = useCompanySettings();
  const [formData, setFormData] = useState<SettingsFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!settings) {
      setFormData(initialFormState);
      return;
    }

    setFormData({
      nameAr: settings.nameAr ?? "",
      nameEn: settings.nameEn ?? "",
      address: settings.address ?? "",
      phone1: settings.phone1 ?? "",
      phone2: settings.phone2 ?? "",
      email: settings.email ?? "",
      taxNumber: settings.taxNumber ?? "",
      logo: settings.logo ?? "",
      footerText: settings.footerText ?? "",
    });
  }, [settings]);

  const handleChange = (field: keyof SettingsFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const issues: string[] = [];

    if (!formData.nameAr.trim()) {
      issues.push("اسم الشركة بالعربية مطلوب");
    }

    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      issues.push("البريد الإلكتروني غير صحيح");
    }

    if (
      formData.logo.trim() &&
      !/^(https?:\/\/|\/)/i.test(formData.logo.trim())
    ) {
      issues.push("رابط الشعار يجب أن يكون صيغة صحيحة");
    }

    return issues;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const issues = validateForm();
      if (issues.length) {
        toast.error(issues.join("\n"));
        return;
      }

      const payload = {
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn.trim() || undefined,
        address: formData.address.trim() || undefined,
        phone1: formData.phone1.trim() || undefined,
        phone2: formData.phone2.trim() || undefined,
        email: formData.email.trim() || undefined,
        taxNumber: formData.taxNumber.trim() || undefined,
        logo: formData.logo.trim() || undefined,
        footerText: formData.footerText.trim() || undefined,
      };

      const response = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحديث بيانات الشركة");
      }

      toast.success("تم تحديث بيانات الشركة بنجاح");
      await refresh();
    } catch (submitError) {
      console.error("Failed to update company settings", submitError);
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : "تعذر تحديث بيانات الشركة"
      );
    } finally {
      setSubmitting(false);
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
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              fontSize: { xs: "1.5rem", lg: "1.875rem" },
              textAlign: "right",
            }}
          >
            إعدادات الشركة
          </Typography>
          <Typography
            level="body-md"
            sx={{
              fontFamily: "var(--font-noto-sans-arabic), sans-serif",
              color: "text.secondary",
              textAlign: "right",
              mt: 0.5,
            }}
          >
            تحديث معلومات الشركة ومحتوى تذييل الفواتير والتقارير
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startDecorator={<ArrowPathIcon style={{ width: 20, height: 20 }} />}
          onClick={() => {
            setFormData(initialFormState);
            void refresh();
          }}
          sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
        >
          إعادة تحميل الإعدادات
        </Button>
      </Box>

      {error ? (
        <Card sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center" textAlign="center" gap={2}>
            <Typography
              level="title-lg"
              sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
            >
              تعذر تحميل بيانات الشركة
            </Typography>
            <Typography
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                color: "text.secondary",
              }}
            >
              {error}
            </Typography>
            <Button
              onClick={() => void refresh()}
              sx={{ fontFamily: "var(--font-noto-sans-arabic), sans-serif" }}
            >
              إعادة المحاولة
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card>
          <Box sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                <Typography
                  sx={{
                    mt: 2,
                    fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                  }}
                >
                  جاري تحميل الإعدادات...
                </Typography>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={3} gap={3}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    gap={2}
                  >
                    <FormControl required sx={{ flex: 1 }}>
                      <FormLabel
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          textAlign: "right",
                        }}
                      >
                        اسم الشركة (بالعربية)
                      </FormLabel>
                      <Input
                        value={formData.nameAr}
                        onChange={(event) =>
                          handleChange("nameAr", event.target.value)
                        }
                        required
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          direction: "rtl",
                          textAlign: "right",
                          "&:focus-within": {
                            outline: "none",
                            boxShadow: "none",
                          },
                          "& input:focus": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    </FormControl>
                    <FormControl sx={{ flex: 1 }}>
                      <FormLabel
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          textAlign: "right",
                        }}
                      >
                        اسم الشركة (بالإنجليزية)
                      </FormLabel>
                      <Input
                        value={formData.nameEn}
                        onChange={(event) =>
                          handleChange("nameEn", event.target.value)
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          direction: "rtl",
                          textAlign: "right",
                          "&:focus-within": {
                            outline: "none",
                            boxShadow: "none",
                          },
                          "& input:focus": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    </FormControl>
                  </Stack>

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
                      onChange={(event) =>
                        handleChange("address", event.target.value)
                      }
                      minRows={3}
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        direction: "rtl",
                        textAlign: "right",
                        "&:focus-within": {
                          outline: "none",
                          boxShadow: "none",
                        },
                        "& textarea:focus": {
                          outline: "none",
                          boxShadow: "none",
                        },
                      }}
                    />
                  </FormControl>

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    gap={2}
                  >
                    <FormControl sx={{ flex: 1 }}>
                      <FormLabel
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          textAlign: "right",
                        }}
                      >
                        الهاتف الرئيسي
                      </FormLabel>
                      <Input
                        value={formData.phone1}
                        onChange={(event) =>
                          handleChange("phone1", event.target.value)
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          direction: "ltr",
                          textAlign: "left",
                          "&:focus-within": {
                            outline: "none",
                            boxShadow: "none",
                          },
                          "& input:focus": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    </FormControl>
                    <FormControl sx={{ flex: 1 }}>
                      <FormLabel
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          textAlign: "right",
                        }}
                      >
                        هاتف إضافي
                      </FormLabel>
                      <Input
                        value={formData.phone2}
                        onChange={(event) =>
                          handleChange("phone2", event.target.value)
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          direction: "ltr",
                          textAlign: "left",
                          "&:focus-within": {
                            outline: "none",
                            boxShadow: "none",
                          },
                          "& input:focus": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    </FormControl>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    gap={2}
                  >
                    <FormControl sx={{ flex: 1 }}>
                      <FormLabel
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          textAlign: "right",
                        }}
                      >
                        البريد الإلكتروني
                      </FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          handleChange("email", event.target.value)
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          direction: "ltr",
                          textAlign: "left",
                          "&:focus-within": {
                            outline: "none",
                            boxShadow: "none",
                          },
                          "& input:focus": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    </FormControl>
                    <FormControl sx={{ flex: 1 }}>
                      <FormLabel
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          textAlign: "right",
                        }}
                      >
                        الرقم الضريبي
                      </FormLabel>
                      <Input
                        value={formData.taxNumber}
                        onChange={(event) =>
                          handleChange("taxNumber", event.target.value)
                        }
                        sx={{
                          fontFamily:
                            "var(--font-noto-sans-arabic), sans-serif",
                          direction: "rtl",
                          textAlign: "right",
                          "&:focus-within": {
                            outline: "none",
                            boxShadow: "none",
                          },
                          "& input:focus": {
                            outline: "none",
                            boxShadow: "none",
                          },
                        }}
                      />
                    </FormControl>
                  </Stack>

                  <FormControl>
                    <FormLabel
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        textAlign: "right",
                      }}
                    >
                      رابط الشعار (يفضل رابط مباشر)
                    </FormLabel>
                    <Input
                      value={formData.logo}
                      onChange={(event) =>
                        handleChange("logo", event.target.value)
                      }
                      placeholder="مثال: https://example.com/logo.png"
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        direction: "ltr",
                        textAlign: "left",
                        "&:focus-within": {
                          outline: "none",
                          boxShadow: "none",
                        },
                        "& input:focus": { outline: "none", boxShadow: "none" },
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
                      تذييل الفواتير والتقارير
                    </FormLabel>
                    <Textarea
                      value={formData.footerText}
                      onChange={(event) =>
                        handleChange("footerText", event.target.value)
                      }
                      minRows={3}
                      sx={{
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                        direction: "rtl",
                        textAlign: "right",
                        "&:focus-within": {
                          outline: "none",
                          boxShadow: "none",
                        },
                        "& textarea:focus": {
                          outline: "none",
                          boxShadow: "none",
                        },
                      }}
                    />
                  </FormControl>

                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      type="submit"
                      loading={submitting}
                      disabled={submitting}
                      sx={{
                        minWidth: 180,
                        fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      }}
                    >
                      حفظ الإعدادات
                    </Button>
                  </Stack>
                </Stack>
              </form>
            )}
          </Box>
        </Card>
      )}
    </div>
  );
}
