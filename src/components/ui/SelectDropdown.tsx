"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

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

export function SelectDropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "Chọn một mục...",
  disabled = false,
  className,
  id,
  ariaLabel,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedOutside =
        containerRef.current && !containerRef.current.contains(event.target as Node);
      if (clickedOutside) setIsOpen(false);
    }

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const optionElements = options.map((option) => {
    const isSelected = option.value === value;
    const descriptionContent = option.description ? (
      <span className="SelectDropdown__option-description text-xs font-normal leading-4 text-text-tertiary">
        {option.description}
      </span>
    ) : null;
    const selectedIcon = isSelected ? (
      <HugeiconsIcon
        className="SelectDropdown__selected-icon shrink-0 text-primary"
        icon={CheckmarkCircle01Icon}
        size={16}
        aria-hidden
      />
    ) : null;

    return (
      <button
        className={cn(
          "SelectDropdown__option",
          isSelected && "SelectDropdown__option--selected",
          "flex min-h-12 w-full items-center justify-between gap-4 rounded-md px-4 py-2 text-left text-sm transition-colors",
          isSelected
            ? "bg-primary-soft font-semibold text-primary-active"
            : "text-text-primary hover:bg-surface-subtle",
          option.disabled && "cursor-not-allowed opacity-50",
        )}
        key={option.value}
        type="button"
        disabled={option.disabled}
        onClick={() => handleSelect(option)}
        role="option"
        aria-selected={isSelected}
      >
        <span className="SelectDropdown__option-content flex min-w-0 flex-col gap-1">
          <span className="SelectDropdown__option-label truncate">{option.label}</span>
          {descriptionContent}
        </span>
        {selectedIcon}
      </button>
    );
  });

  const menuContent = isOpen ? (
    <div
      className="SelectDropdown__menu absolute z-50 mt-2 max-h-60 w-full min-w-[200px] overflow-auto rounded-lg border border-border bg-surface p-2 shadow-lg"
      tabIndex={-1}
      role="listbox"
    >
      {optionElements}
    </div>
  ) : null;

  return (
    <div
      className={cn("SelectDropdown", "relative inline-block text-left", className)}
      ref={containerRef}
    >
      <button
        className={cn(
          "SelectDropdown__trigger",
          isOpen && "SelectDropdown__trigger--open",
          "flex min-h-12 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors",
          "hover:border-border-strong focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:min-h-10",
          isOpen && "border-primary",
        )}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="SelectDropdown__value truncate">{selectedLabel}</span>
        <HugeiconsIcon
          className={cn(
            "SelectDropdown__chevron",
            "shrink-0 text-text-tertiary transition-transform duration-150",
            isOpen && "rotate-180 text-primary",
          )}
          icon={ArrowDown01Icon}
          size={16}
          aria-hidden
        />
      </button>
      {menuContent}
    </div>
  );
}
