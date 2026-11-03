"use client";

import { useEffect, useState } from "react";
import { SPEECH_LANG } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "./i18n-provider";

/** Reads a result out loud with the browser's own voice (Web Speech API). Hidden if the browser has none. */
export function ReadAloud({ text }: { text: string }) {
  const { locale, t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  function toggle() {
    const s = window.speechSynthesis;
    if (speaking) {
      s.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH_LANG[locale];
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    s.cancel();
    s.speak(u);
    setSpeaking(true);
  }

  return (
    <Button tone="cream" onClick={toggle} aria-pressed={speaking} data-testid="read-aloud">
      <Icon name={speaking ? "stop" : "speaker"} />
      {speaking ? t.result.stopReading : t.result.readAloud}
    </Button>
  );
}
