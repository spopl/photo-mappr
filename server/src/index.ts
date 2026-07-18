import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createRoom,
  getRoom,
  joinRoom,
  setPhotoCount,
  setCategory,
  submitPhotos,
  allPhotosSubmitted,
  canStart,
  startUploading,
  startGuessing,
  submitGuess,
  allGuessed,
  beginReveal,
  stepReveal,
  finishRoundGoNext,
  removePlayer,
  toPublicState,
  deleteRoom,
  config,
} from './rooms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  maxHttpBufferSize: 20 * 1024 * 1024, // allow base64 photo payloads
});

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/api/config', (_req, res) => {
  res.json(config);
});

function broadcastRoom(code: string) {
  const room = getRoom(code);
  if (!room) return;
  for (const id of room.playerOrder) {
    io.to(id).emit('room:state', toPublicState(room, id));
  }
  // also emit to sockets in the room channel (for spectators mid-transition)
  io.to(`room:${code}`).emit('room:state', toPublicState(room));
}

/** Begin the reveal phase. If there's nothing suspenseful to show (0 or 1 items to reveal), resolve instantly. */
function startReveal(code: string, room: import('./types.js').RoomState) {
  beginReveal(room);
  broadcastRoom(code);
  const round = room.currentRound;
  if (round && round.revealOrder.length - round.revealIndex <= 1) {
    stepReveal(room);
    broadcastRoom(code);
  }
}


const socketRoomMap = new Map<string, string>();

io.on('connection', (socket) => {
  socket.on('room:create', ({ name, photoCount, categoryId }, cb) => {
    const room = createRoom(name, socket.id, photoCount || 2, categoryId);
    socket.join(room.code);
    socket.join(`room:${room.code}`);
    socketRoomMap.set(socket.id, room.code);
    cb?.({ ok: true, code: room.code, playerId: socket.id });
    broadcastRoom(room.code);
  });

  socket.on('room:join', ({ code, name }, cb) => {
    const { room, error } = joinRoom(code, socket.id, name);
    if (error || !room) {
      cb?.({ ok: false, error });
      return;
    }
    socket.join(room.code);
    socket.join(`room:${room.code}`);
    socketRoomMap.set(socket.id, room.code);
    cb?.({ ok: true, code: room.code, playerId: socket.id });
    broadcastRoom(room.code);
  });

  socket.on('room:setPhotoCount', ({ code, count }) => {
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    setPhotoCount(room, count);
    broadcastRoom(code);
  });

  socket.on('room:setCategory', ({ code, categoryId }) => {
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    setCategory(room, categoryId);
    broadcastRoom(code);
  });

  socket.on('room:startUpload', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    if (!canStart(room)) return;
    startUploading(room);
    broadcastRoom(code);
  });

  socket.on('room:submitPhotos', ({ code, photos }) => {
    const room = getRoom(code);
    if (!room) return;
    submitPhotos(room, socket.id, photos);
    if (room.phase === 'uploading' && allPhotosSubmitted(room)) {
      startGuessing(room);
      broadcastRoom(code);
      return;
    }
    broadcastRoom(code);
  });

  socket.on('room:guess', ({ code, guessedPlayerId }) => {
    const room = getRoom(code);
    if (!room || room.phase !== 'guessing') return;
    submitGuess(room, socket.id, guessedPlayerId);
    if (allGuessed(room)) {
      startReveal(code, room);
    } else {
      broadcastRoom(code);
    }
  });

  socket.on('room:revealNext', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id || room.phase !== 'reveal') return;
    const round = room.currentRound;
    const isFinishedReveal =
      round && round.revealOrder[round.revealIndex - 1] === round.subjectPlayerId;
    if (!round || isFinishedReveal) return;
    stepReveal(room);
    broadcastRoom(code);
  });

  socket.on('room:nextRound', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id || room.phase !== 'reveal') return;
    const round = room.currentRound;
    const isFinishedReveal =
      round && round.revealOrder[round.revealIndex - 1] === round.subjectPlayerId;
    if (!isFinishedReveal) return;
    finishRoundGoNext(room);
    broadcastRoom(code);
  });

  socket.on('room:leave', ({ code }) => {
    handleLeave(code, socket.id);
  });

  socket.on('disconnect', () => {
    const code = socketRoomMap.get(socket.id);
    if (code) {
      handleLeave(code, socket.id);
      socketRoomMap.delete(socket.id);
    }
  });

  function handleLeave(code: string, playerId: string) {
    const room = getRoom(code);
    if (!room) return;
    removePlayer(room, playerId);
    if (room.playerOrder.length === 0) {
      deleteRoom(code);
      return;
    }
    broadcastRoom(code);
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Photo Mappr server running on port ${PORT}`);
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

