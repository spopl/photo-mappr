import { customAlphabet } from 'nanoid';
import type { RoomState, Player, RoundState, RoomPublicState } from './types.js';

const genCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

const rooms = new Map<string, RoomState>();

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 20;
const GUESS_TIMER_SECONDS = 20;
const REVEAL_STEP_SECONDS = 10;
const MAX_WRONG_REVEALS = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createRoom(hostName: string, hostId: string, photoCountRequired: number): RoomState {
  let code = genCode();
  while (rooms.has(code)) code = genCode();

  const room: RoomState = {
    code,
    hostId,
    photoCountRequired,
    phase: 'lobby',
    players: {
      [hostId]: { id: hostId, name: hostName, connected: true, photos: [] },
    },
    playerOrder: [hostId],
    scores: { [hostId]: 0 },
    roundQueue: [],
    currentRound: null,
    completedRounds: [],
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomState | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteRoom(code: string) {
  rooms.delete(code);
}

export function joinRoom(code: string, playerId: string, name: string): { room?: RoomState; error?: string } {
  const room = getRoom(code);
  if (!room) return { error: 'Room not found' };
  if (room.phase !== 'lobby') return { error: 'Game already started' };
  if (room.playerOrder.length >= MAX_PLAYERS && !room.players[playerId]) {
    return { error: 'Room is full' };
  }
  if (!room.players[playerId]) {
    room.players[playerId] = { id: playerId, name, connected: true, photos: [] };
    room.playerOrder.push(playerId);
    room.scores[playerId] = 0;
  } else {
    room.players[playerId].connected = true;
    room.players[playerId].name = name;
  }
  return { room };
}

export function setPhotoCount(room: RoomState, count: number) {
  if (room.phase === 'lobby') {
    room.photoCountRequired = Math.min(3, Math.max(1, count));
  }
}

export function submitPhotos(room: RoomState, playerId: string, photos: string[]) {
  const player = room.players[playerId];
  if (!player) return;
  player.photos = photos.slice(0, room.photoCountRequired);
}

export function allPhotosSubmitted(room: RoomState): boolean {
  return room.playerOrder.every(
    (id) => room.players[id].connected && room.players[id].photos.length >= room.photoCountRequired
  );
}

export function canStart(room: RoomState): boolean {
  return room.playerOrder.filter((id) => room.players[id].connected).length >= MIN_PLAYERS;
}

export function startUploading(room: RoomState) {
  room.phase = 'uploading';
}

export function startGuessing(room: RoomState) {
  room.phase = 'guessing';
  room.roundQueue = shuffle(room.playerOrder.filter((id) => room.players[id].connected));
  room.completedRounds = [];
  advanceRound(room);
}

function advanceRound(room: RoomState) {
  const nextId = room.roundQueue.shift();
  if (!nextId) {
    room.phase = 'finished';
    room.currentRound = null;
    return;
  }
  room.currentRound = {
    subjectPlayerId: nextId,
    photos: room.players[nextId].photos,
    guesses: {},
    lockedGuessers: [],
    revealOrder: [],
    revealIndex: 0,
    revealStartedAt: null,
    candidatesWithVotes: [],
  };
  room.phase = 'guessing';
}

export function submitGuess(room: RoomState, guesserId: string, guessedPlayerId: string) {
  const round = room.currentRound;
  if (!round) return;
  if (guesserId === round.subjectPlayerId) return;
  if (round.lockedGuessers.includes(guesserId)) return;
  round.guesses[guesserId] = guessedPlayerId;
  round.lockedGuessers.push(guesserId);
}

export function allGuessed(room: RoomState): boolean {
  const round = room.currentRound;
  if (!round) return false;
  const eligible = room.playerOrder.filter(
    (id) => room.players[id].connected && id !== round.subjectPlayerId
  );
  return eligible.every((id) => round.lockedGuessers.includes(id));
}

/** Transition current round from guessing -> reveal, building the elimination order */
export function beginReveal(room: RoomState) {
  const round = room.currentRound;
  if (!round) return;
  room.phase = 'reveal';

  const voteCounts = new Map<string, number>();
  for (const guessedId of Object.values(round.guesses)) {
    voteCounts.set(guessedId, (voteCounts.get(guessedId) || 0) + 1);
  }
  const candidatesWithVotes = shuffle([...voteCounts.keys()].filter((id) => id !== round.subjectPlayerId));
  round.candidatesWithVotes = candidatesWithVotes;

  const wrongCount = Math.min(MAX_WRONG_REVEALS, candidatesWithVotes.length);
  const chosenWrong = candidatesWithVotes.slice(0, wrongCount);

  // Randomly decide insertion point for the correct answer among the wrongs (could be position 0 = shown first)
  const insertAt = Math.floor(Math.random() * (chosenWrong.length + 1));
  const order = [...chosenWrong];
  order.splice(insertAt, 0, round.subjectPlayerId);

  // Anything scheduled after the correct answer's position would never actually be shown
  // (the round ends as soon as the correct answer appears), so trim it off.
  const subjIdx = order.indexOf(round.subjectPlayerId);
  round.revealOrder = order.slice(0, subjIdx + 1);
  round.revealIndex = 0;
  round.revealStartedAt = Date.now();
}

export function isRevealDone(room: RoomState): boolean {
  const round = room.currentRound;
  if (!round) return true;
  return round.revealOrder[round.revealIndex - 1] === round.subjectPlayerId;
}

/**
 * Advance the reveal by one step. Returns true once the correct answer has been revealed
 * (round complete). If only 2 candidates remain unrevealed (1 wrong + the correct answer),
 * or only 1 remains (the correct answer, nobody guessed wrong), both are revealed together
 * since the outcome is no longer suspenseful at that point.
 */
export function stepReveal(room: RoomState): boolean {
  const round = room.currentRound;
  if (!round) return true;
  const remaining = round.revealOrder.length - round.revealIndex;
  const revealCount = remaining <= 2 ? remaining : 1;

  let hitCorrect = false;
  for (let i = 0; i < revealCount; i++) {
    const id = round.revealOrder[round.revealIndex];
    round.revealIndex++;
    if (id === round.subjectPlayerId) hitCorrect = true;
  }
  round.revealStartedAt = Date.now();

  if (hitCorrect) {
    for (const [guesserId, guessedId] of Object.entries(round.guesses)) {
      if (guessedId === round.subjectPlayerId) {
        room.scores[guesserId] = (room.scores[guesserId] || 0) + 1;
      }
    }
    room.completedRounds.push(round.subjectPlayerId);
    return true;
  }
  return false;
}

export function finishRoundGoNext(room: RoomState) {
  advanceRound(room);
}

export function removePlayer(room: RoomState, playerId: string) {
  const player = room.players[playerId];
  if (!player) return;
  player.connected = false;
  player.photos = [];
  room.playerOrder = room.playerOrder.filter((id) => id !== playerId);
  delete room.scores[playerId];

  if (room.hostId === playerId) {
    const next = room.playerOrder.find((id) => room.players[id].connected);
    if (next) room.hostId = next;
  }

  if (room.currentRound?.subjectPlayerId === playerId) {
    // Subject left mid-round; skip to next
    if (room.phase !== 'finished') advanceRound(room);
  }
  // Remove any pending queue entries / guesses referencing them
  room.roundQueue = room.roundQueue.filter((id) => id !== playerId);
  if (room.currentRound) {
    delete room.currentRound.guesses[playerId];
    room.currentRound.lockedGuessers = room.currentRound.lockedGuessers.filter((id) => id !== playerId);
  }
}

export function toPublicState(room: RoomState, viewerId?: string): RoomPublicState {
  const players = room.playerOrder.map((id) => ({
    id,
    name: room.players[id].name,
    connected: room.players[id].connected,
    photoCount: room.players[id].photos.length,
    score: room.scores[id] || 0,
  }));

  let currentRound: RoomPublicState['currentRound'] = null;
  const round = room.currentRound;
  if (round) {
    const subject = room.players[round.subjectPlayerId];
    const candidates = room.playerOrder
      .filter((id) => id !== round.subjectPlayerId && room.players[id].connected)
      .map((id) => ({ id, name: room.players[id].name }));

    const elapsed = round.revealStartedAt ? (Date.now() - round.revealStartedAt) / 1000 : 0;
    const timerSeconds =
      room.phase === 'guessing'
        ? Math.max(0, GUESS_TIMER_SECONDS)
        : Math.max(0, REVEAL_STEP_SECONDS);

    let reveal:
      | {
          candidatesWithVotes: { id: string; name: string; voterNames: string[] }[];
          revealed: { id: string; name: string; isCorrect: boolean; voterNames: string[] }[];
          finished: boolean;
        }
      | undefined;

    if (room.phase === 'reveal') {
      const nameOf = (id: string) => room.players[id]?.name || '???';
      const voterNamesFor = (id: string) =>
        Object.entries(round.guesses)
          .filter(([, guessed]) => guessed === id)
          .map(([guesser]) => nameOf(guesser));

      reveal = {
        candidatesWithVotes: round.candidatesWithVotes.map((id) => ({
          id,
          name: nameOf(id),
          voterNames: voterNamesFor(id),
        })),
        revealed: round.revealOrder.slice(0, round.revealIndex).map((id) => ({
          id,
          name: nameOf(id),
          isCorrect: id === round.subjectPlayerId,
          voterNames: voterNamesFor(id),
        })),
        finished: round.revealOrder[round.revealIndex - 1] === round.subjectPlayerId,
      };
    }

    currentRound = {
      subjectPlayerId: round.subjectPlayerId,
      subjectName: subject.name,
      photos: round.photos,
      candidates,
      timerSeconds,
      lockedGuesserIds: round.lockedGuessers,
      reveal,
    };
  }

  const state: RoomPublicState = {
    code: room.code,
    hostId: room.hostId,
    photoCountRequired: room.photoCountRequired,
    phase: room.phase,
    players,
    currentRound,
  };

  if (room.phase === 'finished') {
    state.scoreboard = players
      .map((p) => ({ id: p.id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  return state;
}

export const config = {
  MIN_PLAYERS,
  MAX_PLAYERS,
  GUESS_TIMER_SECONDS,
  REVEAL_STEP_SECONDS,
  MAX_WRONG_REVEALS,
};
