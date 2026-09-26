"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_PALETTE } from "./constants";

interface ColorPickerPopoverProps {
  value: string | null;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export default function ColorPickerPopover({
  value,
  onChange,
  disabled = false,
}: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentColor = value || CATEGORY_PALETTE[0].hex;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
        title="Change color"
        aria-label="Select category color"
        aria-expanded={isOpen}
      >
        <span
          className="h-5 w-5 rounded-full shadow-xs transition-shadow group-hover:ring-2 group-hover:ring-border/80"
          style={{ backgroundColor: currentColor }}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-border/80 bg-popover p-2.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Select Color
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORY_PALETTE.map((item) => {
              const isSelected =
                currentColor.toLowerCase() === item.hex.toLowerCase();
              return (
                <button
                  key={item.hex}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    onChange(item.hex);
                    setIsOpen(false);
                  }}
                  className="group relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full shadow-xs"
                    style={{ backgroundColor: item.hex }}
                  >
                    {isSelected && (
                      <svg
                        className="h-3.5 w-3.5 text-white drop-shadow-xs"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
