interface Props {
  emoji: string;
  label: string;
  venue?: string;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export default function PlaceCard({ emoji, label, venue, active = false, onClick, compact = false }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative text-left rounded-2xl transition-all"
      style={{
        border: '1.5px solid ' + (active ? '#ec4899' : '#fbcfe8'),
        background: active ? 'linear-gradient(135deg,#fff1f7,#fce7f3)' : 'white',
        padding: compact ? '12px 10px' : '14px 14px',
        boxShadow: active ? '0 8px 18px -10px rgba(236,72,153,.45)' : 'none',
        display: 'flex', gap: 10, alignItems: 'center',
      }}
    >
      <div className="text-2xl">{emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-sm text-ink leading-tight">{label}</div>
        {venue && <div className="text-[11px] text-ink-soft font-semibold mt-0.5">{venue}</div>}
      </div>
      {active && (
        <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-pink-500 text-white grid place-items-center text-[10px] font-black">
          ✓
        </div>
      )}
    </button>
  );
}
