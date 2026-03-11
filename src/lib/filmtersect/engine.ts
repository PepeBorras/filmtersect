import { findDirectOverlaps } from "@/lib/filmtersect/direct-overlaps";
import { findTopCollaboratorForPerson } from "@/lib/filmtersect/find-top-collaborator";
import { normalizeCombinedCredits } from "@/lib/filmtersect/normalize";
import { getTmdbPersonCombinedCredits } from "@/lib/tmdb/service";
import type { FilmtersectComparison } from "@/lib/types/filmtersect";

export async function findFilmtersects(personAId: number, personBId: number): Promise<FilmtersectComparison> {
  const [personACredits, personBCredits] = await Promise.all([
    getTmdbPersonCombinedCredits(personAId),
    getTmdbPersonCombinedCredits(personBId),
  ]);

  const normalizedA = normalizeCombinedCredits(personAId, personACredits);
  const normalizedB = normalizeCombinedCredits(personBId, personBCredits);

  const [topCollaboratorACast, topCollaboratorACrew, topCollaboratorBCast, topCollaboratorBCrew] = await Promise.all([
    findTopCollaboratorForPerson(personAId, normalizedA, personBId, "cast").catch(() => null),
    findTopCollaboratorForPerson(personAId, normalizedA, personBId, "crew").catch(() => null),
    findTopCollaboratorForPerson(personBId, normalizedB, personAId, "cast").catch(() => null),
    findTopCollaboratorForPerson(personBId, normalizedB, personAId, "crew").catch(() => null),
  ]);

  return {
    results: findDirectOverlaps(normalizedA, normalizedB),
    topCollaborators: {
      personA: {
        cast: topCollaboratorACast,
        crew: topCollaboratorACrew,
      },
      personB: {
        cast: topCollaboratorBCast,
        crew: topCollaboratorBCrew,
      },
    },
  };
}
