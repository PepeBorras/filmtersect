"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { SearchDropdown } from "@/components/compare/SearchDropdown";
import { SelectedPerson } from "@/components/compare/SelectedPerson";
import { usePersonSearch } from "@/components/compare/usePersonSearch";
import { Input } from "@/components/ui/Input";
import type { PersonSearchResult } from "@/lib/types/search-person";

type SearchAutocompleteProps = {
  label: string;
  placeholder: string;
  query: string;
  selectedPerson: PersonSearchResult | null;
  onQueryChange: (value: string) => void;
  onSelect: (person: PersonSearchResult) => void;
  onClear: () => void;
};

export function SearchAutocomplete({
  label,
  placeholder,
  query,
  selectedPerson,
  onQueryChange,
  onSelect,
  onClear,
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  const { canSearch, minLength, results: items, isLoading, errorMessage } = usePersonSearch(query);
  const safeHighlightedIndex = items.length ? Math.min(highlightedIndex, items.length - 1) : 0;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const hasQuery = Boolean(query.trim());
  const showDropdown = !selectedPerson && isOpen && hasQuery;

  function handleSelect(person: PersonSearchResult) {
    onSelect(person);
    onQueryChange("");
    setIsOpen(false);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!canSearch || !items.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev + 1) % items.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) => (prev - 1 + items.length) % items.length);
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      handleSelect(items[safeHighlightedIndex]);
    }
  }

  if (selectedPerson) {
    return (
      <div className="w-full text-left" ref={rootRef}>
        <p className="mb-1.5 text-[11px] tracking-[0.06em] text-stone-500">{label}</p>
        <SelectedPerson person={selectedPerson} onClear={onClear} />
      </div>
    );
  }

  return (
    <div className="relative w-full text-left" ref={rootRef}>
      <label htmlFor={inputId} className="mb-1.5 block text-[11px] tracking-[0.06em] text-stone-500">
        {label}
      </label>
      <Input
        id={inputId}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setHighlightedIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={handleInputKeyDown}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
      />

      {showDropdown ? (
        <SearchDropdown
          id={listboxId}
          items={items}
          highlightedIndex={safeHighlightedIndex}
          isLoading={isLoading}
          errorMessage={errorMessage}
          canSearch={canSearch}
          minLength={minLength}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}
