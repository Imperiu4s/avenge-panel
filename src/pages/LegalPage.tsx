import { Link, Navigate, NavLink, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { findLegalDocument, LEGAL_DOCUMENTS } from '../legal/documents';
import { Markdown } from '../store/Markdown';

export function LegalPage() {
  const { doc } = useParams();
  const document = findLegalDocument(doc);
  if (!document) return <Navigate to="/jogi/aszf" replace />;

  return (
    <main className="page legal-page">
      <header className="page-head stagger-in">
        <span className="eyebrow"><Icon name="scale" size={13} /> Jogi dokumentumok</span>
        <h1>{document.title}</h1>
        <p className="muted small">Hatályos: {document.updated}</p>
      </header>
      <div className="legal-layout">
        <nav className="legal-nav card" aria-label="Jogi dokumentumok">
          {LEGAL_DOCUMENTS.map((d) => (
            <NavLink key={d.slug} to={`/jogi/${d.slug}`} className={({ isActive }) => `legal-nav-link ${isActive ? 'is-active' : ''}`}>
              {d.title}
            </NavLink>
          ))}
          <Link to="/store" className="legal-nav-back small"><Icon name="arrow-right" size={13} /> Áruház</Link>
        </nav>
        <article className="card legal-body stagger-in" style={{ animationDelay: '60ms' }}>
          <Markdown source={document.body} />
        </article>
      </div>
    </main>
  );
}
