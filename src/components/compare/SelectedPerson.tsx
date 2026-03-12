import Image from "next/image";

import { getTmdbProfileImageUrl } from "@/lib/tmdb/image";
import type { PersonSearchResult } from "@/lib/types/search-person";

type SelectedPersonProps = {
  person: PersonSearchResult;
  onClear: () => void;
};

export function SelectedPerson({ person, onClear }: SelectedPersonProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-stone-400/55 pb-2 pt-1">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar name={person.name} profilePath={person.profilePath} />
        <div className="min-w-0 text-left">
          <p className="truncate text-sm tracking-tight text-stone-900">{person.name}</p>
          <p className="truncate text-xs text-stone-500">{person.knownForDepartment}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer shrink-0 rounded-sm px-1 py-0.5 text-xs text-stone-500 transition-colors duration-150 hover:bg-stone-200/50 hover:text-stone-800 focus:outline-none focus-visible:bg-stone-200/50 focus-visible:text-stone-800"
        aria-label={`Clear ${person.name}`}
      >
        Clear
      </button>
    </div>
  );
}

type AvatarProps = {
  name: string;
  profilePath: string | null;
};

export function Avatar({ name, profilePath }: AvatarProps) {
  const profileUrl = getTmdbProfileImageUrl(profilePath, "w92");
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative flex size-7.5 items-center justify-center overflow-hidden rounded-full bg-stone-300/65 text-[10px] font-medium text-stone-700"
      aria-label={profilePath ? `${name} avatar placeholder` : `${name} initials`}
    >
      {profileUrl ? (
        <Image src={profileUrl} alt="" fill sizes="28px" className="object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
