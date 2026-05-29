import { useEffect } from 'react';
import { burstConfetti } from '../lib/confetti';

interface Props {
  fire?: boolean;
  repeatMs?: number;
}

export default function ConfettiCanvas({ fire = true, repeatMs = 0 }: Props) {
  useEffect(() => {
    if (!fire) return;
    burstConfetti();
    if (!repeatMs) return;
    const t = setInterval(burstConfetti, repeatMs);
    return () => clearInterval(t);
  }, [fire, repeatMs]);

  return null;
}
