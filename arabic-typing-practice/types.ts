
export enum Level {
  Letters = 'letters',
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum Language {
  Indonesian = 'id',
  English = 'en',
  Arabic = 'ar',
}

export enum GameStatus {
  Idle = 'idle',
  Running = 'running',
  Finished = 'finished',
}

export interface SessionStats {
  name: string;
  level: Level;
  duration: number;
  words: number;
  acc: number;
  kpm: number;
  cpm: number;
  score: number;
  date: string;
}

export interface Translations {
  [key: string]: {
    title: string;
    start: string;
    next: string;
    reset: string;
    stats: string;
    leaderboardTitle: string;
    leaderboardMuted: string;
    playerPlaceholder: string;
    level_letters: string;
    level_easy: string;
    level_medium: string;
    level_hard: string;
    dur_60: string;
    dur_120: string;
    dur_180: string;
    modalTitle: string;
    lblPlayer: string;
    lblLevel: string;
    lblDuration: string;
    lblWords: string;
    lblAccuracy: string;
    lblKPM: string;
    lblCPM: string;
    lblScore: string;
    lblNote: string;
    modalClose: string;
    placeholder: string;
    dark: string;
    light: string;
    timeLeft: string;
    accuracy: string;
    cpm: string;
    correctWords: string;
  };
}
