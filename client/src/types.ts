export type GamePhase = 'lobby' | 'uploading' | 'guessing' | 'reveal' | 'finished';

export interface PlayerPublic {
  id: string;
  name: string;
  connected: boolean;
  photoCount: number;
  score: number;
}

export interface RevealCandidate {
  id: string;
  name: string;
  voterNames: string[];
}

export interface RevealedItem extends RevealCandidate {
  isCorrect: boolean;
}

export interface CurrentRound {
  subjectPlayerId: string;
  subjectName: string;
  photos: string[];
  candidates: { id: string; name: string }[];
  timerSeconds: number;
  lockedGuesserIds: string[];
  reveal?: {
    candidatesWithVotes: RevealCandidate[];
    revealed: RevealedItem[];
    finished: boolean;
  };
}

export interface RoomPublicState {
  code: string;
  hostId: string;
  photoCountRequired: number;
  phase: GamePhase;
  players: PlayerPublic[];
  currentRound: CurrentRound | null;
  scoreboard?: { id: string; name: string; score: number }[];
}
