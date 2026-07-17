export type GamePhase = 'lobby' | 'uploading' | 'guessing' | 'reveal' | 'finished';

export interface PlayerPublic {
  id: string;
  name: string;
  connected: boolean;
  photoCount: number;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  connected: boolean;
  photos: string[]; // base64 data urls
}

export interface RoundCandidate {
  playerId: string;
  name: string;
}

export interface RoundState {
  subjectPlayerId: string;
  photos: string[];
  guesses: Record<string, string>; // guesserId -> guessedPlayerId
  lockedGuessers: string[];
  revealOrder: string[]; // playerIds in reveal order, last one is always the correct subject
  revealIndex: number; // how many have been revealed so far
  revealStartedAt: number | null;
  candidatesWithVotes: string[];
}

export interface RoomState {
  code: string;
  hostId: string;
  photoCountRequired: number;
  categoryId: string;
  phase: GamePhase;
  players: Record<string, Player>;
  playerOrder: string[];
  scores: Record<string, number>;
  roundQueue: string[]; // playerIds still to be shown, in random order
  currentRound: RoundState | null;
  completedRounds: string[];
  createdAt: number;
}

export interface RoomPublicState {
  code: string;
  hostId: string;
  photoCountRequired: number;
  categoryId: string;
  phase: GamePhase;
  players: PlayerPublic[];
  currentRound: {
    subjectPlayerId: string;
    subjectName: string;
    photos: string[];
    candidates: { id: string; name: string }[];
    timerSeconds: number;
    lockedGuesserIds: string[];
    reveal?: {
      candidatesWithVotes: { id: string; name: string; voterNames: string[] }[];
      revealed: { id: string; name: string; isCorrect: boolean; voterNames: string[] }[];
      finished: boolean;
    };
  } | null;
  scoreboard?: { id: string; name: string; score: number }[];
}
