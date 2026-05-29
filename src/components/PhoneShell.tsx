import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props { children: ReactNode; }

export default function PhoneShell({ children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className="min-h-[100dvh] w-full flex items-center justify-center py-4 px-4"
    >
      <div
        className="w-full max-w-[420px] bg-cream rounded-[36px] relative overflow-hidden"
        style={{
          height: 'min(760px, calc(100dvh - 2rem))',
          boxShadow: '0 30px 60px -20px rgba(190, 24, 93, 0.45), 0 10px 30px -10px rgba(190, 24, 93, 0.35)',
          border: '1px solid #fbcfe8',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
