import confetti from 'canvas-confetti';

const PARTY_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];

export function burstConfetti() {
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors: PARTY_COLORS,
    scalar: 1,
  });
}

export function bigConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0 },
      colors: PARTY_COLORS,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1 },
      colors: PARTY_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
