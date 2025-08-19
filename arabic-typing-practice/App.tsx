
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { SessionStats } from './types';
import { Level, Language, GameStatus } from './types';
import { BANK_TEXT, TRANSLATIONS, LS_KEYS } from './constants';

// --- HELPER FUNCTIONS ---
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
};

const pickRandomText = (level: Level): string => {
  const texts = BANK_TEXT[level] || BANK_TEXT.medium;
  return texts[Math.floor(Math.random() * texts.length)];
};

// --- SVG ICONS ---
const Icon: React.FC<{ path: string; className?: string }> = ({ path, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);
const ICONS = {
  keyboard: "M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM8 17H6v-2h2v2zm0-3H6v-2h2v2zm0-3H6V9h2v2zm4 3h-2v-2h2v2zm0-3h-2V9h2v2zm0-3h-2V6h2v2zm4 6h-2v-2h2v2zm0-3h-2v-2h2v2zm0-3h-2V9h2v2zm4 3h-2v-2h2v2zm0-3h-2V9h2v2z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  level: "M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",
  stopwatch: "M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z",
  language: "M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.53 1.73 3.02 3 4.29l-3.47 3.34L6.25 18 9 15.25l2.75 2.75.75-.75zM11 6c-1.11 0-2-.9-2-2s.9-2 2-2c.74 0 1.38.41 1.73 1H11v1h2.55c-.03.17-.05.33-.05.5 0 .83.34 1.58.89 2.12C13.7 7.21 12.43 6 11 6z",
  moon: "M9.5 2c-1.82 0-3.53.5-5 1.35 2.99 1.73 5 4.95 5 8.65s-2.01 6.92-5 8.65c1.47.85 3.18 1.35 5 1.35 5.52 0 10-4.48 10-10S15.02 2 9.5 2z",
  sun: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM12 9c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zM3.55 19.09l1.41 1.41L6.38 19.09l-1.41-1.41L3.55 19.09zM3.55 6.36l1.41-1.41L6.38 4.95 4.97 6.36 3.55 6.36zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM20.45 19.09l-1.41 1.41L17.62 19.09l1.41-1.41 1.41 1.41zM17.62 6.36l1.41-1.41L20.45 4.95l-1.41 1.41-1.41-1.41z",
  play: "M8 5v14l11-7z",
  shuffle: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  reset: "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z",
  stats: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z",
  award: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-3.5-2 6.5-5.5 2.5 4L11 17z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  hourglass: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  lightning: "M7 2v11h3v9l7-12h-4l4-8z",
  numbers: "M4 18h3V5H4v13zM8 18h3V5H8v13zm4 0h3V5h-3v13zM16 5v13h3V5h-3z"
};

// --- UI COMPONENTS ---

const Header: React.FC<{
  lang: Language;
  t: any;
  playerName: string;
  setPlayerName: (name: string) => void;
  level: Level;
  setLevel: (level: Level) => void;
  duration: number;
  setDuration: (duration: number) => void;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isGameRunning: boolean;
}> = ({ lang, t, playerName, setPlayerName, level, setLevel, duration, setDuration, setLanguage, isDarkMode, toggleDarkMode, isGameRunning }) => {
  const isRTL = lang === Language.Arabic;
  
  const controlGroupClasses = "flex items-center bg-white dark:bg-slate-700/50 rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700";
  const labelClasses = "p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
  const selectClasses = "w-full bg-transparent p-2 outline-none text-slate-700 dark:text-slate-200";

  return (
    <header dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-wrap items-center justify-between gap-y-4 gap-x-6 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Icon path={ICONS.keyboard} className="w-8 h-8 text-indigo-500" />
          {t.title}
        </h1>
        <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button onClick={toggleDarkMode} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <Icon path={isDarkMode ? ICONS.sun : ICONS.moon} />
            <span className="hidden sm:inline">{isDarkMode ? t.light : t.dark}</span>
          </button>
        </div>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${isRTL ? 'lg:[direction:rtl]' : ''}`}>
        <div className={controlGroupClasses}>
          <span className={labelClasses}><Icon path={ICONS.user} /></span>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={t.playerPlaceholder}
            className={`${selectClasses} placeholder-slate-400 dark:placeholder-slate-500`}
            disabled={isGameRunning}
          />
        </div>
        <div className={controlGroupClasses}>
          <span className={labelClasses}><Icon path={ICONS.level} /></span>
          <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className={selectClasses} disabled={isGameRunning}>
            <option value={Level.Letters}>{t.level_letters}</option>
            <option value={Level.Easy}>{t.level_easy}</option>
            <option value={Level.Medium}>{t.level_medium}</option>
            <option value={Level.Hard}>{t.level_hard}</option>
          </select>
        </div>
        <div className={controlGroupClasses}>
          <span className={labelClasses}><Icon path={ICONS.stopwatch} /></span>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={selectClasses} disabled={isGameRunning}>
            <option value={60}>{t.dur_60}</option>
            <option value={120}>{t.dur_120}</option>
            <option value={180}>{t.dur_180}</option>
          </select>
        </div>
        <div className={controlGroupClasses}>
          <span className={labelClasses}><Icon path={ICONS.language} /></span>
          <select value={lang} onChange={(e) => setLanguage(e.target.value as Language)} className={selectClasses} disabled={isGameRunning}>
            <option value={Language.Indonesian}>Indonesia</option>
            <option value={Language.English}>English</option>
            <option value={Language.Arabic}>عربي</option>
          </select>
        </div>
      </div>
    </header>
  );
};

const TargetTextDisplay: React.FC<{ textHtml: string }> = ({ textHtml }) => (
  <div
    className="font-amiri text-4xl lg:text-5xl leading-loose text-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-inner select-none mb-4"
    dir="rtl"
    dangerouslySetInnerHTML={{ __html: textHtml }}
  />
);

const TypingInput: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}> = ({ value, onValueChange, placeholder, disabled, inputRef }) => (
  <textarea
    ref={inputRef}
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    rows={3}
    className="w-full font-amiri text-3xl text-center p-4 bg-transparent dark:text-slate-200 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
    dir="rtl"
    autoCapitalize="off"
    autoCorrect="off"
    autoComplete="off"
    spellCheck="false"
  />
);

const StatsDisplay: React.FC<{
  lang: Language;
  t: any;
  timeLeft: number;
  accuracy: number;
  cpm: number;
  wordsCorrect: number;
}> = ({ lang, t, timeLeft, accuracy, cpm, wordsCorrect }) => {
  const isRTL = lang === Language.Arabic;

  const StatCard: React.FC<{ icon: string; value: string | number; label: string; colorClass: string; iconPath: string; }> = ({ icon, value, label, colorClass, iconPath }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon path={iconPath} className="w-6 h-6 text-white"/>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
      <StatCard icon="hourglass" value={`${timeLeft}s`} label={t.timeLeft} colorClass="bg-red-500" iconPath={ICONS.hourglass}/>
      <StatCard icon="check" value={`${accuracy}%`} label={t.accuracy} colorClass="bg-green-500" iconPath={ICONS.check}/>
      <StatCard icon="lightning" value={cpm} label={t.cpm} colorClass="bg-yellow-500" iconPath={ICONS.lightning}/>
      <StatCard icon="numbers" value={wordsCorrect} label={t.correctWords} colorClass="bg-blue-500" iconPath={ICONS.numbers}/>
    </div>
  );
};

const ActionButtons: React.FC<{
  t: any;
  status: GameStatus;
  onStart: () => void;
  onNext: () => void;
  onReset: () => void;
  onShowStats: () => void;
}> = ({ t, status, onStart, onNext, onReset, onShowStats }) => {
  const btnBase = "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900";
  const btnPrimary = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;
  const btnSecondary = `${btnBase} bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-500`;
  const btnDanger = `${btnBase} bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 focus:ring-red-500`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 my-6">
      <button onClick={onStart} className={`${btnBase} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300 dark:disabled:bg-green-800 disabled:cursor-not-allowed`} disabled={status === GameStatus.Running}>
        <Icon path={ICONS.play} /> {t.start}
      </button>
      <button onClick={onNext} className={btnPrimary}>
        <Icon path={ICONS.shuffle} /> {t.next}
      </button>
      <button onClick={onReset} className={btnDanger}>
        <Icon path={ICONS.reset} /> {t.reset}
      </button>
      <button onClick={onShowStats} className={btnSecondary}>
        <Icon path={ICONS.stats} /> {t.stats}
      </button>
    </div>
  );
};

const Leaderboard: React.FC<{ t: any; entries: SessionStats[] }> = ({ t, entries }) => (
  <div className="mt-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold flex items-center gap-3">
        <Icon path={ICONS.award} className="w-6 h-6 text-yellow-500" />
        {t.leaderboardTitle}
      </h2>
    </div>
    {entries.length === 0 ? (
      <p className="text-center text-slate-500 dark:text-slate-400 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">{t.leaderboardMuted}</p>
    ) : (
      <ol className="space-y-3">
        {entries.map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          return (
            <li key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{medal}</span>
                <div>
                  <p className="font-bold text-lg">{entry.name}</p>
                  <p className="text-sm text-indigo-500 dark:text-indigo-400 font-semibold">{entry.score} {t.lblScore.replace(':', '')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                <span><b>{entry.acc}%</b> {t.accuracy}</span>
                <span><b>{entry.cpm}</b> {t.cpm}</span>
                <span><b>{entry.words}</b> {t.correctWords}</span>
                <span className="capitalize"><b>{entry.level}</b></span>
              </div>
            </li>
          );
        })}
      </ol>
    )}
  </div>
);

const StatsModal: React.FC<{ t: any; lang: Language; stats: SessionStats | null; isOpen: boolean; onClose: () => void }> = ({ t, lang, stats, isOpen, onClose }) => {
  if (!isOpen || !stats) return null;

  const isRTL = lang === Language.Arabic;

  const StatPill: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-sm">
      <span className="font-semibold">{label}</span> {value}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Icon path={ICONS.stats} className="w-6 h-6 text-indigo-500" />
            {t.modalTitle}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon path={ICONS.close} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6 text-slate-600 dark:text-slate-300">
            <div><span className="font-semibold">{t.lblPlayer}</span> {stats.name}</div>
            <div className="capitalize"><span className="font-semibold">{t.lblLevel}</span> {stats.level}</div>
            <div><span className="font-semibold">{t.lblDuration}</span> {stats.duration}s</div>
            <div><span className="font-semibold">{t.lblScore}</span> <b className="text-indigo-500 dark:text-indigo-400 text-lg">{stats.score}</b></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <StatPill label={t.lblWords} value={stats.words} />
            <StatPill label={t.lblAccuracy} value={`${stats.acc}%`} />
            <StatPill label={t.lblKPM} value={stats.kpm} />
            <StatPill label={t.lblCPM} value={stats.cpm} />
          </div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t.lblNote}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-semibold transition">
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  // --- STATE MANAGEMENT ---
  const [language, setLanguage] = useState<Language>(() => getFromStorage(LS_KEYS.LANGUAGE, Language.Indonesian));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getFromStorage(LS_KEYS.DARK_MODE, false));
  const [playerName, setPlayerName] = useState<string>(() => getFromStorage(LS_KEYS.PLAYER_NAME, ''));
  const [level, setLevel] = useState<Level>(Level.Medium);
  const [duration, setDuration] = useState<number>(120);
  
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Idle);
  const [targetText, setTargetText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  
  // Stats tracking
  const [typedCharCount, setTypedCharCount] = useState(0);
  const [totalCorrectChars, setTotalCorrectChars] = useState(0);
  const [totalExpectedChars, setTotalExpectedChars] = useState(0);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<SessionStats[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.id, [language]);

  // --- SIDE EFFECTS ---
  useEffect(() => {
    // Initial data load
    setLeaderboard(getFromStorage(LS_KEYS.LEADERBOARD, []));
    setTargetText(pickRandomText(level));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.Arabic ? 'rtl' : 'ltr';
    saveToStorage(LS_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    saveToStorage(LS_KEYS.DARK_MODE, isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    saveToStorage(LS_KEYS.PLAYER_NAME, playerName);
  }, [playerName]);

  // --- GAME LOGIC ---
  const endSession = useCallback(() => {
    if (gameStatus !== GameStatus.Running) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameStatus(GameStatus.Finished);

    const elapsedMinutes = Math.max(1 / 60, duration / 60);
    const accuracy = totalExpectedChars > 0 ? Math.round((totalCorrectChars / totalExpectedChars) * 100) : 0;
    const cpm = Math.round(typedCharCount / elapsedMinutes);
    const kpm = Math.round(wordsCorrect / elapsedMinutes);
    const score = Math.round(wordsCorrect * 25 + accuracy * 0.5 + Math.min(100, cpm / 3) * 0.5);

    const finalStats: SessionStats = {
      name: playerName.trim() || 'Guest',
      score,
      words: wordsCorrect,
      acc: accuracy,
      kpm,
      cpm,
      duration,
      level,
      date: new Date().toLocaleDateString('id-ID'),
    };
    setSessionStats(finalStats);

    // Update leaderboard
    const currentLeaderboard = getFromStorage<SessionStats[]>(LS_KEYS.LEADERBOARD, []);
    const newLeaderboard = [...currentLeaderboard, finalStats]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setLeaderboard(newLeaderboard);
    saveToStorage(LS_KEYS.LEADERBOARD, newLeaderboard);
    setIsModalOpen(true);
  }, [duration, totalExpectedChars, totalCorrectChars, typedCharCount, wordsCorrect, playerName, level, gameStatus]);

  const resetSession = useCallback((resetTarget = true) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameStatus(GameStatus.Idle);
    setUserInput('');
    setTimeLeft(duration);
    setTypedCharCount(0);
    setTotalCorrectChars(0);
    setTotalExpectedChars(0);
    setWordsCorrect(0);
    if (resetTarget) {
        setTargetText(pickRandomText(level));
    }
  }, [duration, level]);

  const startSession = useCallback(() => {
    resetSession(false);
    setGameStatus(GameStatus.Running);
    inputRef.current?.focus();
  }, [resetSession]);

  const handleNextText = useCallback(() => {
    setUserInput('');
    setTargetText(pickRandomText(level));
    inputRef.current?.focus();
  }, [level]);
  
  // --- SIDE-EFFECTS (GAME) ---

  // Game Timer - starts and stops the interval.
  useEffect(() => {
    if (gameStatus !== GameStatus.Running) {
      return;
    }
    
    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameStatus]);

  // Ends the session when time runs out.
  useEffect(() => {
    if (gameStatus === GameStatus.Running && timeLeft <= 0) {
      endSession();
    }
  }, [timeLeft, gameStatus, endSession]);
  
  const handleInputChange = (value: string) => {
    if (gameStatus !== GameStatus.Running) return;
    setUserInput(value);
    setTypedCharCount(prev => prev + 1);

    if (value === targetText) {
      setWordsCorrect(prev => prev + 1);
      setTotalExpectedChars(prev => prev + targetText.length);
      setTotalCorrectChars(prev => prev + targetText.length);
      handleNextText();
    }
  };

  const getTargetTextHtml = useMemo(() => {
    let html = '';
    for (let i = 0; i < targetText.length; i++) {
        const targetIndex = targetText.length - 1 - i;
        const typedIndex = userInput.length - 1 - i;
        const char = targetText[targetIndex];

        if (typedIndex >= 0) {
            if (userInput[typedIndex] === char) {
                html = `<span class="text-green-500">${char}</span>` + html;
            } else {
                html = `<span class="text-red-500 underline decoration-dotted">${char}</span>` + html;
            }
        } else {
            html = `<span class="text-slate-400 dark:text-slate-500">${char}</span>` + html;
        }
    }
    return html;
  }, [targetText, userInput]);

  const currentAccuracy = useMemo(() => {
    let correctCharsInWord = 0;
    for (let i = 0; i < userInput.length; i++) {
        if (i < targetText.length && targetText[i] === userInput[i]) {
            correctCharsInWord++;
        }
    }
    const expected = totalExpectedChars + userInput.length;
    const correct = totalCorrectChars + correctCharsInWord;
    return expected > 0 ? Math.round((correct / expected) * 100) : 0;
  }, [userInput, targetText, totalExpectedChars, totalCorrectChars]);

  const currentCpm = useMemo(() => {
    const elapsedSeconds = duration - timeLeft;
    if (elapsedSeconds <= 0) return 0;
    const elapsedMinutes = elapsedSeconds / 60;
    return Math.round(typedCharCount / elapsedMinutes);
  }, [duration, timeLeft, typedCharCount]);


  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <Header
          lang={language}
          t={t}
          playerName={playerName}
          setPlayerName={setPlayerName}
          level={level}
          setLevel={(l) => { setLevel(l); setTargetText(pickRandomText(l)); }}
          duration={duration}
          setDuration={(d) => { setDuration(d); if(gameStatus === GameStatus.Idle) setTimeLeft(d);}}
          setLanguage={setLanguage}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isGameRunning={gameStatus === GameStatus.Running}
        />
        <main>
          <TargetTextDisplay textHtml={getTargetTextHtml} />
          <TypingInput
            value={userInput}
            onValueChange={handleInputChange}
            placeholder={t.placeholder}
            disabled={gameStatus !== GameStatus.Running}
            inputRef={inputRef}
          />
          <StatsDisplay
            lang={language}
            t={t}
            timeLeft={timeLeft}
            accuracy={currentAccuracy}
            cpm={currentCpm}
            wordsCorrect={wordsCorrect}
          />
          <ActionButtons
            t={t}
            status={gameStatus}
            onStart={startSession}
            onNext={handleNextText}
            onReset={() => resetSession(true)}
            onShowStats={() => {if(sessionStats) setIsModalOpen(true)}}
          />
          <Leaderboard t={t} entries={leaderboard} />
        </main>
      </div>
      <StatsModal t={t} lang={language} stats={sessionStats} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
