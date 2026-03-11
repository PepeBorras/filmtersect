import Image from "next/image";

import { getTmdbPosterImageUrl } from "@/lib/tmdb/image";
import type { SharedTitle } from "@/lib/types/filmtersect";

type SharedTitleItemProps = {
  item: SharedTitle;
  personAName: string;
  personBName: string;
};

export function SharedTitleItem({ item, personAName, personBName }: SharedTitleItemProps) {
  const posterUrl = getTmdbPosterImageUrl(item.posterPath, "w154");

  return (
    <article className="flex items-start gap-3 border-b border-stone-300/50 pb-4 last:border-b-0 last:pb-0">
      <div className="relative h-22 w-14.5 shrink-0 overflow-hidden rounded-sm bg-stone-200">
        {posterUrl ? (
          <Image src={posterUrl} alt={`${item.title} poster`} fill sizes="58px" className="object-cover" />
        ) : (
          <div className="relative h-full w-full bg-linear-to-br from-stone-200 via-stone-100 to-zinc-200" aria-hidden="true">
            <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] tracking-[0.05em] text-stone-500">
              NO POSTER
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-1 text-left">
        <p className="break-words text-[14px] leading-snug tracking-tight text-stone-900">
          {item.title} {item.year ? `(${item.year})` : ""}
        </p>
        <p className="break-words text-[11px] leading-relaxed text-stone-600">{personAName} — {item.personARole}</p>
        <p className="break-words text-[11px] leading-relaxed text-stone-600">{personBName} — {item.personBRole}</p>
      </div>
    </article>
  );
}
