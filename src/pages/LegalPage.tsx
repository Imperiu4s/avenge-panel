import { lang, setLang, t } from '../i18n';
import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/motion';
import { findLegalDocument, localizedLegalDocuments } from '../legal/documents';
import { renderLegal, useLegalContent } from '../legal/legalContent';
import { Markdown } from '../store/Markdown';

export function LegalPage() {
  const { doc } = useParams();
  const content = useLegalContent();
  const document = findLegalDocument(doc);
  if (!document) return <Navigate to="/jogi/aszf" replace />;

  const override = lang === 'hu' ? content?.documents[document.slug] : undefined;
  const body = override?.body ?? document.body;
  const updated = override?.updated || document.updated;

  return (
    <main className="page legal-page">
      <header className="page-head stagger-in">
        <span className="eyebrow"><Icon name="scale" size={13} />{' '}{t('Jogi dokumentumok')}</span>
        <h1>{document.title}</h1>
        <p className="muted small">{t('Hatályos:')}{' '}{updated}</p>
      </header>
      <div className="legal-layout">
        <nav className="legal-nav card" aria-label={t('Jogi dokumentumok')}>
          {localizedLegalDocuments().map((d) => (
            <NavLink key={d.slug} to={`/jogi/${d.slug}`} className={({ isActive }) => `legal-nav-link ${isActive ? 'is-active' : ''}`}>
              {d.title}
            </NavLink>
          ))}
          <Link to="/store" className="legal-nav-back small"><Icon name="arrow-right" size={13} />{' '}{t('Áruház')}</Link>
        </nav>
        <article className="card legal-body stagger-in" style={{ animationDelay: '60ms' }}>
          {lang === 'en' && (
            <p className="legal-translation-note muted small">
              <Icon name="info" size={15} />
              <span>
                This English version is a translation provided for convenience. The Hungarian version is legally binding.{' '}
                <button type="button" className="text-link" onClick={() => setLang('hu')}>Magyar változat</button>
              </span>
            </p>
          )}
          {content
            ? <Markdown source={renderLegal(body, content)} />
            : <><Skeleton width="70%" /><Skeleton width="90%" style={{ marginTop: 12 }} /><Skeleton width="60%" style={{ marginTop: 12 }} /></>}
        </article>
      </div>
    </main>
  );
}
