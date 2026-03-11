"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Avatar } from "@/components/compare/SelectedPerson";
import { SearchAutocomplete } from "@/components/compare/SearchAutocomplete";
import { useFilmtersects } from "@/components/results/useFilmtersects";
import { ResultsList } from "@/components/results/ResultsList";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import type { TopCollaborator, TopCollaboratorsByCategory } from "@/lib/types/filmtersect";
import type { PersonSearchResult, SearchPersonApiResponse } from "@/lib/types/search-person";

function isSearchPersonResult(value: unknown): value is PersonSearchResult {
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

async function hydratePersonProfile(
  person: PersonSearchResult,
  signal: AbortSignal,
): Promise<PersonSearchResult | null> {
  const response = await fetch(`/api/search-person?q=${encodeURIComponent(person.name)}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as SearchPersonApiResponse | null;
  if (!payload || !("results" in payload) || !Array.isArray(payload.results)) {
    return null;
  }

  const match = payload.results.find((candidate) => isSearchPersonResult(candidate) && candidate.id === person.id);
  if (!match) {
    return null;
  }

  return {
    ...person,
    profilePath: match.profilePath,
    knownForDepartment: match.knownForDepartment,
    popularity: match.popularity,
  };
}

function fromUrlParams(searchParams: URLSearchParams, prefix: "a" | "b"): PersonSearchResult | null {
  const idRaw = searchParams.get(`${prefix}Id`);
  const nameRaw = searchParams.get(`${prefix}Name`);
  const profilePathRaw = searchParams.get(`${prefix}Profile`);
  const departmentRaw = searchParams.get(`${prefix}Dept`);

  if (!idRaw || !nameRaw) {
    return null;
  }

  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return {
    id,
    name: nameRaw,
    knownForDepartment: departmentRaw || "Unknown",
    profilePath: profilePathRaw || null,
    popularity: 0,
  };
}

function buildComparisonHref(personA: { id: number; name: string }, personB: { id: number; name: string }) {
  const params = new URLSearchParams({
    aId: String(personA.id),
    aName: personA.name,
    bId: String(personB.id),
    bName: personB.name,
  });

  return `/?${params.toString()}`;
}

type TopCollaboratorBlockProps = {
  subject: PersonSearchResult;
  collaborators: TopCollaboratorsByCategory | null | undefined;
};

type CollaboratorRowProps = {
  label: "Cast" | "Crew";
  collaborator: TopCollaborator | null;
  href: string | null;
};

function CollaboratorRow({ label, collaborator, href }: CollaboratorRowProps) {
  if (!collaborator) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-[11px] text-stone-500">{label}</p>
      <div className="flex min-w-0 items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={collaborator.name} profilePath={collaborator.profilePath} />
          <div className="min-w-0">
            <p className="truncate text-sm tracking-tight text-stone-900">{collaborator.name}</p>
            <p className="text-xs text-stone-600">
              {collaborator.sharedCount} shared {collaborator.sharedCount === 1 ? "title" : "titles"}
            </p>
          </div>
        </div>
        {href ? (
          <a
            href={href}
            className="shrink-0 border-b border-stone-400 pb-0.5 text-[11px] tracking-tight text-stone-600 transition-colors hover:border-stone-700 hover:text-stone-900"
          >
            Compare
          </a>
        ) : null}
      </div>
    </div>
  );
}

function TopCollaboratorBlock({ subject, collaborators }: TopCollaboratorBlockProps) {
  const hasAny = Boolean(collaborators?.cast || collaborators?.crew);

  return (
    <article className="space-y-1.5 border-b border-stone-300/45 pb-3 last:border-b-0 last:pb-0">
      <p className="text-[11px] tracking-[0.03em] text-stone-500">Most frequent collaborator for {subject.name}</p>
      {hasAny ? (
        <div className="space-y-2">
          <CollaboratorRow
            label="Cast"
            collaborator={collaborators?.cast ?? null}
            href={
              collaborators?.cast
                ? buildComparisonHref(
                    { id: subject.id, name: subject.name },
                    { id: collaborators.cast.personId, name: collaborators.cast.name },
                  )
                : null
            }
          />
          <CollaboratorRow
            label="Crew"
            collaborator={collaborators?.crew ?? null}
            href={
              collaborators?.crew
                ? buildComparisonHref(
                    { id: subject.id, name: subject.name },
                    { id: collaborators.crew.personId, name: collaborators.crew.name },
                  )
                : null
            }
          />
        </div>
      ) : (
        <p className="text-xs text-stone-600">No collaborator found.</p>
      )}
    </article>
  );
}

export function CompareInputs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPersonA = fromUrlParams(new URLSearchParams(searchParams.toString()), "a");
  const initialPersonB = fromUrlParams(new URLSearchParams(searchParams.toString()), "b");

  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");
  const [leftSelectedPerson, setLeftSelectedPerson] = useState<PersonSearchResult | null>(initialPersonA);
  const [rightSelectedPerson, setRightSelectedPerson] = useState<PersonSearchResult | null>(initialPersonB);
  const { shouldShow, results, topCollaborators, isLoading, errorMessage } = useFilmtersects({
    personA: leftSelectedPerson,
    personB: rightSelectedPerson,
  });

  useEffect(() => {
    if (!leftSelectedPerson || leftSelectedPerson.profilePath) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const hydrated = await hydratePersonProfile(leftSelectedPerson, controller.signal);
        if (!hydrated) {
          return;
        }

        setLeftSelectedPerson((prev) => {
          if (!prev || prev.id !== hydrated.id) {
            return prev;
          }

          return hydrated;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [leftSelectedPerson]);

  useEffect(() => {
    if (!rightSelectedPerson || rightSelectedPerson.profilePath) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const hydrated = await hydratePersonProfile(rightSelectedPerson, controller.signal);
        if (!hydrated) {
          return;
        }

        setRightSelectedPerson((prev) => {
          if (!prev || prev.id !== hydrated.id) {
            return prev;
          }

          return hydrated;
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [rightSelectedPerson]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (leftSelectedPerson) {
      nextParams.set("aId", String(leftSelectedPerson.id));
      nextParams.set("aName", leftSelectedPerson.name);
      if (leftSelectedPerson.profilePath) {
        nextParams.set("aProfile", leftSelectedPerson.profilePath);
      }
      if (leftSelectedPerson.knownForDepartment) {
        nextParams.set("aDept", leftSelectedPerson.knownForDepartment);
      }
    }

    if (rightSelectedPerson) {
      nextParams.set("bId", String(rightSelectedPerson.id));
      nextParams.set("bName", rightSelectedPerson.name);
      if (rightSelectedPerson.profilePath) {
        nextParams.set("bProfile", rightSelectedPerson.profilePath);
      }
      if (rightSelectedPerson.knownForDepartment) {
        nextParams.set("bDept", rightSelectedPerson.knownForDepartment);
      }
    }

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [leftSelectedPerson, pathname, rightSelectedPerson, router, searchParams]);

  return (
    <section className="mx-auto flex h-full w-full max-w-[360px] flex-col justify-start gap-4 py-2 text-center">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight text-stone-900">Filmtersect</h1>
        <p className="text-sm text-stone-600">Find where two film careers overlap.</p>
      </div>

      <div className="mx-auto flex w-full max-w-[320px] flex-col gap-3">
        <div className="w-full">
          <SearchAutocomplete
            label="Person one"
            placeholder="Search person one"
            query={leftQuery}
            selectedPerson={leftSelectedPerson}
            onQueryChange={setLeftQuery}
            onSelect={setLeftSelectedPerson}
            onClear={() => {
              setLeftSelectedPerson(null);
              setLeftQuery("");
            }}
          />
        </div>
        <span className="self-center text-base font-light leading-none text-stone-500" aria-hidden="true">
          ×
        </span>
        <div className="w-full">
          <SearchAutocomplete
            label="Person two"
            placeholder="Search person two"
            query={rightQuery}
            selectedPerson={rightSelectedPerson}
            onQueryChange={setRightQuery}
            onSelect={setRightSelectedPerson}
            onClear={() => {
              setRightSelectedPerson(null);
              setRightQuery("");
            }}
          />
        </div>
      </div>

      <p className="text-xs text-stone-500">Search any two cast or crew members.</p>

      {shouldShow ? (
        <section className="mx-auto w-full max-w-[340px] space-y-3 rounded-sm border-t border-stone-300/60 pt-3 text-left">
          {isLoading ? <p className="text-sm text-stone-600 animate-pulse">Finding shared titles...</p> : null}
          {!isLoading && errorMessage ? (
            <p className="rounded-sm border border-stone-300/55 bg-stone-100/70 px-2.5 py-2 text-sm text-stone-700">
              {errorMessage}
            </p>
          ) : null}
          {!isLoading && !errorMessage ? <ResultsSummary count={results.length} /> : null}
          {!isLoading && !errorMessage && results.length > 0 && leftSelectedPerson && rightSelectedPerson ? (
            <ResultsList items={results} personAName={leftSelectedPerson.name} personBName={rightSelectedPerson.name} />
          ) : null}
          {!isLoading && !errorMessage && leftSelectedPerson && rightSelectedPerson ? (
            <section className="space-y-3 border-t border-stone-300/45 pt-3">
              <p className="text-[11px] tracking-[0.08em] text-stone-500">TOP COLLABORATORS</p>
              <TopCollaboratorBlock
                subject={leftSelectedPerson}
                collaborators={topCollaborators.personA}
              />
              <TopCollaboratorBlock
                subject={rightSelectedPerson}
                collaborators={topCollaborators.personB}
              />
            </section>
          ) : null}
          {!isLoading && !errorMessage && results.length === 0 ? (
            <p className="text-sm text-stone-600">No shared titles found.</p>
          ) : null}
        </section>
      ) : null}

      <p className="pt-1 text-[10px] leading-relaxed text-stone-500">
        This product uses the TMDb API but is not endorsed or certified by TMDb.
      </p>
    </section>
  );
}
