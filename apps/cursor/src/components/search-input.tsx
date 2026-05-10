"use client";

import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { SearchField } from "./ui/search-field";

export function SearchInput({
  placeholder,
  className,
  shallow = true,
}: {
  placeholder: string;
  className?: string;
  shallow?: boolean;
}) {
  const [search, setSearch] = useQueryState("q", {
    defaultValue: "",
    shallow,
  });

  const handleClear = () => setSearch("");

  return (
    <SearchField
      placeholder={placeholder}
      value={search}
      onChange={setSearch}
      onClear={handleClear}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClear();
      }}
      className={cn("w-full", className)}
    />
  );
}
