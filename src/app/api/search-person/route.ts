import { NextResponse } from "next/server";

import { TmdbConfigError, TmdbRequestError } from "@/lib/tmdb/fetch";
import { searchTmdbPeople } from "@/lib/tmdb/service";
import type { SearchPersonApiResponse } from "@/lib/types/search-person";
import { searchPersonQuerySchema } from "@/lib/validations/search-person";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = searchPersonQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
  });

  if (!parsedQuery.success) {
    const response: SearchPersonApiResponse = {
      results: [],
      error: parsedQuery.error.issues[0]?.message ?? "Invalid query.",
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const results = await searchTmdbPeople(parsedQuery.data.q, { limit: 8 });
    const response: SearchPersonApiResponse = { results };
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

    const response: SearchPersonApiResponse = {
      results: [],
      error: "Unexpected search error.",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
