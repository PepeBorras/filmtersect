import type { NormalizedCredit, SharedTitle } from "@/lib/types/filmtersect";

function creditKey(credit: NormalizedCredit) {
  return `${credit.mediaType}:${credit.titleId}`;
}

function formatYear(year: number | null): string | null {
  return year ? String(year) : null;
}

function roleLabel(credit: NormalizedCredit): string {
  if (credit.character) {
    return credit.character;
  }

  if (credit.job) {
    return credit.job;
  }

  if (credit.department) {
    return credit.department;
  }

  return credit.creditType === "cast" ? "Cast" : "Crew";
}

function dedupeRoles(credits: NormalizedCredit[]): string {
  const seen = new Set<string>();
  const roles: string[] = [];

  credits.forEach((credit) => {
    const key = roleLabel(credit);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    roles.push(key);
  });

  return roles.join(" / ");
}

export function findDirectOverlaps(personACredits: NormalizedCredit[], personBCredits: NormalizedCredit[]): SharedTitle[] {
  const creditsByTitleA = new Map<string, NormalizedCredit[]>();
  const creditsByTitleB = new Map<string, NormalizedCredit[]>();

  personACredits.forEach((credit) => {
    const key = creditKey(credit);
    const existing = creditsByTitleA.get(key) ?? [];
    creditsByTitleA.set(key, [...existing, credit]);
  });

  personBCredits.forEach((credit) => {
    const key = creditKey(credit);
    const existing = creditsByTitleB.get(key) ?? [];
    creditsByTitleB.set(key, [...existing, credit]);
  });

  const overlaps: SharedTitle[] = [];

  creditsByTitleA.forEach((creditsA, key) => {
    const creditsB = creditsByTitleB.get(key);
    if (!creditsB) {
      return;
    }

    const base = creditsA[0] ?? creditsB[0];
    if (!base) {
      return;
    }

    overlaps.push({
      id: base.titleId,
      mediaType: base.mediaType,
      title: base.titleName,
      year: formatYear(base.year),
      posterPath: base.posterPath,
      personARole: dedupeRoles(creditsA),
      personBRole: dedupeRoles(creditsB),
    });
  });

  return overlaps.sort((left, right) => {
    if (!left.year && !right.year) {
      return 0;
    }

    if (!left.year) {
      return 1;
    }

    if (!right.year) {
      return -1;
    }

    return Number(right.year) - Number(left.year);
  });
}
