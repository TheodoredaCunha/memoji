import { KanjiData } from '../firestore';

export type QuizMode = 'kanji-reading' | 'meaning' | 'sentence' | 'random';

export function shuffleArray<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function sampleArray<T>(items: T[], count: number) {
  const result: T[] = [];
  const copy = [...items];
  while (result.length < count && copy.length > 0) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

export function normalizeHiragana(text: string) {
  if (!text) return '';
  const normalized = text.normalize('NFKC').replace(/\s+/g, '');
  return normalized.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function splitReadings(reading: string) {
  return reading
    .split(',')
    .map((value) => normalizeHiragana(value.trim()))
    .filter(Boolean);
}

export function buildMeaningOptions(items: KanjiData[], correctId: string) {
  const correctItem = items.find((item) => item.id === correctId);
  if (!correctItem) return [];

  const distractors = sampleArray(
    items.filter((item) => item.id !== correctId),
    3,
  );

  return shuffleArray([correctItem, ...distractors]);
}
