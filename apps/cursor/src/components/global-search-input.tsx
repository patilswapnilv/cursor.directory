"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { SearchField } from "./ui/search-field";

export function GlobalSearchInput() {
  const [search, setSearch] = useQueryState("q", { defaultValue: "" });
  const router = useRouter();

  const placeholder = "Search plugins...";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/plugins?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <form className="h-full w-full" onSubmit={handleSubmit}>
        <SearchField
          value={search}
          onChange={setSearch}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          size="hero"
        />
      </form>
    </div>
  );
}
