export default function FullscreenButton({ fullscreen, label }) {
  const title = fullscreen.expanded ? `${label}: kichraytirish` : `${label}: to‘liq ekran`;
  return <button type="button" className="icon-button fullscreen-button" onClick={fullscreen.toggle}
    aria-label={title} title={title} aria-pressed={fullscreen.expanded}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={fullscreen.expanded
        ? "M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6"
        : "M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"} />
    </svg>
  </button>;
}
