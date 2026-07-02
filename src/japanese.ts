export interface JapaneseLookupResult {
  word: string;
  reading: string;
  pronunciation: string;
  meaning: string;
}

const EMPTY_RESULT: JapaneseLookupResult = {
  word: '',
  reading: '',
  pronunciation: '',
  meaning: '',
};

export async function lookupJapaneseData(text: string): Promise<JapaneseLookupResult> {
  try {
    const query = text.trim();
    if (!query) return { ...EMPTY_RESULT };

    const response = await fetch('/api/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: query }),
    });

    if (!response.ok) {
      console.error('Backend lookup failed', await response.text());
      return { ...EMPTY_RESULT };
    }

    const data = await response.json();
    return {
      word: data.word || query,
      reading: data.reading || '',
      pronunciation: data.pronunciation || '',
      meaning: data.meaning || '',
    };
  } catch (error) {
    console.error('Lookup failed entirely:', error);
    return { ...EMPTY_RESULT };
  }
}