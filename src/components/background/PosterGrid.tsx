"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type PosterGridProps = {
  centerContent: ReactNode;
};

const TILE_STYLES = [
  "from-stone-200/95 via-stone-100 to-stone-200/95",
  "from-zinc-200/95 via-stone-100 to-zinc-200/95",
  "from-stone-100 via-zinc-100 to-stone-200/90",
  "from-zinc-100 via-stone-100 to-zinc-200/90",
  "from-stone-200/90 via-zinc-100 to-stone-200/95",
  "from-zinc-200/90 via-stone-100 to-stone-200/95",
];

const GRID_COLS = 18;
const GRID_ROWS = 16;
const INTERFACE_COL_SPAN = 4;
const INTERFACE_ROW_SPAN = 4;
const MOBILE_INTERFACE_COL_SPAN = GRID_COLS;
const MOBILE_INTERFACE_ROW_SPAN = INTERFACE_ROW_SPAN + 1;

const INTERFACE_COL_START = Math.floor((GRID_COLS - INTERFACE_COL_SPAN) / 2) + 1;
const INTERFACE_ROW_START = Math.floor((GRID_ROWS - INTERFACE_ROW_SPAN) / 2) + 1;
const MOBILE_INTERFACE_COL_START = 1;
const MOBILE_INTERFACE_ROW_START = Math.max(1, INTERFACE_ROW_START - 1);
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

type BackgroundPostersResponse = {
  posters?: string[];
};

const SESSION_POSTERS_KEY = "filmtersect.background-posters.v1";
let cachedSessionPosters: string[] | null = null;

function readSessionPosters(): string[] | null {
  if (cachedSessionPosters && cachedSessionPosters.length > 0) {
    return cachedSessionPosters;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(SESSION_POSTERS_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const posters = parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
    if (!posters.length) {
      return null;
    }

    cachedSessionPosters = posters;
    return posters;
  } catch {
    return null;
  }
}

function writeSessionPosters(posters: string[]) {
  cachedSessionPosters = posters;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SESSION_POSTERS_KEY, JSON.stringify(posters));
  } catch {
    // Ignore storage quota/privacy failures and continue with in-memory cache only.
  }
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }

  return next;
}

export function PosterGrid() {
  const [posterUrls, setPosterUrls] = useState<string[]>([]);
  const cellIndexes = Array.from({ length: TOTAL_CELLS }, (_, index) => index);

  useEffect(() => {
    const existingPosters = readSessionPosters();

    if (existingPosters) {
      const frameId = window.requestAnimationFrame(() => {
        setPosterUrls(existingPosters);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/background-posters", {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as BackgroundPostersResponse;
        const posters = Array.isArray(payload.posters) ? payload.posters.filter(Boolean) : [];
        const shuffledPosters = shuffle(posters);
        setPosterUrls(shuffledPosters);
        writeSessionPosters(shuffledPosters);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${GRID_COLS}, var(--poster-w))`,
    gridTemplateRows: `repeat(${GRID_ROWS}, var(--poster-h))`,
  };

  return (
    <section
      className="pointer-events-none absolute inset-0 overflow-hidden [--poster-gap:14px] [--poster-h:101px] [--poster-w:66px] sm:[--poster-gap:22px] sm:[--poster-h:120px] sm:[--poster-w:80px] md:[--poster-gap:30px] md:[--poster-h:138px] md:[--poster-w:92px]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-linear-to-b from-white/24 via-transparent to-white/30" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:scale-[1.02]">
        <div className="grid gap-(--poster-gap)" style={gridStyle}>
          {cellIndexes.map((cellIndex) => (
            <PosterTile
              key={`tile-${cellIndex}`}
              tileIndex={cellIndex}
              posterUrl={posterUrls.length ? posterUrls[cellIndex % posterUrls.length] : null}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type PosterTileProps = {
  tileIndex: number;
  posterUrl: string | null;
  className?: string;
};

function PosterTile({ tileIndex, posterUrl, className }: PosterTileProps) {
  return (
    <div
      className={cn(
        "pointer-events-none relative aspect-2/3 w-(--poster-w) overflow-hidden rounded-lg border border-white/45 bg-linear-to-br",
        TILE_STYLES[tileIndex % TILE_STYLES.length],
        className,
      )}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          sizes="88px"
          className="object-cover opacity-68 saturate-70 brightness-95 contrast-90"
        />
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
}
