const SELF_CHARACTER_PREFIXES = ["self", "himself", "herself"];

export function isSelfAppearanceCharacter(character: string | null | undefined): boolean {
  if (!character) {
    return false;
  }

  const normalized = character.trim().toLowerCase();
  return SELF_CHARACTER_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix} `) || normalized.startsWith(`${prefix}-`),
  );
}
