export type PersonSearchResult = {
  id: number;
  name: string;
  knownForDepartment: string;
  profilePath: string | null;
  popularity: number;
};

export type SearchPersonApiResponse = {
  results: PersonSearchResult[];
  error?: string;
};
