import { useEffect, useState } from 'react';
import QR from 'qrcode';

interface Props {
  value: string;
  /** Pixel size of the rendered QR (default 180) */
  size?: number;
}

/**
 * Renders a pink-tinted QR code as a data-URL <img>.
 * Tiny wrapper around the `qrcode` lib so the call site stays declarative.
 */
export default function QRCode({ value, size = 180 }: Props) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    QR.toDataURL(value, {
      width: size * 2, // 2× for crisp on retina
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#be185d',  // pink-700 — matches the app's ink
        light: '#fffaf2', // cream paper background
      },
    })
      .then((url) => { if (!cancelled) setSrc(url); })
      .catch(() => { if (!cancelled) setSrc(''); });
    return () => { cancelled = true; };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className="grid place-items-center text-pink-300 text-xs"
        style={{ width: size, height: size, background: '#fffaf2', borderRadius: 12 }}
      >
        …
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="QR code"
      width={size}
      height={size}
      style={{
        display: 'block',
        borderRadius: 12,
        border: '1.5px solid #fbcfe8',
        background: '#fffaf2',
        padding: 6,
        boxShadow: '0 8px 20px -10px rgba(190,24,93,.35)',
      }}
    />
  );
}
