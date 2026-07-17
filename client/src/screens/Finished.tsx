import { useEffect } from 'react';
import type { RoomPublicState } from '../types';
import { bigConfetti } from '../lib/confetti';

interface Props {
  room: RoomPublicState;
}

export default function Finished({ room }: Props) {
  const scoreboard = room.scoreboard || [];

  useEffect(() => {
    bigConfetti();
  }, []);

  function playAgain() {
    // Simple approach: reload to lobby by asking host to re-create isn't wired;
    // for now, just reload the page which will rejoin same room in lobby state
    // once server supports restart. As MVP, we instruct the room to refresh.
    window.location.reload();
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <h1 className="text-3xl font-extrabold text-center mb-6 bg-gradient-to-r from-party-pink via-party-purple to-party-blue bg-clip-text text-transparent">
        Final Scores
      </h1>
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <ul className="flex flex-col gap-2">
          {scoreboard.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center rounded-xl px-3 py-2 bg-brand-50"
            >
              <span>{p.name}</span>
              <span className="font-bold">{p.score} pts</span>
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={playAgain}
        className="w-full bg-gradient-to-r from-party-pink to-party-purple text-white font-bold rounded-xl py-3 shadow active:scale-95 transition"
      >
        Play Again
      </button>
    </div>
  );
}
