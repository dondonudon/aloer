"use client";

import { AlertCircle, CheckCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      )}
      <p className="text-sm">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 p-1 rounded-md hover:bg-black/5"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
