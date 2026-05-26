// Main app: state machine + tweaks + persistence

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#E07B5C",
  "theme": "light",
  "questionCount": 10,
  "animation": "normal"
}/*EDITMODE-END*/;

// Accent hex → matching soft + ink derivations (precomputed via oklch)
const ACCENT_PALETTES = {
  '#e07b5c': { '--accent': 'oklch(0.68 0.16 35)',  '--accent-soft': 'oklch(0.94 0.04 35)',  '--accent-ink': 'oklch(0.42 0.14 32)' },
  '#6366f1': { '--accent': 'oklch(0.58 0.16 270)', '--accent-soft': 'oklch(0.94 0.04 270)', '--accent-ink': 'oklch(0.36 0.14 270)' },
  '#4d8c6f': { '--accent': 'oklch(0.56 0.13 155)', '--accent-soft': 'oklch(0.94 0.04 155)', '--accent-ink': 'oklch(0.32 0.11 155)' },
  '#a85a8a': { '--accent': 'oklch(0.58 0.16 340)', '--accent-soft': 'oklch(0.94 0.04 340)', '--accent-ink': 'oklch(0.36 0.14 340)' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Persisted state
  const [saved, setSaved] = React.useState(() => new Set(readLS('toeic-saved', [])));
  const [mistakes, setMistakes] = React.useState(() => readLS('toeic-mistakes', {})); // { word: {correct, selected, ts, count} }
  const [history, setHistory] = React.useState(() => readLS('toeic-history', []));
  const [streak, setStreak] = React.useState(() => readLS('toeic-streak', { count: 0, last: null }));
  const [lastDifficulty, setLastDifficulty] = React.useState(() => readLS('toeic-last-diff', null));
  const [totalStudied, setTotalStudied] = React.useState(() => readLS('toeic-total', 0));

  // Screen state
  const [screen, setScreen] = React.useState('start');
  const [quizState, setQuizState] = React.useState(null);  // {questions, difficulty, mode}
  const [resultState, setResultState] = React.useState(null);
  const [showSaved, setShowSaved] = React.useState(false);
  const [showMistakes, setShowMistakes] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);

  // Apply theme + accent + animation tweaks to <html>
  React.useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = tweaks.theme;
    html.dataset.anim = tweaks.animation;
    const palette = ACCENT_PALETTES[String(tweaks.accentColor).toLowerCase()] || ACCENT_PALETTES['#e07b5c'];
    Object.entries(palette).forEach(([k, v]) => html.style.setProperty(k, v));
  }, [tweaks.theme, tweaks.accentColor, tweaks.animation]);

  const toggleSaved = (word) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word); else next.add(word);
      writeLS('toeic-saved', [...next]);
      return next;
    });
  };

  const removeMistake = (word) => {
    setMistakes(prev => {
      const next = { ...prev };
      delete next[word];
      writeLS('toeic-mistakes', next);
      return next;
    });
  };

  const clearAllMistakes = () => {
    setMistakes({});
    writeLS('toeic-mistakes', {});
  };

  const startQuiz = (difficulty, opts = {}) => {
    const count = tweaks.questionCount || 10;
    const questions = buildQuestions(difficulty, count, opts.onlyWords);
    if (!questions.length) return;
    setQuizState({ questions, difficulty, mode: opts.mode || 'normal' });
    setLastDifficulty(difficulty);
    writeLS('toeic-last-diff', difficulty);
    setScreen('quiz');
  };

  const finishQuiz = ({ answers, questions }) => {
    const score = answers.filter(a => a.isCorrect).length;
    const total = answers.length;
    const pct = Math.round((score / total) * 100);
    const difficulty = quizState.difficulty;

    // history
    const entry = { ts: Date.now(), difficulty, score, total, pct };
    const newHistory = [entry, ...history].slice(0, 30);
    setHistory(newHistory);
    writeLS('toeic-history', newHistory);

    // streak
    const tk = todayKey();
    if (streak.last !== tk) {
      const yest = new Date(Date.now() - 86400000);
      const yk = `${yest.getFullYear()}-${yest.getMonth()+1}-${yest.getDate()}`;
      const newStreak = { count: streak.last === yk ? streak.count + 1 : 1, last: tk };
      setStreak(newStreak);
      writeLS('toeic-streak', newStreak);
    }

    // totals
    const newTotal = totalStudied + total;
    setTotalStudied(newTotal);
    writeLS('toeic-total', newTotal);

    // mistakes ledger — add wrongs, auto-remove on correct (mastery)
    setMistakes(prev => {
      const next = { ...prev };
      for (const a of answers) {
        if (a.isCorrect) {
          delete next[a.word];
        } else {
          const existing = next[a.word];
          next[a.word] = {
            correct: a.correct,
            selected: a.selected,
            difficulty: a.difficulty,
            ts: Date.now(),
            count: (existing?.count || 0) + 1,
          };
        }
      }
      writeLS('toeic-mistakes', next);
      return next;
    });

    setResultState({ answers, questions });
    setScreen('result');
  };

  const handleReviewMistakes = (wrongWords) => {
    startQuiz(quizState.difficulty, { onlyWords: wrongWords, mode: 'review' });
  };

  const handlePracticeSaved = (words) => {
    setShowSaved(false);
    // Use the most common difficulty among saved words for the badge
    const diffs = words.map(w => wordById(w)?.difficulty).filter(Boolean);
    const diff = diffs[0] || 'normal';
    startQuiz(diff, { onlyWords: words, mode: 'saved' });
  };

  const handlePracticeMistakes = (words) => {
    setShowMistakes(false);
    const diffs = words.map(w => wordById(w)?.difficulty).filter(Boolean);
    const diff = diffs[0] || 'normal';
    startQuiz(diff, { onlyWords: words, mode: 'review' });
  };

  return (
    <div className="app-shell">
      <TopNav
        savedCount={saved.size}
        historyCount={history.length}
        mistakesCount={Object.keys(mistakes).length}
        onOpenSaved={() => setShowSaved(true)}
        onOpenHistory={() => setShowHistory(true)}
        onOpenMistakes={() => setShowMistakes(true)}
      />

      {screen === 'start' && (
        <StartScreen
          onStart={(diff) => startQuiz(diff)}
          lastDifficulty={lastDifficulty}
          totalStudied={totalStudied}
          savedCount={saved.size}
          mistakesCount={Object.keys(mistakes).length}
          onOpenSaved={() => setShowSaved(true)}
          onOpenMistakes={() => setShowMistakes(true)}
        />
      )}
      {screen === 'quiz' && quizState && (
        <QuizScreen
          questions={quizState.questions}
          difficulty={quizState.difficulty}
          mode={quizState.mode}
          savedSet={saved}
          toggleSaved={toggleSaved}
          onFinish={finishQuiz}
          onQuit={() => setScreen('start')}
        />
      )}
      {screen === 'result' && resultState && (
        <ResultScreen
          result={resultState}
          history={history}
          savedSet={saved}
          toggleSaved={toggleSaved}
          onRetry={() => startQuiz(quizState.difficulty)}
          onChangeDiff={() => setScreen('start')}
          onReviewMistakes={handleReviewMistakes}
          onHome={() => setScreen('start')}
        />
      )}

      {showSaved && (
        <SavedSheet
          savedSet={saved}
          toggleSaved={toggleSaved}
          onClose={() => setShowSaved(false)}
          onPractice={handlePracticeSaved}
        />
      )}
      {showMistakes && (
        <MistakesSheet
          mistakes={mistakes}
          onClose={() => setShowMistakes(false)}
          onRemove={removeMistake}
          onClearAll={clearAllMistakes}
          onPractice={handlePracticeMistakes}
        />
      )}
      {showHistory && (
        <HistorySheet
          history={history}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="外観">
          <TweakRadio
            label="テーマ"
            value={tweaks.theme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark',  label: 'Dark' },
            ]}
            onChange={(v) => setTweak('theme', v)}
          />
          <TweakColor
            label="アクセント"
            value={tweaks.accentColor}
            options={['#E07B5C', '#6366F1', '#4D8C6F', '#A85A8A']}
            onChange={(v) => setTweak('accentColor', v)}
          />
        </TweakSection>
        <TweakSection label="クイズ">
          <TweakSelect
            label="問題数"
            value={String(tweaks.questionCount)}
            options={[
              { value: '5',  label: '5問' },
              { value: '10', label: '10問' },
              { value: '15', label: '15問' },
              { value: '20', label: '20問' },
            ]}
            onChange={(v) => setTweak('questionCount', parseInt(v, 10))}
          />
          <TweakRadio
            label="アニメ"
            value={tweaks.animation}
            options={[
              { value: 'low',    label: '控えめ' },
              { value: 'normal', label: '通常' },
            ]}
            onChange={(v) => setTweak('animation', v)}
          />
        </TweakSection>
        <TweakSection label="データ">
          <TweakButton
            label="進捗をリセット"
            secondary
            onClick={() => {
              if (!confirm('保存した単語、間違えた単語、履歴を全て消去します。続行？')) return;
              localStorage.removeItem('toeic-saved');
              localStorage.removeItem('toeic-mistakes');
              localStorage.removeItem('toeic-history');
              localStorage.removeItem('toeic-streak');
              localStorage.removeItem('toeic-last-diff');
              localStorage.removeItem('toeic-total');
              setSaved(new Set());
              setMistakes({});
              setHistory([]);
              setStreak({ count: 0, last: null });
              setLastDifficulty(null);
              setTotalStudied(0);
            }}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
