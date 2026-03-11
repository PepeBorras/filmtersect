"use client";

import { useEffect, useMemo, useState } from "react";

import type { PersonSearchResult, SearchPersonApiResponse } from "@/lib/types/search-person";

type UsePersonSearchOptions = {
  minLength?: number;
  debounceMs?: number;
};

function isPersonSearchResult(value: unknown): value is PersonSearchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.knownForDepartment === "string" &&
    (typeof candidate.profilePath === "string" || candidate.profilePath === null) &&
    typeof candidate.popularity === "number"
  );
}

export function usePersonSearch(query: string, options: UsePersonSearchOptions = {}) {
  const minLength = options.minLength ?? 2;
  const debounceMs = options.debounceMs ?? 280;

  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const canSearch = normalizedQuery.length >= minLength;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true);

        try {
          const response = await fetch(`/api/search-person?q=${encodeURIComponent(normalizedQuery)}`, {
            method: "GET",
            signal: controller.signal,
          });

          const payload = (await response.json().catch(() => null)) as SearchPersonApiResponse | null;
          const payloadError = payload && "error" in payload && typeof payload.error === "string" ? payload.error : null;

          if (!response.ok) {
            throw new Error(payloadError || "Search failed.");
          }

          const resultItems = payload && "results" in payload && Array.isArray(payload.results) ? payload.results : [];

          if (!resultItems.every((item) => isPersonSearchResult(item))) {
            throw new Error("Search returned invalid data.");
          }

          setResults(resultItems);
          setErrorMessage(null);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setResults([]);
          setErrorMessage(error instanceof Error ? error.message : "Search failed.");
        } finally {
          setIsLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, debounceMs, normalizedQuery]);

  const visibleResults = canSearch ? results : [];
  const visibleError = canSearch ? errorMessage : null;

  return {
    minLength,
    canSearch,
    results: visibleResults,
    isLoading,
    errorMessage: visibleError,
  };
}
