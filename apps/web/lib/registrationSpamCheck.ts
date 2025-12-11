export function isSuspiciousRegistration(input: {
  full_name: string;
  institution?: string | null;
  email: string;
  phone?: string | null;
}): boolean {
  let points = 0;
  const name = input.full_name?.trim() ?? "";
  const institution = input.institution?.trim() ?? "";

  if (name.length < 5 || name.length > 80) points++;
  if (!name.includes(" ")) points++;
  if (/[0-9@#\$%\^&\*\(\)_\+=\{\}\[\]:;"<>,.?/~`\\|]/.test(name)) points++;

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const word = words[0];
    const hasVowels = /[aeiouyëöüAEIOUYËÖÜ]/.test(word);
    const casingSwitches = (word.match(/([a-z][A-Z])|([A-Z][a-z])/g) || []).length;
    if (word.length >= 15 && casingSwitches >= 2) points++;
    if (word.length >= 20 && !hasVowels) points++;
  }

  if (institution) {
    const instWords = institution.split(/\s+/).filter(Boolean);
    if (instWords.length === 1) {
      const word = instWords[0];
      const hasVowel = /[aeiouyëöüAEIOUYËÖÜ]/.test(word);
      if (word.length >= 15 && !hasVowel) points++;
    }
  }

  return points >= 2;
}
