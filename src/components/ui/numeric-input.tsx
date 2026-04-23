"use client";

import type { InputHTMLAttributes } from "react";
import { useCallback, useId, useState } from "react";

interface NumericInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  error?: string;
  onChange?: (e: { target: { value: string } }) => void;
}

function format(raw: string): string {
  if (!raw) return "";
  const [int, dec] = raw.split(".");
  const formatted = (int || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

function strip(s: string): string {
  // Allow digits and at most one decimal point; strip everything else
  const cleaned = s.replace(/,/g, "").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
}

export function NumericInput({
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  label,
  error,
  id,
  className = "",
  // Not forwarded — invalid on type="text" inputs
  min: _min,
  max: _max,
  step: _step,
  ...props
}: NumericInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isControlled = value !== undefined;
  const [raw, setRaw] = useState(String(defaultValue ?? ""));
  const [focused, setFocused] = useState(false);

  const currentRaw = isControlled ? String(value ?? "") : raw;
  const displayValue = focused ? currentRaw : format(currentRaw);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const stripped = strip(e.target.value);
      if (!isControlled) setRaw(stripped);
      onChange?.({ target: { value: stripped } });
    },
    [isControlled, onChange],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const inputClass = `block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500${error ? " border-red-500 focus:border-red-500 focus:ring-red-500" : ""} ${className}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        type="text"
        inputMode="numeric"
        className={inputClass}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {name && <input type="hidden" name={name} value={currentRaw} />}
      {error && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
