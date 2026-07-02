import { QuizMode } from './quizUtils';

type Props = {
  selectedMode: QuizMode;
  onSelectMode: (mode: QuizMode) => void;
};

const modes: { key: QuizMode; label: string }[] = [
  { key: 'kanji-reading', label: 'Kanji → Hiragana' },
  { key: 'meaning', label: 'Meaning → Kanji' }
];

export default function QuizModeSelector({
  selectedMode,
  onSelectMode
}: Props) {
  const activeIndex = modes.findIndex(
    (mode) => mode.key === selectedMode
  );

  return (
    <div className="quiz-slider">
      <div
        className="quiz-slider-thumb"
        style={{
          transform: `translateX(${activeIndex * 100}%)`
        }}
      />

      {modes.map((mode) => (
        <button
          key={mode.key}
          type="button"
          className={`quiz-slider-option ${
            selectedMode === mode.key ? 'active' : ''
          }`}
          onClick={() => onSelectMode(mode.key)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}