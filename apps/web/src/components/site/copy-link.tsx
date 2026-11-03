"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "./i18n-provider";

export function CopyLink({ url }: { url: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "fail">("idle");

  async function copy() {
    setState("busy");
    try {
      await navigator.clipboard.writeText(url);
      setState("ok");
    } catch {
      setState("fail");
    }
  }

  return (
    <div className="grid gap-2">
      <Button tone="cream" block onClick={copy} busy={state === "busy"} data-testid="copy-link">
        <Icon name="copy" /> {t.holder.copy}
      </Button>
      <p role="status" className="m-0 min-h-6 font-bold" data-testid="copy-status">
        {state === "ok" ? t.holder.copied : state === "fail" ? t.holder.copyFailed : ""}
      </p>
    </div>
  );
}
