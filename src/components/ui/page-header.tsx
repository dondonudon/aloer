"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

/**
 * Page header with a back navigation link and title.
 * Optionally renders action buttons via children.
 */
export function PageHeader({
  title,
  backHref,
  backLabel,
  children,
}: PageHeaderProps) {
  const { t } = useI18n();
  const resolvedLabel = backLabel ?? t.common.back;
  return (
    <div className="space-y-2">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {resolvedLabel}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h1>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
