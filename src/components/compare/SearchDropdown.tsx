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
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/65 bg-[rgba(252,248,243,0.9)] px-3 py-2 text-left text-sm text-stone-500 shadow-[0_16px_32px_-24px_rgba(31,25,18,0.65)] backdrop-blur-md">
        Type at least {minLength} characters.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/65 bg-[rgba(252,248,243,0.9)] px-3 py-2 text-left text-sm text-stone-500 shadow-[0_16px_32px_-24px_rgba(31,25,18,0.65)] backdrop-blur-md">
        Searching...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/65 bg-[rgba(252,248,243,0.9)] px-3 py-2 text-left text-sm text-stone-500 shadow-[0_16px_32px_-24px_rgba(31,25,18,0.65)] backdrop-blur-md">
        {errorMessage}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/65 bg-[rgba(252,248,243,0.9)] px-3 py-2 text-left text-sm text-stone-500 shadow-[0_16px_32px_-24px_rgba(31,25,18,0.65)] backdrop-blur-md">
        No people found.
      </div>
    );
  }

  return (
    <ul
      id={id}
      role="listbox"
      className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/65 bg-[rgba(252,248,243,0.9)] p-1.5 shadow-[0_18px_34px_-24px_rgba(31,25,18,0.65)] backdrop-blur-md"
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
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
                isActive ? "bg-white/85" : "hover:bg-white/65",
              )}
            >
              <Avatar name={person.name} profilePath={person.profilePath} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium tracking-tight text-stone-900">{person.name}</p>
                <p className="truncate text-[11px] text-stone-500">{person.knownForDepartment}</p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
