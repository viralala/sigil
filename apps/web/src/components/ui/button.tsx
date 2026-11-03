// Ported from CESAC f4.css `.btn`: rounded rectangle, navy outline, hard offset shadow. Never a pill.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("btn", {
  variants: {
    tone: { flame: "btn-flame", royal: "btn-royal", cream: "btn-cream", ghost: "btn-ghost" },
    block: { true: "w-full", false: "" },
  },
  defaultVariants: { tone: "flame", block: false },
});

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Shows `busyLabel`, sets aria-busy and blocks clicks while work runs. */
    busy?: boolean;
    busyLabel?: string;
  };

export function Button({ className, tone, block, busy, busyLabel, children, disabled, type, ...rest }: Props) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ tone, block }), className)}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      {...rest}
    >
      {busy ? (
        <>
          <span className="busy-dot" aria-hidden />
          {busyLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
