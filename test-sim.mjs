import { io } from 'socket.io-client';

const URL = 'http://localhost:3001';
const N = 4;
const sockets = [];
let roomCode = null;
let hostId = null;

function connect(name) {
  return new Promise((resolve) => {
    const s = io(URL);
    s.on('connect', () => resolve(s));
    s.name = name;
    s.on('room:state', (state) => {
      s.lastState = state;
    });
    sockets.push(s);
  });
}

async function main() {
  const players = await Promise.all(['Alice', 'Bob', 'Carol', 'Dave'].map(connect));
  const [host, ...rest] = players;

  await new Promise((resolve) => {
    host.emit('room:create', { name: 'Alice', photoCount: 1 }, (res) => {
      roomCode = res.code;
      hostId = res.playerId;
      console.log('Room created', roomCode, hostId);
      resolve();
    });
  });

  for (const p of rest) {
    await new Promise((resolve) => {
      p.emit('room:join', { code: roomCode, name: p.name }, (res) => {
        console.log('Joined', p.name, res.ok);
        resolve();
      });
    });
  }

  await new Promise((r) => setTimeout(r, 300));

  host.emit('room:startUpload', { code: roomCode });
  await new Promise((r) => setTimeout(r, 300));

  const fakePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  for (const p of players) {
    p.emit('room:submitPhotos', { code: roomCode, photos: [fakePhoto] });
  }

  await new Promise((r) => setTimeout(r, 800));
  console.log('Phase after uploads:', host.lastState.phase);

  // Now handle 4 rounds; each round, have everyone (except subject) guess the CORRECT subject.
  for (let round = 0; round < 4; round++) {
    await new Promise((r) => setTimeout(r, 500));
    const state = host.lastState;
    if (state.phase !== 'guessing') {
      console.log('Not in guessing phase, state:', state.phase);
      break;
    }
    const subjectId = state.currentRound.subjectPlayerId;
    console.log(`Round ${round}: subject =`, subjectId);

    for (const p of players) {
      const myId = p.id || (await new Promise((resolve) => p.emit('__noop', resolve)));
    }

    for (const p of players) {
      // find own id via socket.id
      if (p.id === subjectId) continue;
      p.emit('room:guess', { code: roomCode, guessedPlayerId: subjectId });
    }

    // wait for reveal + next round
    await new Promise((r) => setTimeout(r, 5000));
    console.log('Phase after guesses:', host.lastState.phase, 'scores:', host.lastState.players.map(pl => pl.name + ':' + pl.score));
  }

  await new Promise((r) => setTimeout(r, 2000));
  console.log('FINAL:', JSON.stringify(host.lastState.players, null, 2));
  process.exit(0);
}

main();
