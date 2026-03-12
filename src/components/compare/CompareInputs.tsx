"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Avatar } from "@/components/compare/SelectedPerson";
import { SearchAutocomplete } from "@/components/compare/SearchAutocomplete";
import { useFilmtersects } from "@/components/results/useFilmtersects";
import { ResultsList } from "@/components/results/ResultsList";
import { ResultsSummary } from "@/components/results/ResultsSummary";
import { buildComparisonPath } from "@/lib/routing/comparison-url";
import { getTmdbProfileImageUrl } from "@/lib/tmdb/image";
import type { ClosestConnection, TopCollaborator, TopCollaboratorsByCategory } from "@/lib/types/filmtersect";
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

function buildComparisonHref(personA: { id: number; name: string }, personB: { id: number; name: string }) {
  return buildComparisonPath(personA, personB);
}

type CompareInputsProps = {
  initialPersonA?: PersonSearchResult | null;
  initialPersonB?: PersonSearchResult | null;
};

type TopCollaboratorBlockProps = {
  subject: PersonSearchResult;
  collaborators: TopCollaboratorsByCategory | null | undefined;
};

type ClosestConnectionBlockProps = {
  personA: PersonSearchResult;
  personB: PersonSearchResult;
  closestConnection: ClosestConnection | null;
  hasSharedTitles: boolean;
};

type CollaboratorRowProps = {
  label: "Cast" | "Crew";
  collaborator: TopCollaborator | null;
  href: string | null;
};

type ViewPairActionProps = {
  href: string;
  leftName: string;
  leftProfilePath: string | null;
  rightName: string;
  rightProfilePath: string | null;
};

type SelectionAvatarProps = {
  person: PersonSearchResult | null;
  side: "left" | "right";
};

function StarPlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-stone-500/75">
      <path
        d="M12 3.5l2.6 5.28 5.83.85-4.22 4.1.99 5.79L12 16.9l-5.2 2.62.99-5.79-4.22-4.1 5.83-.85L12 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PopcornPlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-stone-500/75">
      <path
        d="M8 10.5h8l-1.1 8.5H9.1L8 10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.1 9.8h7.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.7 10.5v8.1M12 10.5v8.1M14.3 10.5v8.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8.1 8.7c0-.9.7-1.6 1.6-1.6.3 0 .6.1.9.3.2-.8 1-1.4 1.9-1.4.9 0 1.6.5 1.9 1.3.2-.1.5-.2.8-.2.9 0 1.6.7 1.6 1.6 0 .4-.2.8-.5 1.1H8.6c-.3-.3-.5-.7-.5-1.1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollaboratorRow({ label, collaborator, href }: CollaboratorRowProps) {
  if (!collaborator) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] tracking-[0.08em] text-stone-500 uppercase">{label}</p>
      <div className="flex min-w-0 items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={collaborator.name} profilePath={collaborator.profilePath} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium tracking-tight text-stone-900">{collaborator.name}</p>
            <p className="text-[11px] text-stone-600">
              {collaborator.sharedCount} shared {collaborator.sharedCount === 1 ? "title" : "titles"}
            </p>
          </div>
        </div>
        {href ? (
          <a
            href={href}
            className="shrink-0 rounded-full border border-stone-300/80 px-2.5 py-1 text-[10px] tracking-[0.06em] text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900"
          >
            View
          </a>
        ) : null}
      </div>
    </div>
  );
}

function TopCollaboratorBlock({ subject, collaborators }: TopCollaboratorBlockProps) {
  const hasAny = Boolean(collaborators?.cast || collaborators?.crew);

  return (
    <article className="space-y-2 rounded-2xl border border-white/60 bg-white/46 px-3 py-3 shadow-[0_12px_24px_-20px_rgba(33,26,18,0.55)]">
      <p className="text-[11px] tracking-[0.04em] text-stone-500">Most frequent collaborator for {subject.name}</p>
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

function ViewPairAction({ href, leftName, leftProfilePath, rightName, rightProfilePath }: ViewPairActionProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 px-2.5 py-1 text-[10px] tracking-[0.06em] text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900"
    >
      <span className="flex items-center">
        <Avatar name={leftName} profilePath={leftProfilePath} />
        <span className="-ml-2">
          <Avatar name={rightName} profilePath={rightProfilePath} />
        </span>
      </span>
      <span className="truncate">
        View {leftName} × {rightName}
      </span>
    </a>
  );
}

function SelectionAvatar({ person, side }: SelectionAvatarProps) {
  const imageUrl = getTmdbProfileImageUrl(person?.profilePath ?? null, "w185");
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isEmptySlot = !person;

  useEffect(() => {
    setIsImageLoaded(false);
  }, [imageUrl]);

  const initials = person?.name
    ? person.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : side === "left"
      ? "A"
      : "B";

  return (
    <div className="relative size-17 overflow-hidden rounded-full border border-white/70 bg-stone-100/90 shadow-[0_10px_22px_-16px_rgba(30,24,18,0.6)] sm:size-18">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={person ? `${person.name} profile` : `${side} profile placeholder`}
          fill
          sizes="72px"
          onLoadingComplete={() => setIsImageLoaded(true)}
          className={`object-cover transition duration-150 ease-out ${isImageLoaded ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.08em] text-stone-500">
          {isEmptySlot ? (side === "left" ? <StarPlaceholderIcon /> : <PopcornPlaceholderIcon />) : initials}
        </div>
      )}
    </div>
  );
}

function ClosestConnectionBlock({ personA, personB, closestConnection, hasSharedTitles }: ClosestConnectionBlockProps) {
  if (!closestConnection) {
    return null;
  }

  const heading = hasSharedTitles ? "SOMEONE ELSE IN COMMON" : "CLOSEST THEY GOT";

  const compareFromA = buildComparisonHref(
    { id: personA.id, name: personA.name },
    { id: closestConnection.personId, name: closestConnection.name },
  );

  const compareFromB = buildComparisonHref(
    { id: personB.id, name: personB.name },
    { id: closestConnection.personId, name: closestConnection.name },
  );

  return (
    <section className="space-y-2.5 rounded-2xl border border-white/60 bg-white/46 px-3 py-3 shadow-[0_12px_24px_-20px_rgba(33,26,18,0.55)]">
      <p className="text-[11px] tracking-[0.08em] text-stone-500">{heading}</p>
      <p className="text-sm text-stone-700">Both worked frequently with {closestConnection.name}.</p>
      <div className="space-y-1 text-[11px] text-stone-600">
        <p>
          {personA.name} - {closestConnection.personASharedCount} {closestConnection.personASharedCount === 1 ? "title" : "titles"}
        </p>
        <p>
          {personB.name} - {closestConnection.personBSharedCount} {closestConnection.personBSharedCount === 1 ? "title" : "titles"}
        </p>
      </div>
      <div className="space-y-1.5">
        <ViewPairAction
          href={compareFromA}
          leftName={personA.name}
          leftProfilePath={personA.profilePath}
          rightName={closestConnection.name}
          rightProfilePath={closestConnection.profilePath}
        />
        <ViewPairAction
          href={compareFromB}
          leftName={personB.name}
          leftProfilePath={personB.profilePath}
          rightName={closestConnection.name}
          rightProfilePath={closestConnection.profilePath}
        />
      </div>
    </section>
  );
}

export function CompareInputs({ initialPersonA = null, initialPersonB = null }: CompareInputsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [leftSelectedPerson, setLeftSelectedPerson] = useState<PersonSearchResult | null>(initialPersonA);
  const [rightSelectedPerson, setRightSelectedPerson] = useState<PersonSearchResult | null>(initialPersonB);
  const { shouldShow, hasCompared, results, topCollaborators, closestConnection, isLoading, errorMessage } = useFilmtersects({
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
    if (shareState !== "copied") {
      return;
    }

    const timer = window.setTimeout(() => {
      setShareState("idle");
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shareState]);

  useEffect(() => {
    if (leftSelectedPerson && rightSelectedPerson) {
      const nextPath = buildComparisonPath(
        { id: leftSelectedPerson.id, name: leftSelectedPerson.name },
        { id: rightSelectedPerson.id, name: rightSelectedPerson.name },
      );

      if (pathname !== nextPath) {
        router.replace(nextPath, { scroll: false });
      }

      return;
    }

    if (!leftSelectedPerson && !rightSelectedPerson && pathname !== "/") {
      router.replace("/", { scroll: false });
    }
  }, [leftSelectedPerson, pathname, rightSelectedPerson, router]);

  const handleShareResults = async () => {
    if (!navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareState("copied");
    } catch {
      setShareState("idle");
    }
  };

  return (
    <section className="mx-auto flex h-full w-full max-w-136 flex-col justify-start gap-4 px-1 py-0.5 text-center sm:gap-5 sm:px-0 sm:py-1">
      <div className="space-y-1.5 pt-1">
        <h1 className="font-serif text-[2rem] leading-none tracking-tight text-stone-900 sm:text-[2.35rem]">Filmtersect</h1>
        <p className="text-[12px] text-stone-600 sm:text-[13px]">Find where two film careers overlap.</p>
      </div>

      <div className="mx-auto flex items-center justify-center pt-1" aria-label="Selected people preview">
        <SelectionAvatar person={leftSelectedPerson} side="left" />
        <div className="-ml-5">
          <SelectionAvatar person={rightSelectedPerson} side="right" />
        </div>
      </div>

      <p className="text-[10px] tracking-[0.16em] text-stone-500 uppercase sm:text-[11px]">Search any two cast or crew members</p>

      <div className="mx-auto mt-0.5 flex w-full flex-col gap-3 sm:max-w-90">
        <div className="w-full">
          <SearchAutocomplete
            label="Person one"
            placeholder="e.g. Margot Robbie"
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
        <div className="w-full">
          <SearchAutocomplete
            label="Person two"
            placeholder="e.g. Chiquito de la Calzada"
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

      {shouldShow ? (
        <section className="mx-auto w-full space-y-3.5 border-t border-stone-300/45 pt-3 text-left sm:max-w-126">
          {isLoading ? <p className="text-sm text-stone-600 animate-pulse">Finding shared titles...</p> : null}
          {!isLoading && errorMessage ? (
            <p className="rounded-xl border border-stone-300/45 bg-white/55 px-3 py-2 text-sm text-stone-700">
              {errorMessage}
            </p>
          ) : null}
          {!isLoading && !errorMessage && hasCompared ? <ResultsSummary count={results.length} /> : null}
          {!isLoading && !errorMessage && hasCompared && results.length > 0 && leftSelectedPerson && rightSelectedPerson ? (
            <ResultsList items={results} personAName={leftSelectedPerson.name} personBName={rightSelectedPerson.name} />
          ) : null}
          {!isLoading && !errorMessage && hasCompared && leftSelectedPerson && rightSelectedPerson ? (
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
              <ClosestConnectionBlock
                personA={leftSelectedPerson}
                personB={rightSelectedPerson}
                closestConnection={closestConnection}
                hasSharedTitles={results.length > 0}
              />
            </section>
          ) : null}
          {!isLoading && !errorMessage && hasCompared && leftSelectedPerson && rightSelectedPerson ? (
            <div className="flex justify-center border-t border-stone-300/45 pt-3">
              <button
                type="button"
                onClick={handleShareResults}
                className="cursor-pointer rounded-full border border-stone-300/75 bg-white/55 px-3 py-1 text-[11px] tracking-[0.06em] text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-900"
              >
                {shareState === "copied" ? "Copied" : "Share these results"}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="mt-auto pt-1 text-[10px] leading-relaxed text-stone-500/95">
        This little app uses the TMDb API but is not endorsed or certified by TMDb.
      </p>
    </section>
  );
}
