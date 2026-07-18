import { useEffect, useState } from 'react';
import { socket } from '../socket';
import type { RoomPublicState } from '../types';
import PhotoCarousel from '../components/PhotoCarousel';

interface Props {
  room: RoomPublicState;
  myId: string | null;
}

export default function Guessing({ room, myId }: Props) {
  const round = room.currentRound!;
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setSelected(null);
    setLocked(round.lockedGuesserIds.includes(myId || ''));
  }, [round.subjectPlayerId]);

  const isSubject = myId === round.subjectPlayerId;
  const iAlreadyLocked = locked || round.lockedGuesserIds.includes(myId || '');

  function lockIn() {
    if (!selected) return;
    socket.emit('room:guess', { code: room.code, guessedPlayerId: selected });
    setLocked(true);
  }

  const others = room.players.filter((p) => p.connected && p.id !== round.subjectPlayerId);

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-sm text-brand-500">Round</div>
        <div className="text-2xl font-extrabold text-brand-700">Whose photo is this?</div>
      </div>

      <PhotoCarousel photos={round.photos} />

      {isSubject ? (
        <div className="bg-white rounded-2xl shadow p-4 text-center text-brand-700 font-medium">
          That's you! Sit tight while others guess 👀
        </div>
      ) : iAlreadyLocked ? (
        <div className="bg-white rounded-2xl shadow p-4 text-center text-brand-700 font-medium">
          ✅ Guess locked in! Waiting for others...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="grid grid-cols-2 gap-2 mb-3 max-h-64 overflow-y-auto">
            {round.candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`rounded-lg py-2 px-2 font-medium border-2 ${
                  selected === c.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-brand-200 text-brand-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <button
            disabled={!selected}
            onClick={lockIn}
            className="w-full bg-brand-600 disabled:opacity-40 text-white font-semibold rounded-xl py-3"
          >
            Select
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4 mt-4">
        <h2 className="font-semibold text-brand-700 mb-2">Guess status</h2>
        <ul>
          {others.map((p) => (
            <li key={p.id} className="flex justify-between py-1 border-b last:border-0">
              <span>{p.name}</span>
              <span>{round.lockedGuesserIds.includes(p.id) ? '✅' : '⏳'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

