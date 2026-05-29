import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="inline-flex bg-white border border-pink-200 rounded-full p-[3px] gap-[2px] shadow">
      {(['si', 'en'] as const).map((L) => (
        <button
          key={L}
          onClick={() => i18n.changeLanguage(L)}
          className="font-extrabold text-[11px] px-2.5 py-1 rounded-full transition-colors"
          style={{
            background: lang === L ? 'linear-gradient(135deg,#ec4899,#f472b6)' : 'transparent',
            color: lang === L ? 'white' : '#a44b73',
          }}
        >
          {L === 'si' ? 'සිං' : 'EN'}
        </button>
      ))}
    </div>
  );
}
