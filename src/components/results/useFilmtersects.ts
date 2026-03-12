"use client";

import { useEffect, useState } from "react";

import type { ClosestConnection, FilmtersectsApiError, FilmtersectsApiSuccess, SharedTitle, TopCollaboratorsBySide } from "@/lib/types/filmtersect";
import type { PersonSearchResult } from "@/lib/types/search-person";

const EMPTY_TOP_COLLABORATORS: TopCollaboratorsBySide = {
  personA: { cast: null, crew: null },
  personB: { cast: null, crew: null },
};

function isSharedTitleItem(value: unknown): value is SharedTitle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    (candidate.mediaType === "movie" || candidate.mediaType === "tv") &&
    typeof candidate.title === "string" &&
    (typeof candidate.year === "string" || candidate.year === null) &&
    (typeof candidate.posterPath === "string" || candidate.posterPath === null) &&
    typeof candidate.personARole === "string" &&
    typeof candidate.personBRole === "string"
  );
}

function isTopCollaboratorItem(value: unknown): value is NonNullable<FilmtersectsApiSuccess["topCollaborators"]>["personA"]["cast"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.personId === "number" &&
    typeof candidate.name === "string" &&
    (typeof candidate.profilePath === "string" || candidate.profilePath === null) &&
    typeof candidate.sharedCount === "number"
  );
}

function isClosestConnectionItem(value: unknown): value is ClosestConnection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.personId === "number" &&
    typeof candidate.name === "string" &&
    (typeof candidate.profilePath === "string" || candidate.profilePath === null) &&
    typeof candidate.personASharedCount === "number" &&
    typeof candidate.personBSharedCount === "number"
  );
}

function normalizeTopCollaborators(value: FilmtersectsApiSuccess["topCollaborators"] | undefined): TopCollaboratorsBySide {
  const personACast = isTopCollaboratorItem(value?.personA?.cast) ? value.personA.cast : null;
  const personACrew = isTopCollaboratorItem(value?.personA?.crew) ? value.personA.crew : null;
  const personBCast = isTopCollaboratorItem(value?.personB?.cast) ? value.personB.cast : null;
  const personBCrew = isTopCollaboratorItem(value?.personB?.crew) ? value.personB.crew : null;

  return {
    personA: {
      cast: personACast,
      crew: personACrew,
    },
    personB: {
      cast: personBCast,
      crew: personBCrew,
    },
  };
}

type UseFilmtersectsArgs = {
  personA: PersonSearchResult | null;
  personB: PersonSearchResult | null;
};

export function useFilmtersects({ personA, personB }: UseFilmtersectsArgs) {
  const [results, setResults] = useState<SharedTitle[]>([]);
  const [topCollaborators, setTopCollaborators] = useState<TopCollaboratorsBySide>(EMPTY_TOP_COLLABORATORS);
  const [closestConnection, setClosestConnection] = useState<ClosestConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCompared, setHasCompared] = useState(false);

  useEffect(() => {
    if (!personA || !personB) {
      setResults([]);
      setTopCollaborators(EMPTY_TOP_COLLABORATORS);
      setClosestConnection(null);
      setErrorMessage(null);
      setIsLoading(false);
      setHasCompared(false);
      return;
    }

    if (personA.id === personB.id) {
      setResults([]);
      setTopCollaborators(EMPTY_TOP_COLLABORATORS);
      setClosestConnection(null);
      setErrorMessage("Please choose two different people.");
      setIsLoading(false);
      setHasCompared(false);
      return;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;

    setIsLoading(true);
    setErrorMessage(null);
    setHasCompared(false);

    void (async () => {
      try {
        const response = await fetch("/api/filmtersects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personAId: personA.id,
            personBId: personB.id,
          }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as FilmtersectsApiSuccess | FilmtersectsApiError;

        if (!response.ok) {
          throw new Error(("error" in payload && payload.error) || "Compare failed.");
        }

        if (!("results" in payload)) {
          throw new Error("Invalid compare response.");
        }

        if (!Array.isArray(payload.results) || !payload.results.every((item) => isSharedTitleItem(item))) {
          throw new Error("Compare returned invalid data.");
        }

        if (!isCurrentRequest) {
          return;
        }

        setResults(payload.results);
        setTopCollaborators(normalizeTopCollaborators(payload.topCollaborators));
        setClosestConnection(isClosestConnectionItem(payload.closestConnection) ? payload.closestConnection : null);
        setErrorMessage(null);
        setHasCompared(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        setResults([]);
        setTopCollaborators(EMPTY_TOP_COLLABORATORS);
        setClosestConnection(null);
        setErrorMessage(error instanceof Error ? error.message : "Compare failed.");
        setHasCompared(true);
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [personA, personB]);

  return {
    shouldShow: Boolean(personA && personB),
    hasCompared,
    results,
    topCollaborators,
    closestConnection,
    isLoading,
    errorMessage,
  };
}
