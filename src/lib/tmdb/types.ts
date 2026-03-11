import { z } from "zod";

export const tmdbPersonSchema = z.object({
  id: z.number(),
  name: z.string(),
  known_for_department: z.string().nullable().optional(),
  profile_path: z.string().nullable().optional(),
  popularity: z.number().nullable().optional(),
});

export const tmdbSearchPersonResponseSchema = z.object({
  page: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  results: z.array(tmdbPersonSchema),
});

const tmdbCombinedCreditBaseSchema = z.object({
  id: z.number(),
  media_type: z.enum(["movie", "tv"]),
  poster_path: z.string().nullable().optional(),
});

const tmdbCombinedCastCreditSchema = tmdbCombinedCreditBaseSchema.extend({
  character: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  first_air_date: z.string().nullable().optional(),
});

const tmdbCombinedCrewCreditSchema = tmdbCombinedCreditBaseSchema.extend({
  job: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  first_air_date: z.string().nullable().optional(),
});

export const tmdbCombinedCreditsResponseSchema = z.object({
  id: z.number(),
  cast: z.array(tmdbCombinedCastCreditSchema),
  crew: z.array(tmdbCombinedCrewCreditSchema),
});

export type TmdbSearchPersonResponse = z.infer<typeof tmdbSearchPersonResponseSchema>;
export type TmdbCombinedCreditsResponse = z.infer<typeof tmdbCombinedCreditsResponseSchema>;
