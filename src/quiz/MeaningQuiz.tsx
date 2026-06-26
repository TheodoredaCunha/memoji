import { useMemo, useState } from 'react';
import { KanjiData } from '../firestore';
import { buildMeaningOptions, shuffleArray } from './quizUtils';

type Props = {
  items: KanjiData[];
};

export default function MeaningQuiz({ items }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);

  const currentItem = useMemo(() => {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }, [items, round]);

  const options = useMemo(() => {
    if (!currentItem) return [];
    return buildMeaningOptions(items, currentItem.id as string);
  }, [currentItem, items]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentItem || !selectedId) return;

    const correct = selectedId === currentItem.id;
    if (correct) {
      setFeedback('Correct!');
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setFeedback(`Incorrect. The right answer is ${currentItem.kanji}.`);
      setStreak(0);
    }
    setSelectedId(null);
    setRound((value) => value + 1);
  };

  if (!currentItem) {
    return <p>Add at least one kanji to try the meaning quiz.</p>;
  }

  return (
    <div className="modern-quiz-card">
      <div className="quiz-header">
        <div className="quiz-badge">
          Meaning → Kanji
        </div>

        <div className="quiz-stats">
          <span>Score: {score}</span>
          <span>Streak: {streak}</span>
        </div>
      </div>

      <p className="quiz-prompt">
        Which kanji matches this meaning?
      </p>

      <div className="quiz-question">
        {currentItem.meaning}
      </div>

      <form onSubmit={handleSubmit} className="quiz-options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`quiz-option ${
              selectedId === option.id ? 'selected' : ''
            }`}
            onClick={() => setSelectedId(option.id as string)}
          >
            {option.kanji}
          </button>
        ))}

        <button
          type="submit"
          className="quiz-submit"
          disabled={!selectedId}
        >
          Submit
        </button>
      </form>

      {feedback && (
        <div className="quiz-feedback">
          {feedback}
        </div>
      )}
    </div>
  );
}
