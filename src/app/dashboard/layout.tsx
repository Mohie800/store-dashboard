"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Modal,
  ModalDialog,
  ModalClose,
  Avatar,
  Divider,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Sheet,
} from "@mui/joy";
import {
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  UserGroupIcon,
  Squares2X2Icon,
  CubeIcon,
  BuildingOffice2Icon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

const navItems = [
  { href: "/dashboard", label: "الرئيسية", icon: HomeIcon },
  { href: "/dashboard/customers", label: "العملاء", icon: UserGroupIcon },
  { href: "/dashboard/categories", label: "التصنيفات", icon: Squares2X2Icon },
  { href: "/dashboard/items", label: "المنتجات", icon: CubeIcon },
  {
    href: "/dashboard/suppliers",
    label: "الموردون",
    icon: BuildingOffice2Icon,
  },
  {
    href: "/dashboard/incoming-orders",
    label: "الطلبيات الواردة",
    icon: ArrowDownTrayIcon,
  },
  {
    href: "/dashboard/outgoing-orders",
    label: "الطلبيات الصادرة",
    icon: ArrowUpTrayIcon,
  },
  {
    href: "/dashboard/inventory",
    label: "المخزون",
    icon: ClipboardDocumentListIcon,
  },
  { href: "/dashboard/treasury", label: "الخزينة", icon: BanknotesIcon },
  { href: "/dashboard/users", label: "المستخدمون", icon: ShieldCheckIcon },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Cog6ToothIcon },
  { href: "/dashboard/reports", label: "التقارير", icon: ChartBarSquareIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isNavActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname?.startsWith(`${href}/`));
  const activeNavItem =
    navItems.find((item) => isNavActive(item.href)) ?? navItems[0];
  const ActiveIcon = activeNavItem.icon;
  const trimmedName = session?.user?.name?.trim();
  const emailLocalPart = session?.user?.email
    ? session.user.email.split("@")[0]
    : undefined;
  const fallbackName = emailLocalPart ?? "المستخدم";
  const userName =
    trimmedName && trimmedName.length > 0 ? trimmedName : fallbackName;
  const userInitial = userName.trim().charAt(0) || "م";

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-950 via-sky-950 to-indigo-950 text-white font-arabic">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/10 px-6 py-[19px] text-center backdrop-blur-sm">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">
          لوحة التحكم
        </h2>
        <p className="mt-1 text-xs lg:text-sm text-white/70">
          نظام إدارة اللوجستيات
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`group relative flex items-center gap-4 rounded-2xl border px-4 py-3 text-sm lg:text-base transition-all duration-200 ${
                isActive
                  ? "border-white/30 bg-white/15 text-white shadow-[0_20px_45px_-25px_rgba(15,118,255,0.9)]"
                  : "border-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute inset-y-2 -right-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.7)]" />
              )}
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 transition-all duration-200 ${
                  isActive
                    ? "border-white/40 bg-white/20 text-white"
                    : "group-hover:border-white/30 group-hover:bg-white/20 text-white/80"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="flex-1 text-right font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <Divider sx={{ mx: 3, borderColor: "rgba(255,255,255,0.1)" }} />

      {/* Footer */}
      <div className="px-4 pb-6 pt-4 text-center text-xs lg:text-sm text-white/60">
        <span>© 2025 نظام اللوجستيات</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col shadow-[0_35px_60px_-30px_rgba(14,116,144,0.7)]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Modal */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{ display: { lg: "none" } }}
      >
        <ModalDialog
          sx={{
            position: "fixed",
            right: 0,
            top: 0,
            height: "100%",
            width: 320,
            maxWidth: "90vw",
            m: 0,
            borderRadius: 0,
            p: 0,
            bgcolor: "transparent",
            boxShadow: "none",
            left: "auto",
            transform: "none",
            gap: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              // justifyContent: "space-between",
              px: 2.5,
              py: 2,
              borderBottom: "1px solid rgba(255,255,255,0.15)",
              bgcolor: "rgba(15,23,42,0.7)",
            }}
          >
            <Typography
              level="h4"
              sx={{
                fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                color: "white",
                textAlign: "center",
                width: "100%",
              }}
            >
              القائمة
            </Typography>
            <ModalClose sx={{ color: "white" }} />
          </Box>
          <SidebarContent />
        </ModalDialog>
      </Modal>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-l from-slate-950 via-sky-950 to-indigo-950 px-4 py-4 text-white shadow-[0_25px_55px_-30px_rgba(14,165,233,0.65)] lg:px-8 lg:py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 right-12 h-48 w-48 rounded-full bg-cyan-400/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-6 h-60 w-60 rounded-full bg-indigo-500/25 blur-3xl"
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4 lg:gap-5">
              {/* Mobile Menu Button */}
              <IconButton
                variant="plain"
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  display: { lg: "none" },
                  color: "white",
                  borderRadius: "16px",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderColor: "rgba(255,255,255,0.35)",
                  },
                }}
              >
                <Bars3Icon className="h-6 w-6" />
              </IconButton>

              <div className="text-right">
                <p className="text-xs font-medium text-white/70 lg:text-sm">
                  مرحباً بك
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-medium tracking-wide text-white/90 shadow-[0_18px_35px_-25px_rgba(56,189,248,0.9)]">
                    <ActiveIcon className="h-4 w-4" aria-hidden />
                    <span>{activeNavItem.label}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-4">
              {/* User Dropdown */}
              <Dropdown>
                <MenuButton
                  variant="plain"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: "999px",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    boxShadow: "0 25px 45px -30px rgba(34,211,238,0.55)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  <Avatar
                    size="sm"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.25)",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    {userInitial}
                  </Avatar>
                  <Typography
                    level="body-sm"
                    sx={{
                      display: { xs: "none", sm: "block" },
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      color: "white",
                    }}
                  >
                    {userName}
                  </Typography>
                </MenuButton>
                <Menu
                  placement="bottom-end"
                  sx={{
                    minWidth: 200,
                    "--List-padding": "8px",
                    "--ListItem-paddingY": "10px",
                    "--ListItem-paddingX": "14px",
                    backgroundColor: "rgba(15,23,42,0.92)",
                    borderRadius: "18px",
                    border: "1px solid rgba(148,163,184,0.25)",
                    backdropFilter: "blur(18px)",
                    boxShadow: "0 25px 55px -35px rgba(30,64,175,0.6)",
                    color: "rgba(226,232,240,0.95)",
                  }}
                >
                  {/* <MenuItem
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      gap: 1.5,
                      borderRadius: "12px",
                      color: "rgba(226,232,240,0.9)",
                      "&:hover": {
                        backgroundColor: "rgba(94,234,212,0.08)",
                        color: "white",
                      },
                    }}
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    الملف الشخصي
                  </MenuItem>
                  <MenuItem
                    sx={{
                      fontFamily: "var(--font-noto-sans-arabic), sans-serif",
                      gap: 1.5,
                      borderRadius: "12px",
                      color: "rgba(226,232,240,0.9)",
                      "&:hover": {
                        backgroundColor: "rgba(147,197,253,0.12)",
                        color: "white",
                      },
                    }}
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    الإعدادات
                  </MenuItem>
                  <Divider sx={{ borderColor: "rgba(148,163,184,0.25)" }} /> */}
                  <MenuItem
                    sx={{
                      fontFamily:
                        "var(--font-noto-sans-arabic), system-ui, sans-serif",
                      gap: 1.5,
                      borderRadius: "12px",
                      color: "rgba(248,113,113,0.85)",
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "rgba(248,113,113,0.12)",
                        color: "rgb(248,113,113)",
                      },
                    }}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    تسجيل الخروج
                  </MenuItem>
                </Menu>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-8 bg-slate-50 font-arabic max-w-[100vw]">
          {children}
        </div>
      </main>
    </div>
  );
}
