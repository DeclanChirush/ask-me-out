import { motion } from 'framer-motion';

interface Props {
  onClick: () => void;
  label?: string;
  big?: boolean;
  glow?: boolean;
}

export default function YesButton({ onClick, label = 'YES 💖', big = false, glow = false }: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      animate={{ scale: [1, 1.08, 1, 1.05, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      className="btn btn-primary font-black"
      style={{
        fontSize: big ? 26 : 22,
        padding: big ? '20px 64px' : '18px 56px',
        borderRadius: 999,
        letterSpacing: '.04em',
        boxShadow: glow
          ? '0 0 0 6px rgba(236,72,153,.18), 0 0 36px rgba(236,72,153,.7)'
          : '0 10px 24px -10px rgba(236,72,153,.7)',
      }}
    >
      {label}
    </motion.button>
  );
}
