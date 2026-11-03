"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "./i18n-provider";

export function SampleTag({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("tag sample-tag", className)} data-testid="sample-tag">
      {t.sample.badge}
    </span>
  );
}
