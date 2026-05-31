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
        className="paper w-full max-w-[420px] rounded-[28px] relative overflow-hidden"
        style={{
          height: 'min(760px, calc(100dvh - 2rem))',
          boxShadow:
            '0 30px 60px -20px rgba(190, 24, 93, 0.45),' +
            '0 10px 30px -10px rgba(190, 24, 93, 0.35),' +
            'inset 18px 0 30px -22px rgba(190, 24, 93, 0.30)', // soft inner spine shadow
          border: '1px solid #f9a8d4',
        }}
      >
        {/* Stitched spine running down the left edge */}
        <div className="book-spine" />

        {/* Ribbon bookmark on the top-right */}
        <div className="bookmark" />

        {/* Folded-page corner at bottom-right */}
        <div className="page-curl" />

        {/* The actual page content — push it past the spine */}
        <div className="relative h-full pl-[18px]">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
