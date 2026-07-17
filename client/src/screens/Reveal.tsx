import { useEffect, useRef, useState } from 'react';
import type { RoomPublicState } from '../types';
import PhotoCarousel from '../components/PhotoCarousel';
import { burstConfetti } from '../lib/confetti';

interface Props {
  room: RoomPublicState;
}

export default function Reveal({ room }: Props) {
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
        {reveal.finished

          ? '🎉 Answer revealed! Next round starting...'
          : `Revealing next candidate... (${nextToReveal} left)`}
      </div>
    </div>
  );
}
