"use client";

import React, { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectDropdownProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

/**
 * Premium custom dropdown component adhering to DiemDanhCMDN Design System.
 * Replaces default HTML <select> with accessible, customizable, and animated dropdown.
 * Strictly conforms to 8pt-grid-spacing and zhon-conventions.
 */
export function SelectDropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Chọn một mục...",
  disabled = false,
  className = "",
  id,
  ariaLabel,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button: bo góc 12px (rounded-xl), padding 8px trên dưới, 16px hai bên (py-2 px-4) */}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-border bg-white px-4 py-2 text-xs font-semibold text-neutral-dark shadow-xs transition-all hover:border-primary focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          isOpen ? "border-primary ring-2 ring-primary/20" : ""
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          className={`shrink-0 text-neutral-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary-dark" : ""
          }`}
        />
      </button>

      {/* Floating Menu List: bo góc 16px (rounded-2xl), padding 8px (p-2), shadow-xl */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-2 max-h-60 w-full min-w-[200px] overflow-auto rounded-2xl border border-neutral-border bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 focus:outline-hidden"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-neutral-surface font-bold text-primary-dark"
                    : "text-neutral-dark hover:bg-neutral-50"
                } ${
                  option.disabled
                    ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-0.5 truncate">
                  <span className="truncate">{option.label}</span>
                  {option.description ? (
                    <span className="text-[11px] font-normal text-neutral-muted">
                      {option.description}
                    </span>
                  ) : null}
                </div>
                {isSelected ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={16}
                    className="shrink-0 text-primary-dark"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
