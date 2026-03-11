import { getTmdbBearerToken, tmdbBaseUrl } from "@/lib/tmdb/config";

export class TmdbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbConfigError";
  }
}

export class TmdbRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TmdbRequestError";
    this.status = status;
  }
}

function getTmdbConfig() {
  try {
    return {
      baseUrl: tmdbBaseUrl,
      token: getTmdbBearerToken(),
    };
  } catch {
    throw new TmdbConfigError("Missing TMDb credentials. Set TMDB_BEARER_TOKEN.");
  }
}

export async function tmdbFetch(path: string) {
  const { baseUrl, token } = getTmdbConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new TmdbRequestError(`TMDb request failed with status ${response.status}. ${body}`.trim(), response.status);
  }

  return response.json();
}
