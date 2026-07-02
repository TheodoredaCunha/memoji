import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const kuroshiro = new Kuroshiro();
let kuroshiroReady = null;

async function ensureKuroshiro() {
  if (kuroshiroReady) {
    await kuroshiroReady;
    return;
  }

  const dictPath = path.join(__dirname, 'node_modules', 'kuromoji', 'dict');
  kuroshiroReady = kuroshiro.init(new KuromojiAnalyzer({ dictPath }));
  await kuroshiroReady;
}

ensureKuroshiro().catch((err) => {
  console.error('Failed to initialize Kuroshiro at startup', err);
});

app.post('/api/lookup', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const query = text.trim();
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    let meaning = '';
    if (apiKey) {
      const translateResponse = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, source: 'ja', target: 'en', format: 'text' }),
        }
      );

      if (translateResponse.ok) {
        const translateJson = await translateResponse.json();
        meaning = translateJson?.data?.translations?.[0]?.translatedText || '';
      } else {
        console.error('Google Translate request failed', await translateResponse.text());
      }
    }

    await ensureKuroshiro();
    const reading = (await kuroshiro.convert(query, { to: 'hiragana', mode: 'normal' })) || '';
    const pronunciation = (await kuroshiro.convert(query, { to: 'romaji', mode: 'normal' })) || '';

    res.json({ word: query, reading, pronunciation, meaning });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Translation lookup failed.' });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`Translation backend listening on port ${PORT}`);
});