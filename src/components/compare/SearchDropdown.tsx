import type { PersonSearchResult } from "@/lib/types/search-person";

import { Avatar } from "@/components/compare/SelectedPerson";
import { cn } from "@/lib/utils/cn";

type SearchDropdownProps = {
  id: string;
  items: PersonSearchResult[];
  highlightedIndex: number;
  isLoading: boolean;
  errorMessage: string | null;
  canSearch: boolean;
  minLength: number;
  onSelect: (person: PersonSearchResult) => void;
};

export function SearchDropdown({
  id,
  items,
  highlightedIndex,
  isLoading,
  errorMessage,
  canSearch,
  minLength,
  onSelect,
}: SearchDropdownProps) {
  if (!canSearch) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-stone-300/55 bg-stone-50/98 px-3 py-2 text-left text-sm text-stone-500">
        Type at least {minLength} characters.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-stone-300/55 bg-stone-50/98 px-3 py-2 text-left text-sm text-stone-500">
        Searching...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-stone-300/55 bg-stone-50/98 px-3 py-2 text-left text-sm text-stone-500">
        {errorMessage}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-stone-300/55 bg-stone-50/98 px-3 py-2 text-left text-sm text-stone-500">
        No people found.
      </div>
    );
  }

  return (
    <ul
      id={id}
      role="listbox"
      className="absolute left-0 right-0 top-full z-20 mt-2 rounded-md border border-stone-300/55 bg-stone-50/98 p-1"
    >
      {items.map((person, index) => {
        const isActive = index === highlightedIndex;

        return (
          <li key={person.id} role="option" aria-selected={isActive}>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(person)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors duration-150",
                isActive ? "bg-stone-200/75" : "hover:bg-stone-200/45",
              )}
            >
              <Avatar name={person.name} profilePath={person.profilePath} />
              <div className="min-w-0">
                <p className="truncate text-sm tracking-tight text-stone-900">{person.name}</p>
                <p className="truncate text-xs text-stone-500">{person.knownForDepartment}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
