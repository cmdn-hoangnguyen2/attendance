import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthMockProvider } from "@/context/AuthMockContext";
import { RoleSwitcherBanner } from "@/components/layout/RoleSwitcherBanner";
import { AppHeader } from "@/components/layout/AppHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DiemDanhCMDN — Điểm danh & Quản lý Quỹ",
  description: "Hệ thống điểm danh và quản lý quỹ nội bộ minh bạch, chuyên nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-neutral-white font-sans text-neutral-dark">
        <AuthMockProvider>
          <RoleSwitcherBanner />
          <AppHeader />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthMockProvider>
      </body>
    </html>
  );
}
