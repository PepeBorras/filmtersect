import { z } from "zod";

import { findDirectOverlaps } from "@/lib/filmtersect/direct-overlaps";
import { normalizeCombinedCredits } from "@/lib/filmtersect/normalize";
import { tmdbFetch } from "@/lib/tmdb/fetch";
import { getTmdbPersonCombinedCredits } from "@/lib/tmdb/service";
import type { NormalizedCredit, TopCollaborator } from "@/lib/types/filmtersect";

type CreditType = "cast" | "crew";

type CollaboratorCounter = {
  personId: number;
  name: string;
  profilePath: string | null;
  titleKeys: Set<string>;
};

type ParsedCreditsByTitle = {
  key: string;
  parsed: ReturnType<typeof creditsSchema.safeParse> | null;
};

const MAX_TITLES_TO_SCAN = 60;
const TMDB_CREDITS_CONCURRENCY = 6;
const MAX_CANDIDATES_TO_VALIDATE = 20;

const creditsSchema = z.object({
  cast: z
    .array(
      z.object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        profile_path: z.string().nullable().optional(),
      }),
    )
    .optional(),
  crew: z
    .array(
      z.object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        profile_path: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

function titleKey(credit: Pick<NormalizedCredit, "mediaType" | "titleId">): string {
  return `${credit.mediaType}:${credit.titleId}`;
}

function compareCollaborators(left: CollaboratorCounter, right: CollaboratorCounter): number {
  if (left.titleKeys.size !== right.titleKeys.size) {
    return right.titleKeys.size - left.titleKeys.size;
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

function compareCredits(left: NormalizedCredit, right: NormalizedCredit): number {
  if (left.year !== right.year) {
    return (right.year ?? -1) - (left.year ?? -1);
  }

  return left.titleName.localeCompare(right.titleName, undefined, { sensitivity: "base" });
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  limit: number,
  mapper: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> {
  const safeLimit = Math.max(1, limit);
  const results: TOutput[] = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(safeLimit, items.length) }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex]);
      }
    }),
  );

  return results;
}

export async function findTopCollaboratorForPerson(
  personId: number,
  normalizedCredits: NormalizedCredit[],
  excludedPersonId: number,
  sourceCreditType: CreditType,
): Promise<TopCollaborator | null> {
  const scopedCredits = normalizedCredits.filter((credit) => credit.creditType === sourceCreditType);
  const uniqueTitles = Array.from(new Map(scopedCredits.map((credit) => [titleKey(credit), credit])).values())
    .sort(compareCredits)
    .slice(0, MAX_TITLES_TO_SCAN);

  if (!uniqueTitles.length) {
    return null;
  }

  const collaboratorMap = new Map<number, CollaboratorCounter>();

  const creditsByTitle = await mapWithConcurrency<NormalizedCredit, ParsedCreditsByTitle>(
    uniqueTitles,
    TMDB_CREDITS_CONCURRENCY,
    async (credit) => {
      const endpoint =
        credit.mediaType === "movie"
          ? `/movie/${credit.titleId}/credits?language=en-US`
          : `/tv/${credit.titleId}/credits?language=en-US`;

      let payload: unknown;
      try {
        payload = await tmdbFetch(endpoint);
      } catch {
        return {
          key: titleKey(credit),
          parsed: null,
        };
      }

      return {
        key: titleKey(credit),
        parsed: creditsSchema.safeParse(payload),
      };
    },
  );

  creditsByTitle.forEach(({ key, parsed }) => {
    if (!parsed || !parsed.success) {
      return;
    }

    const combined = sourceCreditType === "cast" ? (parsed.data.cast ?? []) : (parsed.data.crew ?? []);

    combined.forEach((entry) => {
      const collaboratorId = entry.id ?? null;
      const collaboratorName = entry.name?.trim() ?? "";

      if (!collaboratorId || collaboratorId === personId || collaboratorId === excludedPersonId || !collaboratorName) {
        return;
      }

      const existing = collaboratorMap.get(collaboratorId);
      if (!existing) {
        collaboratorMap.set(collaboratorId, {
          personId: collaboratorId,
          name: collaboratorName,
          profilePath: entry.profile_path ?? null,
          titleKeys: new Set([key]),
        });
        return;
      }

      existing.titleKeys.add(key);
      if (collaboratorName.localeCompare(existing.name, undefined, { sensitivity: "base" }) < 0) {
        existing.name = collaboratorName;
      }
      if (!existing.profilePath && entry.profile_path) {
        existing.profilePath = entry.profile_path;
      }
    });
  });

  const rankedCandidates = Array.from(collaboratorMap.values()).sort(compareCollaborators).slice(0, MAX_CANDIDATES_TO_VALIDATE);

  for (const candidate of rankedCandidates) {
    try {
      const collaboratorCredits = await getTmdbPersonCombinedCredits(candidate.personId);
      const normalizedCollaborator = normalizeCombinedCredits(candidate.personId, collaboratorCredits);
      const overlaps = findDirectOverlaps(normalizedCredits, normalizedCollaborator);

      if (!overlaps.length) {
        continue;
      }

      const overlapKeys = new Set(overlaps.map((overlap) => overlap.mediaType + ":" + String(overlap.id)));
      let validatedSharedCount = 0;
      candidate.titleKeys.forEach((key) => {
        if (overlapKeys.has(key)) {
          validatedSharedCount += 1;
        }
      });

      if (validatedSharedCount === 0) {
        continue;
      }

      return {
        personId: candidate.personId,
        name: candidate.name,
        profilePath: candidate.profilePath,
        sharedCount: validatedSharedCount,
      };
    } catch {
      continue;
    }
  }

  return null;
}
