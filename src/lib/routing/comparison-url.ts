import type { PersonSearchResult } from "@/lib/types/search-person";

type SegmentParseResult = {
  slug: string;
  id: number;
};

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function slugifyPersonName(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || "person";
}

export function parsePersonSegment(segment: string): SegmentParseResult | null {
  const parts = segment.split("~");
  if (parts.length < 2) {
    return null;
  }

  const idRaw = parts.at(-1);
  const slug = parts.slice(0, -1).join("~").trim();

  if (!idRaw || !slug) {
    return null;
  }

  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return { slug, id };
}

export function buildPersonSegment(person: { id: number; name: string }): string {
  return `${slugifyPersonName(person.name)}~${person.id}`;
}

export function buildComparisonPath(
  personA: { id: number; name: string },
  personB: { id: number; name: string },
): string {
  return `/${buildPersonSegment(personA)}/${buildPersonSegment(personB)}`;
}

export function buildComparisonPathFromIds(personAId: number, personBId: number): string {
  return `/person-${personAId}~${personAId}/person-${personBId}~${personBId}`;
}

export function createInitialPersonFromSegment(segment: string): PersonSearchResult | null {
  const parsed = parsePersonSegment(segment);
  if (!parsed) {
    return null;
  }

  const displayName = toTitleCase(parsed.slug.replace(/-/g, " ")) || `Person ${parsed.id}`;

  return {
    id: parsed.id,
    name: displayName,
    knownForDepartment: "Unknown",
    profilePath: null,
    popularity: 0,
  };
}
