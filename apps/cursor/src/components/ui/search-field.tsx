"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  size?: "default" | "hero";
};

export function SearchField({
  value,
  onChange,
  placeholder,
  onKeyDown,
  onClear,
  className,
  inputClassName,
  size = "default",
}: SearchFieldProps) {
  const isHero = size === "hero";

  return (
    <div
      className={cn(
        "flex w-full items-center overflow-hidden rounded-full border border-border bg-card text-foreground",
        isHero ? "h-[58px] px-5" : "h-11 px-4",
        className,
      )}
    >
      <Search
        className={cn(
          "pointer-events-none shrink-0 text-text-quaternary",
          isHero ? "size-4" : "size-3.5",
        )}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(
          "h-full flex-1 bg-transparent px-3 text-foreground placeholder:text-text-quaternary focus:outline-none",
          isHero
            ? "text-[15px] tracking-[0.005em]"
            : "text-sm tracking-[0.005em]",
          inputClassName,
        )}
      />
      {onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex size-7 items-center justify-center rounded-full text-text-quaternary transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
