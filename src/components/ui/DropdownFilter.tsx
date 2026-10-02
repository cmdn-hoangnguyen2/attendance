"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

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

export function DropdownFilter<T extends string>({ items, activeKey, onChange, label }: DropdownFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeItem = items.find((item) => item.key === activeKey);
  const activeLabel = activeItem?.label ?? "Chọn...";
  const labelContent = label ? (
    <span className="DropdownFilter__prefix font-normal text-text-tertiary">{label}:</span>
  ) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedOutside =
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      if (clickedOutside) setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const itemElements = items.map((item) => {
    const isActive = activeKey === item.key;
    const activeIcon = isActive ? (
      <HugeiconsIcon className="DropdownFilter__selected-icon shrink-0 text-primary" icon={CheckmarkBadge01Icon} size={16} aria-hidden />
    ) : null;
    const handleItemSelect = () => {
      onChange(item.key);
      setIsOpen(false);
    };

    return (
      <button
        className={cn(
          "DropdownFilter__option",
          isActive && "DropdownFilter__option--active",
          "flex min-h-12 w-full items-center justify-between gap-4 rounded-md px-4 py-2 text-left text-sm font-medium transition-colors",
          isActive
            ? "bg-primary-soft text-primary-active"
            : "text-text-primary hover:bg-surface-subtle",
        )}
        key={item.key}
        type="button"
        onClick={handleItemSelect}
        role="option"
        aria-selected={isActive}
      >
        <span className="DropdownFilter__option-label">{item.label}</span>
        {activeIcon}
      </button>
    );
  });

  const menuContent = isOpen ? (
    <div className="DropdownFilter__menu absolute right-0 z-50 mt-2 w-full min-w-[200px] rounded-lg border border-border bg-surface p-2 shadow-lg" role="listbox">
      {itemElements}
    </div>
  ) : null;

  return (
    <div className="DropdownFilter relative inline-block text-left" ref={dropdownRef}>
      <button
        className={cn(
          "DropdownFilter__trigger",
          isOpen && "DropdownFilter__trigger--open",
          "inline-flex min-h-12 w-full min-w-40 items-center justify-between gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors",
          "hover:border-border-strong hover:bg-surface-subtle focus-visible:outline-none md:min-h-10",
          isOpen && "border-primary",
        )}
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="DropdownFilter__value flex min-w-0 items-center gap-2">
          {labelContent}
          <span className="DropdownFilter__active-label truncate">{activeLabel}</span>
        </span>
        <HugeiconsIcon
          className={cn("DropdownFilter__chevron", "shrink-0 text-text-tertiary transition-transform duration-150", isOpen && "rotate-180 text-primary")}
          icon={ArrowDown01Icon}
          size={16}
          aria-hidden
        />
      </button>
      {menuContent}
    </div>
  );
}
