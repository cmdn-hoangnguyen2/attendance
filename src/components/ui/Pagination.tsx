"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const isPreviousDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return (
    <nav className="Pagination flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang">
      <p className="Pagination__summary text-sm leading-6 text-text-secondary">
        Trang <strong className="Pagination__current font-semibold text-text-primary">{currentPage}</strong>
        {" / "}
        <span className="Pagination__total">{totalPages}</span>
      </p>
      <div className="Pagination__actions grid grid-cols-2 gap-2 sm:flex">
        <button
          className={cn("Pagination__button Pagination__button--previous", "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text-secondary", "hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10")}
          type="button"
          disabled={isPreviousDisabled}
          onClick={() => onPageChange(previousPage)}
          aria-label="Trang trước"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden />
          <span className="Pagination__button-label">Trước</span>
        </button>
        <button
          className={cn("Pagination__button Pagination__button--next", "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text-secondary", "hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10")}
          type="button"
          disabled={isNextDisabled}
          onClick={() => onPageChange(nextPage)}
          aria-label="Trang sau"
        >
          <span className="Pagination__button-label">Sau</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
