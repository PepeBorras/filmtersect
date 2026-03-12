import Image from "next/image";

import { getTmdbPosterImageUrl, getTmdbTitlePageUrl } from "@/lib/tmdb/image";
import type { SharedTitle } from "@/lib/types/filmtersect";

type SharedTitleItemProps = {
  item: SharedTitle;
  personAName: string;
  personBName: string;
};

export function SharedTitleItem({ item, personAName, personBName }: SharedTitleItemProps) {
  const posterUrl = getTmdbPosterImageUrl(item.posterPath, "w154");
  const tmdbTitleUrl = getTmdbTitlePageUrl(item.mediaType, item.id);

  return (
    <article className="flex items-start gap-3 border-b border-stone-300/50 pb-4 last:border-b-0 last:pb-0">
      <a
        href={tmdbTitleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-22 w-14.5 shrink-0 overflow-hidden rounded-sm bg-stone-200"
        aria-label={`Open ${item.title} on TMDb`}
      >
        {posterUrl ? (
          <Image src={posterUrl} alt={`${item.title} poster`} fill sizes="58px" className="object-cover" />
        ) : (
          <div className="relative h-full w-full bg-linear-to-br from-stone-200 via-stone-100 to-zinc-200" aria-hidden="true">
            <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] tracking-[0.05em] text-stone-500">
              NO POSTER
            </span>
          </div>
        )}
      </a>

      <div className="min-w-0 space-y-1 text-left">
        <a
          href={tmdbTitleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="wrap-break-word text-[14px] leading-snug tracking-tight text-stone-900 underline-offset-2 hover:underline"
        >
          {item.title} {item.year ? `(${item.year})` : ""}
        </a>
        <p className="wrap-break-word text-[11px] leading-relaxed text-stone-600">{personAName} — {item.personARole}</p>
        <p className="wrap-break-word text-[11px] leading-relaxed text-stone-600">{personBName} — {item.personBRole}</p>
      </div>
    </article>
  );
}
