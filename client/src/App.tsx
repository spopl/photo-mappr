import { useEffect, useRef, useState } from 'react';
import { socket } from './socket';
import type { RoomPublicState } from './types';
import Lobby from './screens/Lobby';
import Upload from './screens/Upload';
import Guessing from './screens/Guessing';
import Reveal from './screens/Reveal';
import Finished from './screens/Finished';
import Landing from './screens/Landing';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomPublicState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const joinedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    socket.connect();
    socket.on('connect', () => {
      setConnected(true);
      setMyId(socket.id ?? null);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:state', (state: RoomPublicState) => {
      setRoom(state);
    });

    // Restore from URL if present
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('room');
    if (codeFromUrl) joinedCodeRef.current = codeFromUrl.toUpperCase();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:state');
    };
  }, []);

  function createRoom(name: string, photoCount: number) {
    setError(null);
    socket.emit('room:create', { name, photoCount }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to create room');
        return;
      }
      setMyId(res.playerId);
      const url = new URL(window.location.href);
      url.searchParams.set('room', res.code);
      window.history.replaceState({}, '', url.toString());
    });
  }

  function joinRoom(code: string, name: string) {
    setError(null);
    socket.emit('room:join', { code: code.toUpperCase(), name }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to join room');
        return;
      }
      setMyId(res.playerId);
      const url = new URL(window.location.href);
      url.searchParams.set('room', res.code);
      window.history.replaceState({}, '', url.toString());
    });
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-700 font-semibold">
        Connecting...
      </div>
    );
  }

  if (!room) {
    return (
      <Landing
        prefillCode={joinedCodeRef.current}
        onCreate={createRoom}
        onJoin={joinRoom}
        error={error}
      />
    );
  }

  const me = room.players.find((p) => p.id === myId);
  const isHost = room.hostId === myId;

  switch (room.phase) {
    case 'lobby':
      return <Lobby room={room} isHost={isHost} />;
    case 'uploading':
      return <Upload room={room} me={me} />;
    case 'guessing':
      return <Guessing room={room} myId={myId} />;
    case 'reveal':
      return <Reveal room={room} />;
    case 'finished':
      return <Finished room={room} />;
    default:
      return null;
  }
}
