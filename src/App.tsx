import { useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { saveKanji, getSavedKanji, removeKanji, KanjiData, updateKanjiNotes } from './firestore';
import { lookupJapaneseData } from './japanese';
import QuizModeSelector from './quiz/QuizModeSelector';
import KanjiReadingQuiz from './quiz/KanjiReadingQuiz';
import MeaningQuiz from './quiz/MeaningQuiz';
import { QuizMode, pickRandom, shuffleArray } from './quiz/quizUtils';

type KanjiEntry = KanjiData & { id: string };

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function App() {
  const [kanji, setKanji] = useState('');
  const [reading, setReading] = useState('');
  const [meaning, setMeaning] = useState('');
  const [notes, setNotes] = useState('');
  const [view, setView] = useState<'list' | 'add' | 'quiz'>('list');
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>('kanji-reading');
  const [activeQuizMode, setActiveQuizMode] = useState<QuizMode>('kanji-reading');
  const [kanjis, setKanjis] = useState<KanjiEntry[]>([]);
  const [status, setStatus] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<KanjiEntry | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const { user, loading, signInWithGoogle, signOutUser } = useAuth();

  const loadKanjis = async (uid?: string | null) => {
    if (!uid) {
      setKanjis([]);
      return;
    }
    try {
      const data = await getSavedKanji(uid);
      setKanjis(data as KanjiEntry[]);
    } catch (error) {
      console.error(error);
      setStatus('Unable to load saved kanji.');
    }
  };

  useEffect(() => {
    if (!loading) loadKanjis(user?.uid ?? null);
  }, [user, loading]);

  const openCard = (entry: KanjiEntry) => {
    setSelectedEntry(entry);
    setIsCardFlipped(false);
  };

  const closeCard = () => {
    setSelectedEntry(null);
  };

  useEffect(() => {
    if (!selectedEntry) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCard();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntry]);

  useEffect(() => {
  if (!status) return;

  const timer = setTimeout(() => {
    setStatus('');
  }, 2500);

  return () => clearTimeout(timer);
  }, [status]);


const latestLookup = useRef(0);

const handleKanjiChange = async (val: string) => {
  setKanji(val);

  if (!val.trim()) {
    setReading('');
    setMeaning('');
    return;
  }

  const lookupId = ++latestLookup.current;

  setStatus('Looking up reading and meaning...');

  try {
    const result = await lookupJapaneseData(val);

    // Ignore stale results
    if (lookupId !== latestLookup.current) return;

    setReading(result.reading || '');
    setMeaning(result.meaning || '');

    if (!result.reading || !result.meaning) {
      setStatus('Word not found.');
    } else {
      setStatus('');
    }
    console.log('Lookup result:', result);
  } catch (err) {
    console.error(err);
    setStatus('Lookup failed.');
  }
};

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!kanji.trim() || !reading.trim() || !meaning.trim()) {
      setStatus('Kanji, reading, and meaning are required.');
      return;
    }
    if (!user) {
      setStatus('Please sign in to save kanji.');
      return;
    }

    setStatus('Saving...');
    try {
      await saveKanji(user.uid, {
        kanji: kanji.trim(),
        reading: reading.trim(),
        meaning: meaning.trim(),
        notes: notes.trim()
      });

      setKanji('');
      setReading('');
      setMeaning('');
      setNotes('');
      setStatus('Kanji saved successfully.');
      loadKanjis(user.uid);
    } catch (error) {
      console.error(error);
      setStatus('Failed to save kanji.');
    }
  };

  const startQuiz = () => {
    if (kanjis.length === 0) {
      setStatus('Add at least one kanji before generating a quiz.');
      return;
    }

    if (quizMode === 'random') {
      const modes: QuizMode[] = ['kanji-reading', 'meaning'];
      setActiveQuizMode(pickRandom(modes));
    } else {
      setActiveQuizMode(quizMode);
    }

    setIsQuizStarted(true);
    setStatus('Quiz started.');
  };

  const stopQuiz = () => {
    setIsQuizStarted(false);
    setStatus('Quiz stopped.');
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>Flashcards</h1>
        <p>Save Japanese words, phrases, and kanji, then practice with flashcard quizzes.</p>
        <div style={{ marginTop: 12 }}>
          {user ? (
            <>
              <strong>Signed in:</strong> {user.displayName || user.email}
              <button style={{ marginLeft: 12 }} onClick={() => signOutUser()}>Sign out</button>
            </>
          ) : (
            <button onClick={() => signInWithGoogle()}>Login with Google</button>
          )}
        </div>
      </header>

      <nav className="page-nav">
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Saved Kanji</button>
        <button className={view === 'add' ? 'active' : ''} onClick={() => setView('add')}>Add New Kanji</button>
        <button className={view === 'quiz' ? 'active' : ''} onClick={() => setView('quiz')}>Quiz</button>
      </nav>

      {view === 'quiz' && (
        <div className="panel quiz-mode-panel">
          <QuizModeSelector
            selectedMode={quizMode}
            onSelectMode={(mode) => {
              setQuizMode(mode);
              setStatus(
                mode === 'kanji-reading'
                  ? 'Mode: Kanji → Hiragana'
                  : 'Mode: Meaning → Kanji'
              );
            }}
          />
        </div>
      )}

      {status && (
        <div className="toast-notification">
          {status}
        </div>
      )}

      <main>
        {view === 'add' && (
          <section className="panel">
            <h2>Add a new Kanji</h2>
            <form onSubmit={handleSubmit} className="kanji-form">
              <label>
                Kanji
              <input 
                defaultValue={kanji} 
                placeholder="日" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); 
                    handleKanjiChange(e.currentTarget.value); // Changed target to currentTarget
                  }
                }} 
                onBlur={(e) => handleKanjiChange(e.currentTarget.value)} // Changed target to currentTarget
              />
              </label>
              <label>
                Hiragana / Reading
                <input value={reading} readOnly placeholder="auto-filled hiragana" />
              </label>
              <label>
                Meaning
                <input value={meaning} readOnly placeholder="auto-filled meaning" />
              </label>
              <label>
                Notes
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </label>
              <button type="submit">Save Kanji</button>
            </form>
          </section>
        )}

        {view === 'list' && (
          <section className="panel">
            <h2>Saved Kanjis</h2>
            {!user ? (
              <p>Please sign in to view your saved kanji.</p>
            ) : kanjis.length === 0 ? (
              <p>You have no saved kanji yet. Add one from the "Add New Kanji" page.</p>
            ) : (
              <div className="kanji-grid">
                {kanjis.map((entry) => (
                  <article
                      key={entry.id}
                      className="kanji-card"
                      onClick={() => openCard(entry)}
                    >
                    <div className="kanji-big">{entry.kanji}</div>
                    <div>{entry.reading}</div>
                    <div>{entry.meaning}</div>
                    <div style={{ marginTop: 8 }}>
                      <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        if (!user) return;
                        await removeKanji(user.uid, entry.id);
                        loadKanjis(user.uid);
                      }}
                    >
                      Remove
                    </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'quiz' && (
          <section className="panel quiz-panel">
          <div className="quiz-actions">
            <div>
              <h2>Flashcard Quiz</h2>

              <p className="quiz-mode-indicator">
                Current Mode:{' '}
                {quizMode === 'kanji-reading'
                  ? 'Kanji → Hiragana'
                  : 'Meaning → Kanji'}
              </p>
            </div>

            {!isQuizStarted ? (
              <button type="button" onClick={startQuiz}>
                Start Quiz
              </button>
            ) : (
              <button type="button" onClick={stopQuiz}>
                Stop Quiz
              </button>
            )}
          </div>
            {!isQuizStarted ? (
              <p>Select a mode and press Start Quiz.</p>
            ) : kanjis.length === 0 ? (
              <p>Add kanji first to unlock quizzes.</p>
            ) : (
              <div className="quiz-mode-container">
                {activeQuizMode === 'kanji-reading' && <KanjiReadingQuiz items={kanjis} />}
                {activeQuizMode === 'meaning' && <MeaningQuiz items={kanjis} />}
              </div>
            )}
          </section>
        )}
      </main>


      {selectedEntry && (
        <div className="card-modal-overlay" onClick={closeCard}>
          <div
            className={`flip-card ${isCardFlipped ? 'flipped' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flip-card-inner">
              {/* Front */}
              <div
                className="flip-card-front"
                onClick={() => setIsCardFlipped(true)}
              >
                <div className="front-content">
                  <div className="kanji-large">{selectedEntry.kanji}</div>
                  <div className="reading-large">{selectedEntry.reading}</div>
                  <div className="meaning-text">{selectedEntry.meaning}</div>
                </div>

                <small>Click to view notes</small>
              </div>
              {/* Back */}
              <div className="flip-card-back" onClick={() => setIsCardFlipped(false)}>
                <textarea
                  className="full-card-notes"
                  value={selectedEntry.notes || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setSelectedEntry({
                      ...selectedEntry,
                      notes: e.target.value
                    })
                  }
                  onBlur={async () => {
                    if (!user || !selectedEntry.id) return;

                    await updateKanjiNotes(
                      user.uid,
                      selectedEntry.id,
                      selectedEntry.notes || ''
                    );

                    loadKanjis(user.uid);
                    setStatus('Notes saved.');
                  }}
                  placeholder="Write your notes here..."
                />
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;