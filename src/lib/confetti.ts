import confetti from 'canvas-confetti';

export function burstConfetti() {
  const colors = ['#ec4899', '#f472b6', '#fbcfe8', '#fcd34d', '#a78bfa', '#34d399'];
  const fire = (origin: { x: number; y: number }, particleCount: number) => {
    confetti({
      particleCount,
      spread: 70,
      startVelocity: 45,
      origin,
      colors,
      scalar: 0.9,
    });
  };
  fire({ x: 0.5, y: 0.5 }, 80);
  setTimeout(() => fire({ x: 0.2, y: 0.6 }, 50), 180);
  setTimeout(() => fire({ x: 0.8, y: 0.6 }, 50), 320);
}
