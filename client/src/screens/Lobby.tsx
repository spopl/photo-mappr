import type { RoomPublicState } from '../types';
import { socket } from '../socket';
import { getCategory } from '../categories';

interface Props {
  room: RoomPublicState;
  isHost: boolean;
}

export default function Lobby({ room, isHost }: Props) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
  const category = getCategory(room.categoryId);

  function startUpload() {
    socket.emit('room:startUpload', { code: room.code });
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
  }

  const canStart = room.players.filter((p) => p.connected).length >= 4;

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-brand-700 text-center mb-1">Room Lobby</h1>
      <div className="text-center mb-6">
        <div className="text-4xl font-black tracking-widest text-brand-600">{room.code}</div>
        <button onClick={copyLink} className="text-sm text-brand-500 underline mt-1">
          Copy invite link
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-semibold text-brand-700 mb-2">
          Players ({room.players.filter((p) => p.connected).length}/20)
        </h2>
        <ul className="flex flex-col gap-1">
          {room.players.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-1 border-b last:border-0">
              <span>
                {p.name} {p.id === room.hostId && <span className="text-xs text-brand-500">(host)</span>}
              </span>
              <span className={p.connected ? 'text-green-600' : 'text-gray-400'}>
                {p.connected ? '●' : '○'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4 text-center">
        <p className="text-sm text-brand-700">
          Topic: <b>{category.emoji} {category.label}</b>
        </p>
        <p className="text-sm text-brand-700 mt-1">
          Everyone will upload <b>{room.photoCountRequired}</b> photo(s): {category.prompt}
        </p>
      </div>

      {isHost ? (
        <button
          disabled={!canStart}
          onClick={startUpload}
          className="w-full bg-brand-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3"
        >
          {canStart ? 'Start Game — Begin Uploads' : `Need at least 4 players (min 4, max 20)`}
        </button>
      ) : (
        <p className="text-center text-brand-600">Waiting for host to start the game...</p>
      )}
    </div>
  );
}
