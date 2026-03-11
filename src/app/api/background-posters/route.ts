import { NextResponse } from "next/server";
import { z } from "zod";

import { TmdbConfigError, TmdbRequestError, tmdbFetch } from "@/lib/tmdb/fetch";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w342";
const POSTER_TARGET_COUNT = 60;

const discoverMovieSchema = z.object({
  results: z.array(
    z.object({
      poster_path: z.string().nullable().optional(),
    }),
  ),
});

export async function GET() {
  try {
    const pages = [1, 2, 3];
    const responses = await Promise.all(
      pages.map((page) =>
        tmdbFetch(`/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc`),
      ),
    );

    const posters = responses
      .flatMap((payload) => {
        const parsed = discoverMovieSchema.safeParse(payload);
        if (!parsed.success) {
          return [];
        }

        return parsed.data.results.map((movie) => movie.poster_path).filter((path): path is string => Boolean(path));
      })
      .slice(0, POSTER_TARGET_COUNT)
      .map((path) => `${TMDB_IMAGE_BASE_URL}${path}`);

    return NextResponse.json({ posters });
  } catch (error) {
    if (error instanceof TmdbConfigError || error instanceof TmdbRequestError) {
      return NextResponse.json({ posters: [], error: "TMDb credentials not configured" }, { status: 500 });
    }

    return NextResponse.json({ posters: [], error: "Unable to load background posters." }, { status: 500 });
  }
}
