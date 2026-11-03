// Sigil's own mark: an original stamp (rounded square seal with a four-point spark and a tick).
// Not the CESAC mark and not a circled 4.
export function SigilLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="3" y="3" width="42" height="42" rx="11" fill="#1F6FD1" stroke="#0B2350" strokeWidth="3" />
      <rect x="8" y="8" width="32" height="32" rx="7" fill="none" stroke="#FFF5E3" strokeWidth="1.6" strokeDasharray="3 3" />
      <path d="M24 10 26.4 21.6 38 24 26.4 26.4 24 38 21.6 26.4 10 24 21.6 21.6Z" fill="#FFB23A" stroke="#0B2350" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m19.5 24.2 3.2 3.2 6-6.4" fill="none" stroke="#0B2350" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
