import { QuizMode } from './quizUtils';

type Props = {
  selectedMode: QuizMode;
  onSelectMode: (mode: QuizMode) => void;
};

const modes: { key: QuizMode; label: string }[] = [
  { key: 'kanji-reading', label: 'Kanji → Hiragana' },
  { key: 'meaning', label: 'Meaning → Kanji' }
];

export default function QuizModeSelector({ selectedMode, onSelectMode }: Props) {
  return (
    <div className="quiz-mode-selector">
      {modes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          className={selectedMode === mode.key ? 'active' : ''}
          onClick={() => onSelectMode(mode.key)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
