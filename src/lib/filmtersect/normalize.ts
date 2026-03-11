import type { TmdbCombinedCreditsResponse } from "@/lib/tmdb/types";
import { isSelfAppearanceCharacter } from "@/lib/filmtersect/is-self-appearance";
import type { NormalizedCredit } from "@/lib/types/filmtersect";

function toYear(date: string | null): number | null {
  if (!date) {
    return null;
  }

  const [year] = date.split("-");
  const parsed = Number(year);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeCombinedCredits(personId: number, credits: TmdbCombinedCreditsResponse): NormalizedCredit[] {
  const castNormalized: NormalizedCredit[] = credits.cast
    .filter((credit) => !isSelfAppearanceCharacter(credit.character))
    .map((credit) => {
    const releaseDate = credit.media_type === "movie" ? (credit.release_date ?? null) : (credit.first_air_date ?? null);
    const titleName = credit.media_type === "movie" ? (credit.title ?? "Untitled") : (credit.name ?? "Untitled");

    return {
      personId,
      creditType: "cast",
      titleId: credit.id,
      mediaType: credit.media_type,
      titleName,
      releaseDate,
      year: toYear(releaseDate),
      posterPath: credit.poster_path ?? null,
      character: credit.character ?? null,
      job: null,
      department: null,
    };
    });

  const crewNormalized: NormalizedCredit[] = credits.crew.map((credit) => {
    const releaseDate = credit.media_type === "movie" ? (credit.release_date ?? null) : (credit.first_air_date ?? null);
    const titleName = credit.media_type === "movie" ? (credit.title ?? "Untitled") : (credit.name ?? "Untitled");

    return {
      personId,
      creditType: "crew",
      titleId: credit.id,
      mediaType: credit.media_type,
      titleName,
      releaseDate,
      year: toYear(releaseDate),
      posterPath: credit.poster_path ?? null,
      character: null,
      job: credit.job ?? null,
      department: credit.department ?? null,
    };
  });

  return [...castNormalized, ...crewNormalized];
}
