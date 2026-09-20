"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthMock } from "@/context/AuthMockContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Login01Icon,
  SecurityCheckIcon,
  Shield01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, isMockActive, setRole } = useAuthMock();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleAuth0Login = () => {
    login();
  };

  const handleMockLogin = () => {
    setRole("user");
    router.replace("/");
  };

  return (
    <div className="flex-1 bg-neutral-50/50">
      <PageContainer as="main" className="flex min-h-[calc(100vh-140px)] items-center justify-center py-12">
        {/* Single Centered Authentication Card: Bo góc 24px (rounded-3xl), padding 32px (p-8) */}
        <section
          aria-labelledby="login-title"
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#C9F2E3] bg-white p-8 sm:p-10 shadow-sm"
        >
          {/* Subtle Ambient Background Gradient */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E8FBF4] blur-3xl"
          />

          <div className="relative flex flex-col items-center text-center">
            {/* Brand Logo Container: 56x56px (bội số của 8: 8x7=56) */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10D9A3] to-[#05966B] text-white shadow-xs mb-6">
              <span className="font-extrabold text-xl tracking-wider">CM</span>
            </div>

            {/* Badge Indicator */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FBF4] px-3 py-1 text-xs font-semibold text-[#05966B] border border-[#C9F2E3] mb-3">
              <HugeiconsIcon icon={Shield01Icon} size={14} />
              <span>Xác thực OIDC • Auth0</span>
            </span>

            {/* Main Title & Subtitle */}
            <h1 id="login-title" className="text-2xl font-black tracking-tight text-[#0B1F1A]">
              Đăng nhập hệ thống
            </h1>
            <p className="mt-2 text-sm text-[#4B665D] leading-relaxed">
              Truy cập không gian phòng họp, tham gia điểm danh tự động và theo dõi minh bạch các nghĩa vụ đóng góp quỹ.
            </p>

            {/* Feature Highlights: Spacing 16px (gap-4) */}
            <div className="my-8 flex w-full flex-col gap-3 rounded-2xl bg-neutral-50 p-4 text-left border border-neutral-100">
              <div className="flex items-center gap-3 text-xs font-medium text-[#4B665D]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#E8FBF4] text-[#05966B]">
                  <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
                </div>
                <span>Bỏ qua mật khẩu — Chọn trực tiếp tài khoản Google</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-[#4B665D]">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#E8FBF4] text-[#05966B]">
                  <HugeiconsIcon icon={UserGroupIcon} size={14} />
                </div>
                <span>Tự động phân quyền & đồng bộ dữ liệu Supabase</span>
              </div>
            </div>

            {/* Primary Action Button: Direct Google Account Chooser via Auth0 */}
            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAuth0Login}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#10D9A3] px-6 py-3.5 text-sm font-bold text-[#0B1F1A] shadow-xs transition-all hover:bg-[#05966B] hover:text-white hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#10D9A3] active:scale-[0.99]"
              >
                <HugeiconsIcon icon={Login01Icon} size={20} />
                <span>Tiếp tục với Google</span>
              </button>

              {/* Development Mock Option (chỉ hiển thị khi bật cờ NEXT_PUBLIC_ALLOW_MOCK_AUTH) */}
              {isMockActive ? (
                <button
                  type="button"
                  onClick={handleMockLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#C9F2E3] bg-white px-4 py-2.5 text-xs font-semibold text-[#05966B] transition-colors hover:bg-[#E8FBF4]"
                >
                  <span>Chế độ Giả lập Nhanh (Local Dev)</span>
                </button>
              ) : null}
            </div>

            {/* Security Guarantee / Compliance Footer */}
            <p className="mt-8 text-[11px] text-[#4B665D]/80 leading-relaxed">
              Bằng việc đăng nhập, bạn đồng ý với Quy chế sinh hoạt phòng họp và cam kết điểm danh đúng giờ tại DiemDanhCMDN.
            </p>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
