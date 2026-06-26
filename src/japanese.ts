export async function lookupJapaneseData(text: string) {
  try {
    const query = text.trim();
    if (!query) return { word: '', reading: '', meaning: '' };

    const API_BASE = import.meta.env.VITE_API_BASE || '';

    const res = await fetch(
      `${API_BASE}/jisho?keyword=${encodeURIComponent(query)}`
    );
    if (!res.ok) return { word: '', reading: '', meaning: '' };

    const json = await res.json();
    if (!json.data?.length) return { word: '', reading: '', meaning: '' };

    // Strongest match: exact slug
    const entry =
      json.data.find((e: any) => e.slug === query) ||
      json.data.find((e: any) =>
        e.japanese?.some((j: any) => j.word === query)
      ) ||
      json.data[0];

    // Prefer full-word match
    const jp =
      entry.japanese.find((j: any) => j.word === query) ||
      entry.japanese.find((j: any) => j.reading?.length > 1) ||
      entry.japanese[0];

    return {
      word: jp.word || jp.reading || '',
      reading: jp.reading || '',
      meaning: entry.senses?.[0]?.english_definitions?.join(', ') || '',
    };
  } catch (err) {
    console.error(err);
    return { word: '', reading: '', meaning: '' };
  }
}