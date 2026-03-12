type ResultsSummaryProps = {
  count: number;
};

export function ResultsSummary({ count }: ResultsSummaryProps) {
  const label = count === 1 ? "shared title" : "shared titles";

  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-stone-300/65" />
      <p className="text-[11px] tracking-[0.2em] text-stone-600 uppercase">
        {count} {label}
      </p>
      <span className="h-px flex-1 bg-stone-300/65" />
    </div>
  );
}
