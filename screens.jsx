// Screen components for the TOEIC Quiz app
// All components attached to window at the bottom for sharing across babel files.

const DIFFICULTY_LABEL = { easy: '易しい', normal: '普通', hard: '難しい' };
const DIFFICULTY_LABEL_EN = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

// ── Utilities ──────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function wordById(id) {
  return window.WORDS.find((w) => w.word === id);
}
function dedupe(words) {
  const seenW = new Set(), seenM = new Set();
  const out = [];
  for (const w of words) {
    if (seenW.has(w.word) || seenM.has(w.meaning)) continue;
    seenW.add(w.word); seenM.add(w.meaning);
    out.push(w);
  }
  return out;
}
function buildQuestions(difficulty, count, onlyWords, direction = 'en-to-jp') {
  let pool;
  if (onlyWords && onlyWords.length) {
    pool = dedupe(onlyWords.map(wordById).filter(Boolean));
  } else {
    pool = dedupe(window.WORDS.filter((w) => w.difficulty === difficulty));
  }
  const questions = shuffle(pool).slice(0, count);
  const fallbackPool = dedupe(window.WORDS);

  return questions.map((q) => {
    const distractorPool = dedupe(
      window.WORDS.filter((w) => w.meaning !== q.meaning && w.word !== q.word && w.difficulty === q.difficulty)
    );
    let distractors = shuffle(distractorPool).slice(0, 3);
    while (distractors.length < 3) {
      const r = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      if (r.meaning !== q.meaning && r.word !== q.word && !distractors.some(d => d.word === r.word)) {
        distractors.push(r);
      }
    }
    const fourWords = shuffle([q, ...distractors]);

    if (direction === 'jp-to-en') {
      return {
        word: q.word,
        meaning: q.meaning,
        prompt: q.meaning,
        correct: q.word,
        direction,
        difficulty: q.difficulty,
        choices: fourWords.map(w => ({ answer: w.word, hint: w.meaning })),
      };
    }
    return {
      word: q.word,
      meaning: q.meaning,
      prompt: q.word,
      correct: q.meaning,
      direction,
      difficulty: q.difficulty,
      choices: fourWords.map(w => ({ answer: w.meaning, hint: w.word })),
    };
  });
}

// ── Top Nav ─────────────────────────────────────────────────────
function TopNav({ savedCount, historyCount, mistakesCount, onOpenSaved, onOpenHistory, onOpenMistakes }) {
  return (
    <nav className="top-nav">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div>TOEIC Vocablary <span style={{ color: 'var(--ink-mute)', fontWeight: 500 }}></span></div>
      </div>
      <div className="nav-pills">
        <button className="nav-pill" onClick={onOpenMistakes} title="間違えた単語">
          <span style={{ color: 'var(--bad)' }}>✕</span>
          <span className="pill-num">{mistakesCount}</span>
        </button>
        <button className="nav-pill" onClick={onOpenSaved} title="保存した単語">
          <span style={{ color: 'var(--accent)' }}>★</span>
          <span className="pill-num">{savedCount}</span>
        </button>
        <button className="nav-pill" onClick={onOpenHistory} title="履歴">
          履歴 <span className="pill-num">{historyCount}</span>
        </button>
      </div>
    </nav>);

}

// ── Start Screen ────────────────────────────────────────────────
function StartScreen({ onStart, lastDifficulty, totalStudied, savedCount, mistakesCount, onOpenSaved, onOpenMistakes }) {
  const [picked, setPicked] = React.useState(lastDifficulty || 'easy');
  const levels = [
  { id: 'easy', name: '易しい', em: 'Easy', desc: '基礎単語' },
  { id: 'normal', name: '普通', em: 'Normal', desc: 'ビジネス中級' },
  { id: 'hard', name: '難しい', em: 'Hard', desc: '上級・高得点向け' }];

  return (
    <div className="start-hero screen-enter">
      <div className="start-eyebrow" style={{ height: "28px", fontSize: "18px" }}><span className="dot"></span>TOEIC 英単語クイズ ・ 全 300 語</div>
      <h1 className="start-title">
        毎日コツコツ、<br />
        <em>語彙力</em> 向上。
      </h1>
      <p className="start-sub">
        TOEIC頻出の英単語を、易しい・普通・難しいの3段階で。<br />
        間違えた単語は復習リストに自動で溜まっていきます。
      </p>

      <div className="start-stats">
        <button className="start-stat clickable" onClick={onOpenSaved} title="保存した単語を見る">
          <div className="start-stat-num">{savedCount}</div>
          <div className="start-stat-label"><span style={{ color: 'var(--accent)' }}>★</span> 保存</div>
        </button>
        <button className="start-stat clickable" onClick={onOpenMistakes} title="間違えた単語を見る">
          <div className="start-stat-num">{mistakesCount}</div>
          <div className="start-stat-label"><span style={{ color: 'var(--bad)' }}>✕</span> 間違えた単語</div>
        </button>
        <div className="start-stat">
          <div className="start-stat-num">{totalStudied}</div>
          <div className="start-stat-label">出題済み</div>
        </div>
      </div>

      <div className="diff-picker-label">難易度を選ぶ</div>
      <div className="diff-picker" role="radiogroup" aria-label="難易度">
        {levels.map((L) =>
        <button
          key={L.id}
          role="radio"
          aria-checked={picked === L.id}
          className={`diff-pick ${L.id} ${picked === L.id ? 'on' : ''}`}
          onClick={() => setPicked(L.id)}>
          
            <span className="diff-pick-body">
              <span className="diff-pick-name">{L.name}</span>
              <span className="diff-pick-em">{L.em}</span>
            </span>
            <span className="diff-pick-desc">{L.desc}</span>
          </button>
        )}
      </div>

      <div className="start-cta">
        <button className="btn btn-primary btn-lg" onClick={() => onStart(picked)}>
          Start
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', marginLeft: 4, fontSize: 18 }}>→</span>
        </button>
      </div>
    </div>);

}

// ── Difficulty Screen ───────────────────────────────────────────
function DifficultyScreen({ onPick, onBack }) {
  const levels = [
  { id: 'easy', rank: 'I', name: '易しい', em: 'Easy', desc: '基礎単語 100語から出題', meter: 1 },
  { id: 'normal', rank: 'II', name: '普通', em: 'Normal', desc: 'ビジネス頻出の中級語彙', meter: 2 },
  { id: 'hard', rank: 'III', name: '難しい', em: 'Hard', desc: '高得点を狙う上級語彙', meter: 3 }];

  return (
    <div className="screen-enter">
      <button className="nav-pill" onClick={onBack} style={{ marginBottom: 20 }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>←</span> 戻る
      </button>
      <h2 className="diff-section-title">難易度を選ぶ</h2>
      <p className="diff-section-sub">10問の出題。途中で抜けても、結果画面までスコアは保持されます。</p>
      <div className="diff-list">
        {levels.map((L) =>
        <button key={L.id} className={`diff-card ${L.id}`} onClick={() => onPick(L.id)}>
            <div className="diff-card-rank">{L.rank}</div>
            <div className="diff-card-body">
              <div className="diff-card-name">{L.name} <em>— {L.em}</em></div>
              <div className="diff-card-desc">{L.desc}</div>
            </div>
            <div className="diff-card-meter">
              {[1, 2, 3].map((i) =>
            <div key={i} className={`bar ${i <= L.meter ? 'on' : ''}`}></div>
            )}
            </div>
            <div className="diff-card-arrow">→</div>
          </button>
        )}
      </div>
    </div>);

}

// ── Quiz Screen ─────────────────────────────────────────────────
function QuizScreen({ questions, difficulty, onFinish, onQuit, savedSet, toggleSaved, mode }) {
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [streak, setStreak] = React.useState(0);

  const total = questions.length;
  const q = questions[idx];
  const score = answers.filter((a) => a.isCorrect).length;
  const isLast = idx === total - 1;

  const handleSelect = (meaning) => {
    if (selected !== null) return;
    const isCorrect = meaning === q.correct;
    setSelected(meaning);
    setAnswers((prev) => [...prev, { word: q.word, correct: q.correct, selected: meaning, isCorrect, difficulty: q.difficulty }]);
    setStreak((prev) => isCorrect ? prev + 1 : 0);
  };

  const handleNext = () => {
    if (selected === null) return;
    if (isLast) {
      onFinish({ answers: [...answers], questions });
    } else {
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  // Keyboard shortcuts: 1-4 to pick, Enter to continue
  React.useEffect(() => {
    const onKey = (e) => {
      if (selected === null && /^[1-4]$/.test(e.key)) {
        const choice = q.choices[parseInt(e.key, 10) - 1];
        if (choice) handleSelect(choice.meaning);
      } else if (selected !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const progressPct = (idx + (selected !== null ? 1 : 0)) / total * 100;
  const isStarred = savedSet.has(q.word);
  const isCorrect = selected !== null && selected === q.correct;

  return (
    <div className="quiz-stage screen-enter">
      <div className="quiz-progress-row">
        <div className="quiz-counter">
          <span className="q-now">{String(idx + 1).padStart(2, '0')}</span>
          <span className="q-sep">/</span>
          <span className="q-tot">{String(total).padStart(2, '0')}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
        {streak >= 2 &&
        <div className="streak-chip">
            <span className="flame">×</span>{streak} 連続
          </div>
        }
        <button
          className="nav-pill"
          onClick={onQuit}
          title="やめる"
          style={{ padding: '6px 10px' }}>
          ✕</button>
      </div>

      <div className="paper-card word-card anim-enter" key={idx}>
        <div className="corner-mark">
          {mode === 'review' ? '復習モード' : DIFFICULTY_LABEL_EN[q.difficulty]} · No. {idx + 1}
        </div>
        <button
          className={`star-btn ${isStarred ? 'active' : ''}`}
          onClick={() => toggleSaved(q.word)}
          title={isStarred ? '保存解除' : '保存'}>
          
          <span style={{ fontSize: 16, lineHeight: 1 }}>{isStarred ? '★' : '☆'}</span>
        </button>
        <div className="word-prompt">次の語の意味は？</div>
        <div className="word-display">{q.word}</div>
        <div className="word-pos">— choose the closest meaning</div>
      </div>

      <div className="choices-grid">
        {q.choices.map((c, i) => {
          const letter = String.fromCharCode(65 + i); // A, B, C, D
          let cls = 'choice';
          if (selected !== null) {
            cls += ' revealed';
            if (c.meaning === q.correct) cls += ' correct';else
            if (c.meaning === selected) cls += ' wrong';else
            cls += ' dimmed';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSelect(c.meaning)}
              disabled={selected !== null}>
              
              <div className="choice-letter">{letter}</div>
              <div className="choice-body">
                <div className="choice-meaning">{c.meaning}</div>
                <div className="choice-english">{c.english}</div>
              </div>
            </button>);

        })}
      </div>

      {selected !== null &&
      <div className={`feedback-bar ${isCorrect ? 'ok' : 'bad'} anim-enter`}>
          <div className="feedback-msg">
            <span className="check-icon">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                {isCorrect ?
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> :
              <><path d="M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>
              }
              </svg>
            </span>
            <span>
              {isCorrect ? '正解！' : '不正解 — '}
              {!isCorrect && <span style={{ fontWeight: 600 }}>{q.correct}</span>}
            </span>
          </div>
          <button className="btn btn-primary" onClick={handleNext} style={{ padding: '10px 20px', fontSize: 14, borderRadius: 12 }}>
            {isLast ? '結果を見る' : '次へ'}
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', marginLeft: 2, fontSize: 16 }}>→</span>
          </button>
        </div>
      }
    </div>);

}

// ── Result Screen ───────────────────────────────────────────────
function PercentRing({ pct }) {
  const r = 14,c = 2 * Math.PI * r;
  const dash = pct / 100 * c;
  return (
    <svg className="pct-svg" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
      <circle cx="18" cy="18" r={r} fill="none"
      stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"
      strokeDasharray={`${dash} ${c}`}
      transform="rotate(-90 18 18)"
      style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.2,.8,.2,1)' }} />
      
    </svg>);

}

function ResultScreen({ result, history, savedSet, toggleSaved, onRetry, onChangeDiff, onReviewMistakes, onHome }) {
  const [tab, setTab] = React.useState('review');
  const { answers, questions } = result;
  const total = answers.length;
  const score = answers.filter((a) => a.isCorrect).length;
  const pct = Math.round(score / total * 100);
  const wrong = answers.filter((a) => !a.isCorrect);
  const diff = answers[0]?.difficulty || 'easy';

  let msg, emEm;
  if (pct === 100) {msg = '完璧';emEm = 'です。';} else
  if (pct >= 80) {msg = '素晴らしい';emEm = '一歩です。';} else
  if (pct >= 60) {msg = 'よくできました';emEm = '。続けましょう。';} else
  if (pct >= 40) {msg = 'もう少し';emEm = '。復習を。';} else
  {msg = '練習が必要';emEm = 'です。';}

  return (
    <div className="screen-enter">
      <div className="paper-card" style={{ borderRadius: 28, overflow: 'hidden' }}>
        <div className="result-hero">
          <div className="result-eyebrow">
            <span className={`diff-pill ${diff}`}>{DIFFICULTY_LABEL[diff]}</span>
          </div>
          <div className="result-score-display anim-fade">
            {score}<span className="over"> /{total}</span>
          </div>
          <div className="result-percent-ring">
            <span className="pct-num">{pct}%</span>
            <PercentRing pct={pct} />
          </div>
          <div className="result-msg"><em>{msg}</em>{emEm}</div>
          <div className="result-actions">
            <button className="btn btn-primary" onClick={onRetry}>もう一度</button>
            {wrong.length > 0 &&
            <button className="btn btn-accent" onClick={() => onReviewMistakes(wrong.map((a) => a.word))}>
                間違えた {wrong.length} 語を復習
              </button>
            }
            <button className="btn btn-ghost" onClick={onChangeDiff}>難易度を変える</button>
            <button className="btn btn-ghost" onClick={onHome}>ホーム</button>
          </div>
        </div>
      </div>

      <div className="result-tab-row">
        <button className={`result-tab ${tab === 'review' ? 'active' : ''}`} onClick={() => setTab('review')}>
          復習一覧 <span className="tab-count">{total}</span>
        </button>
        <button className={`result-tab ${tab === 'wrong' ? 'active' : ''}`} onClick={() => setTab('wrong')}>
          間違いだけ <span className="tab-count">{wrong.length}</span>
        </button>
        <button className={`result-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          履歴 <span className="tab-count">{history.length}</span>
        </button>
      </div>

      {tab === 'review' && <ReviewList rows={answers} savedSet={savedSet} toggleSaved={toggleSaved} />}
      {tab === 'wrong' && (
      wrong.length === 0 ?
      <div className="empty-state">間違いはありません 🎉</div> :
      <ReviewList rows={wrong} savedSet={savedSet} toggleSaved={toggleSaved} />)
      }
      {tab === 'history' && <HistoryGrid history={history} />}
    </div>);

}

function ReviewList({ rows, savedSet, toggleSaved }) {
  if (!rows.length) return <div className="empty-state">まだ結果がありません</div>;
  return (
    <div className="review-list">
      {rows.map((a, i) =>
      <div key={i} className="review-row">
          <div className={`review-marker ${a.isCorrect ? 'ok' : 'bad'}`}>
            {a.isCorrect ? '✓' : '✕'}
          </div>
          <div className="review-word">
            <span className="w">{a.word}</span>
            <span className="m">{a.correct}</span>
          </div>
          <div className="review-answers">
            {!a.isCorrect && <span className="yours">{a.selected}</span>}
            {a.isCorrect && <span className="right">正解</span>}
          </div>
          <button
          className="nav-pill"
          style={{ padding: '4px 8px', color: savedSet.has(a.word) ? 'var(--accent)' : 'var(--ink-mute)' }}
          onClick={() => toggleSaved(a.word)}
          title={savedSet.has(a.word) ? '保存解除' : '保存'}>
          
            {savedSet.has(a.word) ? '★' : '☆'}
          </button>
        </div>
      )}
    </div>);

}

function HistoryGrid({ history }) {
  if (!history.length) return <div className="empty-state">プレイ履歴はまだありません</div>;
  return (
    <div className="history-grid">
      {history.slice(0, 12).map((h, i) => {
        const date = new Date(h.ts);
        const m = date.getMonth() + 1,d = date.getDate();
        return (
          <div key={i} className="history-card">
            <div className="h-pct">{h.pct}<span className="small">%</span></div>
            <div className="h-meta">
              <span className={`diff-pill ${h.difficulty}`} style={{ padding: '2px 7px', fontSize: 10 }}>
                {DIFFICULTY_LABEL[h.difficulty]}
              </span>
              <span>{m}/{d}</span>
              <span>{h.score}/{h.total}</span>
            </div>
          </div>);

      })}
    </div>);

}

// ── Mistakes Sheet ──────────────────────────────────────────────
function MistakesSheet({ mistakes, onClose, onRemove, onClearAll, onPractice }) {
  const entries = Object.entries(mistakes)
    .map(([word, m]) => ({ word, ...m }))
    .sort((a, b) => (b.count - a.count) || (b.ts - a.ts));

  return (
    <div className="screen-enter" style={{
      position: 'fixed', inset: 0, background: 'color-mix(in oklch, var(--ink) 30%, transparent)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        width: '100%', maxWidth: 720, maxHeight: '85vh',
        padding: '24px 24px 32px', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.35s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12 }}>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, letterSpacing: '-0.02em' }}>
              間違えた単語 <em style={{ color: 'var(--bad)', fontStyle: 'italic' }}>✕</em>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
              {entries.length}語 ・ 正解すると自動で消えます
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {entries.length > 0 && (
              <button className="nav-pill" onClick={() => {
                if (confirm('全て消去しますか？')) onClearAll();
              }} title="全削除">全削除</button>
            )}
            <button className="nav-pill" onClick={onClose}>閉じる</button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            ここには間違えた単語が溜まります<br />
            <span style={{ fontSize: 14, opacity: 0.7 }}>正解できれば自動的にリストから外れます</span>
          </div>
        ) : (
          <>
            <button className="btn btn-accent" onClick={() => onPractice(entries.map(e => e.word))} style={{ marginBottom: 18 }}>
              {entries.length} 語で復習クイズ
            </button>
            <div className="saved-list">
              {entries.map(e => (
                <div key={e.word} className="mistake-row">
                  <div className="mistake-row-main">
                    <div className="mistake-row-head">
                      <span className="word-eng">{e.word}</span>
                      <span className={`diff-pill ${e.difficulty}`} style={{ padding: '2px 7px', fontSize: 10 }}>
                        {DIFFICULTY_LABEL[e.difficulty]}
                      </span>
                      {e.count >= 2 && (
                        <span className="mistake-count" title="間違えた回数">×{e.count}</span>
                      )}
                    </div>
                    <div className="mistake-row-meanings">
                      <span className="mistake-correct">→ {e.correct}</span>
                      <span className="mistake-yours">あなた: <s>{e.selected}</s></span>
                    </div>
                  </div>
                  <button className="unstar" onClick={() => onRemove(e.word)} title="リストから削除"
                    style={{ color: 'var(--ink-mute)', fontSize: 16 }}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Saved Words Modal ───────────────────────────────────────────
function SavedSheet({ savedSet, toggleSaved, onClose, onPractice }) {
  const words = [...savedSet].map(wordById).filter(Boolean);
  return (
    <div className="screen-enter" style={{
      position: 'fixed', inset: 0, background: 'color-mix(in oklch, var(--ink) 30%, transparent)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        width: '100%', maxWidth: 720, maxHeight: '85vh',
        padding: '24px 24px 32px', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.35s cubic-bezier(.2,.8,.2,1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, letterSpacing: '-0.02em' }}>
              保存した単語 <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>★</em>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>
              {words.length}語 保存中
            </div>
          </div>
          <button className="nav-pill" onClick={onClose}>閉じる</button>
        </div>

        {words.length === 0 ?
        <div className="empty-state">
            クイズ中に <span style={{ color: 'var(--accent)' }}>☆</span> を押すと、ここに溜まります
          </div> :

        <>
            <button className="btn btn-accent" onClick={() => onPractice([...savedSet])} style={{ marginBottom: 18 }}>
              保存した {words.length} 語で練習
            </button>
            <div className="saved-list">
              {words.map((w) =>
            <div key={w.word} className="saved-row">
                  <div>
                    <div className="word-eng">{w.word}</div>
                    <div className="word-jp">{w.meaning}</div>
                  </div>
                  <button className="unstar" onClick={() => toggleSaved(w.word)} title="保存解除">★</button>
                </div>
            )}
            </div>
          </>
        }
      </div>
    </div>);

}

// ── History Sheet ───────────────────────────────────────────────
function HistorySheet({ history, onClose }) {
  return (
    <div className="screen-enter" style={{
      position: 'fixed', inset: 0, background: 'color-mix(in oklch, var(--ink) 30%, transparent)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease'
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg)', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        width: '100%', maxWidth: 720, maxHeight: '85vh',
        padding: '24px 24px 32px', overflow: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 0.35s cubic-bezier(.2,.8,.2,1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, letterSpacing: '-0.02em' }}>
            学習履歴
          </div>
          <button className="nav-pill" onClick={onClose}>閉じる</button>
        </div>
        {history.length === 0 ?
        <div className="empty-state">まだプレイ履歴はありません</div> :

        <HistoryGrid history={history} />
        }
      </div>
    </div>);

}

Object.assign(window, {
  DIFFICULTY_LABEL, DIFFICULTY_LABEL_EN,
  buildQuestions, wordById,
  TopNav, StartScreen, DifficultyScreen, QuizScreen, ResultScreen,
  SavedSheet, MistakesSheet, HistorySheet
});