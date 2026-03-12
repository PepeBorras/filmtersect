import { SharedTitleItem } from "@/components/results/SharedTitleItem";
import type { SharedTitle } from "@/lib/types/filmtersect";

type ResultsListProps = {
  items: SharedTitle[];
  personAName: string;
  personBName: string;
};

export function ResultsList({ items, personAName, personBName }: ResultsListProps) {
  return (
    <div className="space-y-5 min-w-0">
      {items.map((item) => (
        <SharedTitleItem
          key={`${item.mediaType}:${item.id}`}
          item={item}
          personAName={personAName}
          personBName={personBName}
        />
      ))}
    </div>
  );
}
