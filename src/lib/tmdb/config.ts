export const tmdbBaseUrl = "https://api.themoviedb.org/3";

export function getTmdbBearerToken() {
  const token = process.env.TMDB_BEARER_TOKEN;

  if (!token) {
    throw new Error("Missing TMDb credentials. Set TMDB_BEARER_TOKEN.");
  }

  return token;
}

export function getTmdbApiKey() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing TMDb credentials. Set TMDB_BEARER_TOKEN or TMDB_API_KEY.");
  }

  return apiKey;
}
