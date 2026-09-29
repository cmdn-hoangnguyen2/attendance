"use client";

import React, { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

export interface DropdownFilterItem<T extends string> {
  key: T;
  label: string;
}

export interface DropdownFilterProps<T extends string> {
  items: DropdownFilterItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  label?: string;
}

export function DropdownFilter<T extends string>({
  items,
  activeKey,
  onChange,
  label,
}: DropdownFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 w-full min-w-[160px] rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-xs transition-all hover:bg-neutral-50 hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-neutral-200 focus:outline-none"
      >
        <span>
          {label && <span className="text-neutral-500 font-normal mr-1">{label}:</span>}
          {activeItem?.label || "Chọn..."}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-full min-w-[200px] origin-top-right rounded-2xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-2">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onChange(item.key);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeKey === item.key
                    ? "bg-primary/10 text-primary-dark"
                    : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <span>{item.label}</span>
                {activeKey === item.key && (
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-primary-dark" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
