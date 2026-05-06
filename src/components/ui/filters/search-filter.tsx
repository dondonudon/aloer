"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Override the default flex-1 behavior (e.g. fixed width on dense bars) */
  className?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchFilterProps) {
  return (
    <div className={`relative ${className ?? "flex-1 min-w-[200px]"}`}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        aria-hidden="true"
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        aria-label={placeholder}
      />
    </div>
  );
}
