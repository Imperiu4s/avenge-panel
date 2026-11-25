import { lang, setLang, t, type Lang } from '../i18n';

const OPTIONS: { code: Lang; label: string; name: string }[] = [
  { code: 'hu', label: 'HU', name: 'Magyar' },
  { code: 'en', label: 'EN', name: 'English' }
];

export function LanguageSwitch({ className = '' }: { className?: string }) {
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('Nyelv')}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          lang={option.code}
          className={`lang-opt ${lang === option.code ? 'is-active' : ''}`}
          aria-pressed={lang === option.code}
          title={option.name}
          onClick={() => setLang(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
