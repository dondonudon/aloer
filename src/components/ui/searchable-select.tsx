"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  error?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function SearchableSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  noResultsLabel = "No results",
  disabled = false,
  id,
  className = "",
}: SearchableSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const listboxId = `${fieldId}-listbox`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setHighlightedIndex(0);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectIndex(i: number) {
    const opt = filtered[i];
    if (!opt) return;
    onChange(opt.value);
    close();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) =>
        filtered.length === 0 ? 0 : Math.min(filtered.length - 1, i + 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectIndex(highlightedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={fieldId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-left text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          } ${className}`}
        >
          <span
            className={`truncate ${
              selected
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-gray-400"
            aria-hidden="true"
          />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <div className="relative border-b border-gray-200 dark:border-gray-700 p-2">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                aria-controls={listboxId}
                aria-autocomplete="list"
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-1.5 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="max-h-60 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {noResultsLabel}
                </div>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = i === highlightedIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={isSelected}
                      onClick={() => selectIndex(i)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        isHighlighted
                          ? "bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check
                          className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
