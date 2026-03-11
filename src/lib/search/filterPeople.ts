import type { Person } from "@/lib/types/person";

export function filterPeople(people: Person[], query: string, limit = 6): Person[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return people
    .filter((person) => person.name.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}
