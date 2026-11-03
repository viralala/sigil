"use client";

import { useEffect, useRef } from "react";
import jsQR from "jsqr";

export type ScanError = "CAMERA_DENIED" | "CAMERA_MISSING";

/** Live camera QR reader. Calls onResult once with the decoded text; always releases the camera. */
export function QrScanner({
  hint,
  onResult,
  onError,
}: {
  hint: string;
  onResult: (text: string) => void;
  onError: (e: ScanError) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function tick() {
      const v = video.current;
      if (!done.current && v && ctx && v.readyState >= 2 && v.videoWidth) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          done.current = true;
          onResult(code.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    }

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return onError("CAMERA_MISSING");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => undefined);
        }
        raf = requestAnimationFrame(tick);
      } catch (e) {
        const name = (e as DOMException).name;
        onError(name === "NotFoundError" || name === "OverconstrainedError" ? "CAMERA_MISSING" : "CAMERA_DENIED");
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult, onError]);

  return (
    <figure className="m-0">
      <video
        ref={video}
        muted
        playsInline
        className="aspect-square w-full max-w-sm rounded-[var(--r-md)] border-2 border-navy bg-ink object-cover"
        data-testid="qr-video"
      />
      <figcaption className="mt-2 font-medium">{hint}</figcaption>
    </figure>
  );
}
