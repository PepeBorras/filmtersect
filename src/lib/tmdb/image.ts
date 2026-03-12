type ProfileSize = "w45" | "w92" | "w185";
type PosterSize = "w92" | "w154" | "w185" | "w342";
type MediaType = "movie" | "tv";

export function getTmdbProfileImageUrl(profilePath: string | null, size: ProfileSize = "w92") {
  if (!profilePath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/${size}${profilePath}`;
}

export function getTmdbPosterImageUrl(posterPath: string | null, size: PosterSize = "w154") {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export function getTmdbTitlePageUrl(mediaType: MediaType, id: number) {
  return `https://www.themoviedb.org/${mediaType}/${id}`;
}
