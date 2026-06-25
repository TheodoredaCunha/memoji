import { useMemo, useState } from 'react';
import { KanjiData } from '../firestore';
import { normalizeHiragana, splitReadings } from './quizUtils';

type Props = {
  items: KanjiData[];
};

export default function KanjiReadingQuiz({ items }: Props) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentItem = useMemo(() => {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }, [items]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentItem) return;

    const normalizedAnswer = normalizeHiragana(answer);
    const validReadings = splitReadings(currentItem.reading);
    const correct = validReadings.includes(normalizedAnswer);

    if (correct) {
      setFeedback(`Correct! ${currentItem.kanji} reads ${currentItem.reading}.`);
      setScore((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setFeedback(`Incorrect. Expected ${currentItem.reading}.`);
      setStreak(0);
    }

    setAnswer('');
  };

  if (!currentItem) {
    return <p>Add at least one kanji to start the reading quiz.</p>;
  }

  return (
    <div className="quiz-card">
      <h3>Kanji → Hiragana</h3>
      <p className="quiz-prompt">What is the reading for <strong>{currentItem.kanji}</strong>?</p>
      <form onSubmit={handleSubmit} className="quiz-answer-form">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type hiragana reading"
        />
        <button type="submit">Submit</button>
      </form>
      {feedback && <div className="quiz-feedback">{feedback}</div>}
      <div className="quiz-stats">
        <span>Score: {score}</span>
        <span>Streak: {streak}</span>
      </div>
    </div>
  );
}
