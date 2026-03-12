import { z } from "zod";

import { isSelfAppearanceCharacter } from "@/lib/filmtersect/is-self-appearance";
import { tmdbFetch } from "@/lib/tmdb/fetch";
import type { ClosestConnection, NormalizedCredit } from "@/lib/types/filmtersect";

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

const creditsSchema = z.object({
  cast: z
    .array(
      z.object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        character: z.string().nullable().optional(),
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

async function buildCollaboratorMap(
  personId: number,
  normalizedCredits: NormalizedCredit[],
  excludedPersonId: number,
): Promise<Map<number, CollaboratorCounter>> {
  const uniqueTitles = Array.from(new Map(normalizedCredits.map((credit) => [titleKey(credit), credit])).values())
    .sort(compareCredits)
    .slice(0, MAX_TITLES_TO_SCAN);

  if (!uniqueTitles.length) {
    return new Map();
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

    (parsed.data.cast ?? []).forEach((entry) => {
      const collaboratorId = entry.id ?? null;
      const collaboratorName = entry.name?.trim() ?? "";

      if (
        !collaboratorId ||
        collaboratorId === personId ||
        collaboratorId === excludedPersonId ||
        !collaboratorName ||
        isSelfAppearanceCharacter(entry.character)
      ) {
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

    (parsed.data.crew ?? []).forEach((entry) => {
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

  return collaboratorMap;
}

function compareClosestCandidates(
  left: ClosestConnection,
  right: ClosestConnection,
): number {
  const leftScore = left.personASharedCount + left.personBSharedCount;
  const rightScore = right.personASharedCount + right.personBSharedCount;

  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  const leftMin = Math.min(left.personASharedCount, left.personBSharedCount);
  const rightMin = Math.min(right.personASharedCount, right.personBSharedCount);

  if (leftMin !== rightMin) {
    return rightMin - leftMin;
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

export async function findClosestConnection(
  personAId: number,
  normalizedA: NormalizedCredit[],
  personBId: number,
  normalizedB: NormalizedCredit[],
): Promise<ClosestConnection | null> {
  const [mapA, mapB] = await Promise.all([
    buildCollaboratorMap(personAId, normalizedA, personBId),
    buildCollaboratorMap(personBId, normalizedB, personAId),
  ]);

  const sharedCandidates: ClosestConnection[] = [];

  mapA.forEach((collaboratorA, collaboratorId) => {
    const collaboratorB = mapB.get(collaboratorId);
    if (!collaboratorB) {
      return;
    }

    sharedCandidates.push({
      personId: collaboratorId,
      name: collaboratorA.name,
      profilePath: collaboratorA.profilePath ?? collaboratorB.profilePath,
      personASharedCount: collaboratorA.titleKeys.size,
      personBSharedCount: collaboratorB.titleKeys.size,
    });
  });

  if (!sharedCandidates.length) {
    return null;
  }

  return sharedCandidates.sort(compareClosestCandidates)[0] ?? null;
}
