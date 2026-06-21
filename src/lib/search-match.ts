/** Lightweight fuzzy text matching for marketplace search — no external deps. */

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(row[j]! + 1, prev + 1, row[j - 1]! + cost);
      row[j - 1] = prev;
      prev = next;
    }
    row[b.length] = prev;
  }
  return row[b.length]!;
}

function wordFuzzyMatch(text: string, word: string): boolean {
  if (word.length < 2) return text.includes(word);
  if (text.includes(word)) return true;
  if (word.length < 4) return false;

  const maxDist = Math.max(1, Math.floor(word.length * 0.25));
  const textWords = text.split(/[\s,./\-_]+/).filter(Boolean);
  for (const tw of textWords) {
    if (tw.includes(word) || word.includes(tw)) return true;
    if (levenshtein(tw, word) <= maxDist) return true;
  }
  return levenshtein(text.slice(0, word.length + 2), word) <= maxDist;
}

/** Returns true if query matches text (substring + typo tolerance). */
export function matchesQuery(text: string, q: string): boolean {
  const query = normalize(q);
  if (!query) return true;
  const target = normalize(text);
  if (target.includes(query)) return true;

  const words = query.split(/\s+/).filter(Boolean);
  return words.every((w) => wordFuzzyMatch(target, w));
}

/** Score 0–100 for ranking: exact > prefix > fuzzy > none. */
export function textMatchScore(text: string, q: string): number {
  const query = normalize(q);
  if (!query) return 0;
  const target = normalize(text);
  if (target === query) return 100;
  if (target.startsWith(query)) return 90;
  if (target.includes(query)) return 75;

  const words = query.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const scores: number[] = words.map((w) => (wordFuzzyMatch(target, w) ? 50 : 0));
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / words.length);
}
