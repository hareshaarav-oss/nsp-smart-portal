export function TricolourStrip({ className = "" }: { className?: string }) {
  return (
    <div className={`tri-strip ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
