type ResultsSummaryProps = {
  count: number;
};

export function ResultsSummary({ count }: ResultsSummaryProps) {
  const label = count === 1 ? "shared title" : "shared titles";

  return <p className="text-sm tracking-tight text-stone-700">{count} {label}</p>;
}
