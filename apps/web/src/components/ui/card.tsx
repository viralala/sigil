// Ported from CESAC `.card`: cream paper, 2px navy outline, 4px offset shadow.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...rest} />;
}
