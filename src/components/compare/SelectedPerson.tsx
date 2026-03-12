import Image from "next/image";

import { getTmdbProfileImageUrl } from "@/lib/tmdb/image";
import type { PersonSearchResult } from "@/lib/types/search-person";

type SelectedPersonProps = {
  person: PersonSearchResult;
  onClear: () => void;
};

export function SelectedPerson({ person, onClear }: SelectedPersonProps) {
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-white/65 bg-white/50 px-3 py-2.5 shadow-[0_10px_22px_-20px_rgba(30,24,18,0.55)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar name={person.name} profilePath={person.profilePath} />
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-medium tracking-tight text-stone-900">{person.name}</p>
          <p className="truncate text-[11px] tracking-[0.03em] text-stone-500">{person.knownForDepartment}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer shrink-0 rounded-full border border-stone-300/70 bg-white/65 px-2.5 py-1 text-[10px] tracking-[0.06em] text-stone-600 transition-colors duration-150 hover:border-stone-500 hover:text-stone-800 focus:outline-none focus-visible:border-stone-500 focus-visible:text-stone-800"
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
      className="relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-stone-300/65 text-[10px] font-medium text-stone-700"
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
