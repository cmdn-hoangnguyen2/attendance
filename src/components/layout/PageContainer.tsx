"use client";

import React from "react";

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "main" | "div" | "section";
}

/**
 * Standardized Section Layout container across all DiemDanhCMDN pages.
 * Enforces unified max-width (max-w-7xl = 1280px), horizontal padding (px-6 = 24px),
 * vertical padding (py-8 = 32px), and vertical spacing (space-y-8 = 32px).
 * Conforms 100% to 8pt-grid-spacing and zhon-conventions.
 */
export function PageContainer({
  children,
  className = "",
  as: Component = "main",
}: PageContainerProps) {
  return (
    <Component className={`mx-auto max-w-7xl px-6 py-8 space-y-8 ${className}`.trim()}>
      {children}
    </Component>
  );
}
