import { z } from "zod";

import { tmdbFetch } from "@/lib/tmdb/fetch";
import type { NormalizedCredit, TopCollaborator } from "@/lib/types/filmtersect";

type CreditType = "cast" | "crew";

type CollaboratorCounter = {
  personId: number;
  name: string;
  profilePath: string | null;
  titleKeys: Set<string>;
};

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

export async function findTopCollaboratorForPerson(
  personId: number,
  normalizedCredits: NormalizedCredit[],
  excludedPersonId: number,
  sourceCreditType: CreditType,
): Promise<TopCollaborator | null> {
  const scopedCredits = normalizedCredits.filter((credit) => credit.creditType === sourceCreditType);
  const uniqueTitles = Array.from(new Map(scopedCredits.map((credit) => [titleKey(credit), credit])).values());

  if (!uniqueTitles.length) {
    return null;
  }

  const collaboratorMap = new Map<number, CollaboratorCounter>();

  const creditsByTitle = await Promise.all(
    uniqueTitles.map(async (credit) => {
      const endpoint =
        credit.mediaType === "movie"
          ? `/movie/${credit.titleId}/credits?language=en-US`
          : `/tv/${credit.titleId}/credits?language=en-US`;

      const payload = await tmdbFetch(endpoint);
      return {
        key: titleKey(credit),
        parsed: creditsSchema.safeParse(payload),
      };
    }),
  );

  creditsByTitle.forEach(({ key, parsed }) => {
    if (!parsed.success) {
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

  const top = Array.from(collaboratorMap.values()).sort(compareCollaborators)[0];

  if (!top) {
    return null;
  }

  return {
    personId: top.personId,
    name: top.name,
    profilePath: top.profilePath,
    sharedCount: top.titleKeys.size,
  };
}
