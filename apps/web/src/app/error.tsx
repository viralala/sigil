"use client";

import { useI18n } from "@/components/site/i18n-provider";

export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  const c = t.site.errorPage;
  return (
    <div className="wrap pt-32 pb-16">
      <div className="card mx-auto grid max-w-xl gap-4 p-6">
        <h1 className="text-5xl">{c.title}</h1>
        <p className="m-0 text-lg font-medium">{c.body}</p>
        <button type="button" className="btn btn-flame" onClick={reset}>
          {c.cta}
        </button>
      </div>
    </div>
  );
}
