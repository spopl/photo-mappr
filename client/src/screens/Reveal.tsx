import { useEffect, useRef, useState } from 'react';
import type { RoomPublicState } from '../types';
import PhotoCarousel from '../components/PhotoCarousel';
import { burstConfetti } from '../lib/confetti';
import { socket } from '../socket';

interface Props {
  room: RoomPublicState;
  isHost: boolean;
}

export default function Reveal({ room, isHost }: Props) {
  const round = room.currentRound!;
  const reveal = round.reveal;
  const [timeLeft, setTimeLeft] = useState(round.timerSeconds);
  const celebratedRef = useRef(false);

  useEffect(() => {
    setTimeLeft(round.timerSeconds);
  }, [reveal?.revealed.length, round.subjectPlayerId]);

  useEffect(() => {
    if (reveal?.finished) return;
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [reveal?.revealed.length, round.subjectPlayerId, reveal?.finished]);

  useEffect(() => {
    celebratedRef.current = false;
  }, [round.subjectPlayerId]);

  useEffect(() => {
    if (reveal?.finished && !celebratedRef.current) {
      celebratedRef.current = true;
      burstConfetti();
    }
  }, [reveal?.finished]);

  if (!reveal) return null;

  const nextToReveal = reveal.candidatesWithVotes.length - reveal.revealed.length;
  const correctVoters = reveal.finished
    ? Object.values(reveal.revealed).find((r) => r.isCorrect)?.voterNames || []
    : [];

  function nextRound() {
    socket.emit('room:nextRound', { code: room.code });
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-sm text-party-purple font-semibold">Reveal</div>
        <div className="text-2xl font-extrabold text-brand-700">Whose baby photo is this?</div>
        {!reveal.finished && (
          <div className="mt-1 text-party-orange font-bold">⏱ Next reveal in {timeLeft}s</div>
        )}
      </div>

      <PhotoCarousel photos={round.photos} />

      {reveal.finished && (
        <div className="bg-gradient-to-r from-party-green to-brand-500 text-white rounded-2xl shadow p-4 mb-4 text-center">
          <div className="text-lg font-extrabold">🎉 It's {round.subjectName}!</div>
          {correctVoters.length > 0 ? (
            <div className="text-sm mt-1 opacity-90">
              Correctly guessed by: {correctVoters.join(', ')}
            </div>
          ) : (
            <div className="text-sm mt-1 opacity-90">Nobody guessed it! 😮</div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="font-semibold text-brand-700 mb-2 text-center">Candidates</h2>
        <ul className="flex flex-col gap-2">
          {reveal.candidatesWithVotes.map((c) => {
            const revealedItem = reveal.revealed.find((r) => r.id === c.id);
            return (
              <li
                key={c.id}
                className={`rounded-xl p-3 border-2 flex flex-col transition ${
                  revealedItem
                    ? revealedItem.isCorrect
                      ? 'bg-green-100 border-party-green'
                      : 'bg-rose-100 border-party-red'
                    : 'border-brand-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{c.name}</span>
                  {revealedItem && (
                    <span className="font-bold">{revealedItem.isCorrect ? '🎉 Correct!' : '❌'}</span>
                  )}
                </div>
                {c.voterNames.length > 0 && (
                  <span className="text-xs text-brand-500 mt-1">
                    Picked by: {c.voterNames.join(', ')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="text-center text-brand-600 font-medium">
        {!reveal.finished && `Revealing next candidate... (${nextToReveal} left)`}
      </div>

      {reveal.finished && (
        <div className="mt-2">
          {isHost ? (
            <button
              onClick={nextRound}
              className="w-full bg-gradient-to-r from-party-pink to-party-purple text-white font-bold rounded-xl py-3 shadow active:scale-95 transition"
            >
              Next Round ▶
            </button>
          ) : (
            <p className="text-center text-brand-500">Waiting for host to start the next round...</p>
          )}
        </div>
      )}
    </div>
  );
}
