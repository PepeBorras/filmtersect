import { tmdbFetch } from "@/lib/tmdb/fetch";
import { tmdbCombinedCreditsResponseSchema, tmdbSearchPersonResponseSchema } from "@/lib/tmdb/types";
import type { PersonSearchResult } from "@/lib/types/search-person";
import type { TmdbCombinedCreditsResponse } from "@/lib/tmdb/types";

type SearchTmdbPeopleOptions = {
  limit?: number;
};

export async function searchTmdbPeople(query: string, options: SearchTmdbPeopleOptions = {}): Promise<PersonSearchResult[]> {
  const limit = options.limit ?? 8;
  const params = new URLSearchParams({
    query,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });
  const response = await tmdbFetch(`/search/person?${params.toString()}`);

  const parsed = tmdbSearchPersonResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error("Unexpected TMDb response shape.");
  }

  return parsed.data.results.slice(0, limit).map((person) => ({
    id: person.id,
    name: person.name,
    knownForDepartment: person.known_for_department ?? "Unknown",
    profilePath: person.profile_path ?? null,
    popularity: person.popularity ?? 0,
  }));
}

export async function getTmdbPersonCombinedCredits(personId: number): Promise<TmdbCombinedCreditsResponse> {
  const response = await tmdbFetch(`/person/${personId}/combined_credits?language=en-US`);

  const parsed = tmdbCombinedCreditsResponseSchema.safeParse(response);

  if (!parsed.success) {
    throw new Error("Unexpected TMDb credits response shape.");
  }

  return parsed.data;
}
