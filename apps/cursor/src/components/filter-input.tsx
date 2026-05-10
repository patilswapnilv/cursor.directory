import { useState } from "react";
import { SearchField } from "@/components/ui/search-field";

interface FilterInputProps {
  onSearch: (term: string) => void;
  clearSearch: () => void;
}

export const FilterInput = ({ onSearch, clearSearch }: FilterInputProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    onSearch(term);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
    clearSearch();
  };

  return (
    <div className="mb-3 ml-3 mr-2">
      <SearchField
        placeholder="Search..."
        value={searchTerm}
        onChange={(value) => {
          const term = value.toLowerCase();
          setSearchTerm(term);
          onSearch(term);
        }}
        onClear={handleClear}
      />
    </div>
  );
};
