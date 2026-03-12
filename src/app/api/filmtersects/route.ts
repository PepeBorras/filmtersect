import { NextResponse } from "next/server";

import { findFilmtersects } from "@/lib/filmtersect/engine";
import { TmdbConfigError, TmdbRequestError } from "@/lib/tmdb/fetch";
import type { FilmtersectsApiSuccess } from "@/lib/types/filmtersect";
import { filmtersectsBodySchema } from "@/lib/validations/filmtersects";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = filmtersectsBodySchema.safeParse(body);

  if (!parsedBody.success) {
    const response = { error: parsedBody.error.issues[0]?.message ?? "Invalid input." };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const comparison = await findFilmtersects(parsedBody.data.personAId, parsedBody.data.personBId);
    const response: FilmtersectsApiSuccess = {
      count: comparison.results.length,
      results: comparison.results,
      topCollaborators: comparison.topCollaborators,
      closestConnection: comparison.closestConnection,
    };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof TmdbConfigError) {
      const response = { error: "TMDb credentials not configured" };
      return NextResponse.json(response, { status: 500 });
    }

    if (error instanceof TmdbRequestError) {
      const response = { error: "TMDb is temporarily unavailable" };
      return NextResponse.json(response, { status: 502 });
    }

    const response = { error: "Unexpected compare error." };
    return NextResponse.json(response, { status: 500 });
  }
}
