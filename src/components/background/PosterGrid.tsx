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

const INTERFACE_COL_START = Math.floor((GRID_COLS - INTERFACE_COL_SPAN) / 2) + 1;
const INTERFACE_ROW_START = Math.floor((GRID_ROWS - INTERFACE_ROW_SPAN) / 2) + 1;
const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

type BackgroundPostersResponse = {
  posters?: string[];
};

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }

  return next;
}

export function PosterGrid({ centerContent }: PosterGridProps) {
  const [posterUrls, setPosterUrls] = useState<string[]>([]);
  const cellIndexes = Array.from({ length: TOTAL_CELLS }, (_, index) => index);

  useEffect(() => {
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
        setPosterUrls(shuffle(posters));
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
    <section className="relative min-h-screen overflow-hidden bg-white [--poster-gap:14px] [--poster-h:96px] [--poster-w:64px] sm:[--poster-gap:22px] sm:[--poster-h:114px] sm:[--poster-w:76px] md:[--poster-gap:30px] md:[--poster-h:132px] md:[--poster-w:88px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="grid gap-(--poster-gap)" style={gridStyle}>
          {cellIndexes.map((cellIndex) => {
            const row = Math.floor(cellIndex / GRID_COLS) + 1;
            const col = (cellIndex % GRID_COLS) + 1;

            const insideInterfaceSlot =
              row >= INTERFACE_ROW_START &&
              row < INTERFACE_ROW_START + INTERFACE_ROW_SPAN &&
              col >= INTERFACE_COL_START &&
              col < INTERFACE_COL_START + INTERFACE_COL_SPAN;

            if (insideInterfaceSlot) {
              const isTopLeftInterfaceCell = row === INTERFACE_ROW_START && col === INTERFACE_COL_START;

              if (!isTopLeftInterfaceCell) {
                return null;
              }

              return (
                <div
                  key="center-interface"
                  className="z-10 pointer-events-auto flex items-center justify-center overflow-hidden bg-white/98 px-3 py-4 sm:px-5 sm:py-6"
                  style={{
                    gridColumn: `${INTERFACE_COL_START} / span ${INTERFACE_COL_SPAN}`,
                    gridRow: `${INTERFACE_ROW_START} / span ${INTERFACE_ROW_SPAN}`,
                  }}
                >
                  <div className="integrated-scroll h-full w-full overflow-y-auto pr-0 sm:pr-1">{centerContent}</div>
                </div>
              );
            }

            return (
              <PosterTile
                key={`tile-${cellIndex}`}
                tileIndex={cellIndex}
                posterUrl={posterUrls.length ? posterUrls[cellIndex % posterUrls.length] : null}
              />
            );
          })}
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
        "pointer-events-none relative aspect-2/3 w-(--poster-w) overflow-hidden rounded-md border border-white/40 bg-linear-to-br",
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
          className="object-cover opacity-75 saturate-75 brightness-90 contrast-95"
        />
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
}
