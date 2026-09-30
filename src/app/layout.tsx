import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthMockProvider } from "@/context/AuthMockContext";
import { RoleSwitcherBanner } from "@/components/layout/RoleSwitcherBanner";
import { AppHeader } from "@/components/layout/AppHeader";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-plus-jakarta",
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
    <html lang="vi" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-text-primary">
        <AuthMockProvider>
          <RoleSwitcherBanner />
          <AppHeader />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthMockProvider>
      </body>
    </html>
  );
}
