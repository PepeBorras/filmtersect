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
    <article className="flex items-start gap-3.5 border-b border-stone-300/45 pb-5 last:border-b-0 last:pb-0">
      <a
        href={tmdbTitleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-28 w-18 shrink-0 overflow-hidden rounded-xl border border-white/60 bg-stone-200 shadow-[0_16px_30px_-22px_rgba(31,24,18,0.65)]"
        aria-label={`Open ${item.title} on TMDb`}
      >
        {posterUrl ? (
          <Image src={posterUrl} alt={`${item.title} poster`} fill sizes="72px" className="object-cover" />
        ) : (
          <div className="relative h-full w-full bg-linear-to-br from-stone-200 via-stone-100 to-zinc-200" aria-hidden="true">
            <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] tracking-[0.05em] text-stone-500">
              NO POSTER
            </span>
          </div>
        )}
      </a>

      <div className="min-w-0 space-y-1.5 text-left">
        <a
          href={tmdbTitleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="wrap-break-word text-[15px] leading-snug font-medium tracking-tight text-stone-900 underline-offset-2 hover:underline"
        >
          {item.title}
          {item.year ? <span className="ml-1 text-stone-500">({item.year})</span> : null}
        </a>
        <p className="wrap-break-word text-[11px] leading-relaxed text-stone-600">
          <span className="font-medium text-stone-700">{personAName}</span> — {item.personARole}
        </p>
        <p className="wrap-break-word text-[11px] leading-relaxed text-stone-600">
          <span className="font-medium text-stone-700">{personBName}</span> — {item.personBRole}
        </p>
      </div>
    </article>
  );
}
