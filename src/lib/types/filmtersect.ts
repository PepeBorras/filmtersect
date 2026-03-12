export type NormalizedCredit = {
  personId: number;
  creditType: "cast" | "crew";
  titleId: number;
  mediaType: "movie" | "tv";
  titleName: string;
  releaseDate: string | null;
  year: number | null;
  posterPath: string | null;
  character: string | null;
  job: string | null;
  department: string | null;
};

export type SharedTitle = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  year: string | null;
  posterPath: string | null;
  personARole: string;
  personBRole: string;
};

export type TopCollaborator = {
  personId: number;
  name: string;
  profilePath: string | null;
  sharedCount: number;
};

export type TopCollaboratorsByCategory = {
  cast: TopCollaborator | null;
  crew: TopCollaborator | null;
};

export type TopCollaboratorsBySide = {
  personA: TopCollaboratorsByCategory;
  personB: TopCollaboratorsByCategory;
};

export type ClosestConnection = {
  personId: number;
  name: string;
  personASharedCount: number;
  personBSharedCount: number;
};

export type FilmtersectComparison = {
  results: SharedTitle[];
  topCollaborators: TopCollaboratorsBySide;
  closestConnection: ClosestConnection | null;
};

export type FilmtersectsApiSuccess = {
  count: number;
  results: SharedTitle[];
  topCollaborators: TopCollaboratorsBySide;
  closestConnection: ClosestConnection | null;
};

export type FilmtersectsApiError = {
  error?: string;
};

export type FilmtersectsApiResponse = FilmtersectsApiSuccess | FilmtersectsApiError;
