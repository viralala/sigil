// Traffic light. Always colour + icon + word (UX_SPEC.md), so it works for colour-blind readers too.
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

export type Tone = "green" | "yellow" | "red";

const LOOK: Record<Tone, { icon: IconName; cls: string }> = {
  green: { icon: "check", cls: "bg-ok text-white" },
  yellow: { icon: "warn", cls: "bg-warn text-ink" },
  red: { icon: "cross", cls: "bg-bad text-white" },
};

export function StatusBadge({
  tone,
  label,
  size = "md",
  className,
}: {
  tone: Tone;
  label: string;
  size?: "md" | "xl";
  className?: string;
}) {
  const l = LOOK[tone];
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-2 border-2 border-navy font-display font-black uppercase",
        size === "xl"
          ? "rounded-[18px] px-5 py-3 text-5xl leading-none shadow-hard-3 sm:text-6xl"
          : "rounded-[var(--r-tag)] px-2.5 py-1 text-base leading-none shadow-hard-1",
        l.cls,
        className,
      )}
    >
      <Icon name={l.icon} className={size === "xl" ? "text-[0.9em]" : "text-[1.1em]"} />
      {label}
    </span>
  );
}
