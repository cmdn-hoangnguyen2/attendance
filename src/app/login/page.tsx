"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthMock } from "@/context/AuthMockContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { HugeiconsIcon } from "@hugeicons/react";
import { Login01Icon } from "@hugeicons/core-free-icons";

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
        {/* Clean Centered Authentication Card */}
        <section
          aria-labelledby="login-title"
          className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10 shadow-xs flex flex-col items-center text-center"
        >
          {/* Brand Logo: 56x56px (8-point grid: 8x7=56) */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10D9A3] to-[#05966B] text-white shadow-xs mb-5">
            <span className="font-extrabold text-xl tracking-wider">CM</span>
          </div>

          {/* Title & Concise Subtitle */}
          <h1 id="login-title" className="text-xl font-extrabold tracking-tight text-neutral-900">
            Đăng nhập DiemDanhCMDN
          </h1>
          <p className="mt-1 text-xs text-neutral-500 leading-relaxed mb-8">
            Hệ thống điểm danh & quản lý quỹ phòng họp
          </p>

          {/* Action Buttons (Pill Layout) */}
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAuth0Login}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#10D9A3] px-6 py-3.5 text-sm font-bold text-neutral-900 shadow-xs transition-all hover:bg-[#05966B] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10D9A3] active:scale-[0.99]"
            >
              <HugeiconsIcon icon={Login01Icon} size={18} />
              <span>Tiếp tục với Google</span>
            </button>

            {isMockActive ? (
              <button
                type="button"
                onClick={handleMockLogin}
                className="flex w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                <span>Chế độ Giả lập (Dev)</span>
              </button>
            ) : null}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
