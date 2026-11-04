"use client";

// PDF reading in the browser, so a resume or certificate never has to be uploaded. pdf.js loads only when needed.
async function load() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return pdfjs;
}

export async function pdfText(file: Blob): Promise<string> {
  const pdfjs = await load();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    let line = "";
    let lastY: number | null = null;
    const lines: string[] = [];
    for (const it of c.items as { str: string; transform: number[] }[]) {
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim());
        line = "";
      }
      line += it.str + " ";
      lastY = y;
    }
    lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }
  return pages.join("\n\n");
}

/** Renders page one to a PNG for the tamper check. */
export async function pdfFirstPage(file: Blob): Promise<Blob> {
  const pdfjs = await load();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("render"))), "image/png"));
}
