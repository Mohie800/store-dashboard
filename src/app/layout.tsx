import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { Noto_Sans_Arabic } from "next/font/google";
import InitColorSchemeScript from "@mui/joy/InitColorSchemeScript";

export const metadata: Metadata = {
  title: "لوحة تحكم الادارة ال",
  description: "نظام إدارة متجر الإمدادات",
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-arabic",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`scroll-smooth ${notoArabic.variable}`}
      suppressHydrationWarning={true}
    >
      <head>
        <InitColorSchemeScript defaultMode="light" modeStorageKey="joy-mode" />
      </head>
      <body className="font-arabic antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
