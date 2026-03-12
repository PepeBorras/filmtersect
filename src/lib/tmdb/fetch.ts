import { getTmdbApiKey, getTmdbBearerToken, tmdbBaseUrl } from "@/lib/tmdb/config";

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

const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 350;

function getTmdbConfig() {
  const token = process.env.TMDB_BEARER_TOKEN?.trim();
  if (token) {
    return {
      baseUrl: tmdbBaseUrl,
      auth: {
        type: "bearer" as const,
        token,
      },
    };
  }

  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (apiKey) {
    return {
      baseUrl: tmdbBaseUrl,
      auth: {
        type: "api-key" as const,
        apiKey,
      },
    };
  }

  // Keep explicit config helpers used so centralized credential messages stay in sync.
  try {
    getTmdbBearerToken();
  } catch {
    try {
      getTmdbApiKey();
    } catch {
      throw new TmdbConfigError("Missing TMDb credentials. Set TMDB_BEARER_TOKEN or TMDB_API_KEY.");
    }
  }

  throw new TmdbConfigError("Missing TMDb credentials. Set TMDB_BEARER_TOKEN or TMDB_API_KEY.");
}

export async function tmdbFetch(path: string) {
  const { baseUrl, auth } = getTmdbConfig();
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(`${baseUrl}/${normalizedPath}`);

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (auth.type === "bearer") {
    headers.Authorization = `Bearer ${auth.token}`;
  } else {
    url.searchParams.set("api_key", auth.apiKey);
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (response.ok) {
      return response.json();
    }

    const shouldRetry = response.status === 429 || response.status >= 500;
    if (shouldRetry && attempt < MAX_RETRIES) {
      const retryAfterRaw = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterRaw ? Number(retryAfterRaw) : NaN;
      const retryDelay = Number.isFinite(retryAfterSeconds)
        ? Math.max(0, retryAfterSeconds * 1000)
        : BASE_RETRY_DELAY_MS * Math.pow(2, attempt);

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }

    const body = await response.text().catch(() => "");
    throw new TmdbRequestError(`TMDb request failed with status ${response.status}. ${body}`.trim(), response.status);
  }

  throw new TmdbRequestError("TMDb request failed after retries.", 502);
}
