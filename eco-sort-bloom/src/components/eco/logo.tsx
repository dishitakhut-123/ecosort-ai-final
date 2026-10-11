export function EcoSortMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <path
        d="M28 12c0 8.5-5.2 14-12.4 14.6C14.2 22 17.6 15.6 25 13.2c-6.9.9-11.6 5.4-12.7 12.3-1.4-3.9-1-8 1.3-10.7C16.4 11.6 22 11.2 28 12Z"
        fill="currentColor"
      />
      <path d="M11 30c1.6-2.6 3.6-4.8 6-6.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function EcoSortWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 text-primary ${className}`}>
      <EcoSortMark className="h-7 w-7" />
      <span className="text-display text-lg tracking-tight">EcoSort</span>
    </span>
  );
}
