import { describe, expect, it } from "vitest";

import { findDirectOverlaps } from "./direct-overlaps";
import type { NormalizedCredit } from "@/lib/types/filmtersect";

function credit(overrides: Partial<NormalizedCredit>): NormalizedCredit {
  return {
    personId: 1,
    creditType: "cast",
    titleId: 0,
    mediaType: "movie",
    titleName: "Untitled",
    releaseDate: null,
    year: null,
    posterPath: null,
    character: null,
    job: null,
    department: null,
    ...overrides,
  };
}

describe("findDirectOverlaps", () => {
  it("returns one shared result per title id + media type", () => {
    const personA: NormalizedCredit[] = [
      credit({ personId: 10, titleId: 1, mediaType: "movie", titleName: "A", year: 2020, character: "Lead" }),
      credit({ personId: 10, titleId: 1, mediaType: "movie", titleName: "A", year: 2020, character: "Lead" }),
    ];
    const personB: NormalizedCredit[] = [
      credit({ personId: 20, titleId: 1, mediaType: "movie", titleName: "A", year: 2020, job: "Director", creditType: "crew" }),
    ];

    const result = findDirectOverlaps(personA, personB);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      mediaType: "movie",
      title: "A",
      year: "2020",
      personARole: "Lead",
      personBRole: "Director",
    });
  });

  it("formats fallback roles and pushes missing years to the end", () => {
    const personA: NormalizedCredit[] = [
      credit({ personId: 10, titleId: 2, mediaType: "tv", titleName: "B", year: null, character: null, creditType: "cast" }),
      credit({ personId: 10, titleId: 3, mediaType: "movie", titleName: "C", year: 2015, character: "Pilot" }),
    ];

    const personB: NormalizedCredit[] = [
      credit({ personId: 20, titleId: 2, mediaType: "tv", titleName: "B", year: null, job: null, department: null, creditType: "crew" }),
      credit({ personId: 20, titleId: 3, mediaType: "movie", titleName: "C", year: 2015, job: null, department: "Editing", creditType: "crew" }),
    ];

    const result = findDirectOverlaps(personA, personB);

    expect(result.map((item) => item.id)).toEqual([3, 2]);
    expect(result[0]).toMatchObject({ personARole: "Pilot", personBRole: "Editing", year: "2015" });
    expect(result[1]).toMatchObject({ personARole: "Cast", personBRole: "Crew", year: null });
  });
});
