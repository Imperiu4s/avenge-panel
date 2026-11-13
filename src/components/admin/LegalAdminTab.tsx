import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../api/client';
import { LEGAL_DOCUMENTS } from '../../legal/documents';
import {
  fetchLegalContent,
  LEGAL_FIELDS,
  legalAdminApi,
  PLACEHOLDER_HELP,
  renderLegal,
  resolvedFields,
  resolvedHosting,
  type LegalContentData,
  type LegalDocumentOverride,
  type LegalHostingEntry
} from '../../legal/legalContent';
import { formatDateTime } from '../../store/format';
import { Markdown } from '../../store/Markdown';
import { Icon } from '../Icon';
import { useCopyFeedback } from '../motion';

const GROUPS = [...new Set(LEGAL_FIELDS.map((f) => f.group))];

export function LegalAdminTab() {
  const [loaded, setLoaded] = useState<LegalContentData | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [hosting, setHosting] = useState<LegalHostingEntry[]>([]);
  const [docs, setDocs] = useState<Record<string, LegalDocumentOverride>>({});
  const [active, setActive] = useState(LEGAL_DOCUMENTS[0].slug);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { copiedKey, copy } = useCopyFeedback();

  function apply(content: LegalContentData) {
    setLoaded(content);
    setFields(resolvedFields(content));
    setHosting(resolvedHosting(content).map((h) => ({ ...h })));
    const next: Record<string, LegalDocumentOverride> = {};
    for (const d of LEGAL_DOCUMENTS) {
      const o = content.documents[d.slug];
      next[d.slug] = { body: o?.body ?? d.body.trim(), updated: o?.updated || d.updated };
    }
    setDocs(next);
  }

  useEffect(() => {
    legalAdminApi.get().then(apply).catch((err) => setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a jogi adatokat.'));
  }, []);

  const draft: LegalContentData = useMemo(() => ({ fields, hosting, documents: docs, updatedAt: null }), [fields, hosting, docs]);
  const activeDoc = LEGAL_DOCUMENTS.find((d) => d.slug === active)!;
  const current = docs[active];
  const customized = current && (current.body.trim() !== activeDoc.body.trim() || current.updated !== activeDoc.updated);

  if (!loaded || !current) {
    return <section className="card">{error ? <p className="error-text">{error}</p> : <p className="muted">Betöltés...</p>}</section>;
  }

  const setField = (key: string, value: string) => { setFields((f) => ({ ...f, [key]: value })); setNotice(null); };
  const setHost = (index: number, key: keyof LegalHostingEntry, value: string) => {
    setHosting((list) => list.map((h, i) => (i === index ? { ...h, [key]: value } : h)));
    setNotice(null);
  };
  const setDoc = (patch: Partial<LegalDocumentOverride>) => { setDocs((d) => ({ ...d, [active]: { ...d[active], ...patch } })); setNotice(null); };

  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const documents: Record<string, LegalDocumentOverride> = {};
      for (const d of LEGAL_DOCUMENTS) {
        const o = docs[d.slug];
        if (o && (o.body.trim() !== d.body.trim() || o.updated !== d.updated)) documents[d.slug] = o;
      }
      const saved = await legalAdminApi.save({ fields, hosting: hosting.filter((h) => h.name.trim().length > 0), documents });
      apply(saved);
      await fetchLegalContent(true);
      setNotice('Mentve. A jogi oldalak azonnal a frissített tartalmat mutatják.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült menteni.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="card stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="scale" size={18} /> Jogi adatok</h2>
          <span className="muted small">{loaded.updatedAt ? `Módosítva: ${formatDateTime(loaded.updatedAt)}` : 'Még az alapértékek érvényesek'}</span>
        </div>
        <p className="muted small">Ezek az adatok kerülnek az ÁSZF-be, az adatkezelési tájékoztatóba, az impresszumba és a többi jogi oldalra. A szövegekben a <code>{'{{...}}'}</code> jelölők helyére kerülnek.</p>
        {GROUPS.map((group) => (
          <div key={group} className="legal-admin-group">
            <span className="field-label legal-admin-group-title">{group}</span>
            <div className="seller-grid">
              {LEGAL_FIELDS.filter((f) => f.group === group).map((f) => (
                <label key={f.key} className={f.key === 'naplo.megorzes' ? 'legal-admin-wide' : undefined}>
                  <span className="field-label">{f.label}</span>
                  {f.key === 'naplo.megorzes'
                    ? <textarea rows={3} value={fields[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />
                    : <input value={fields[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />}
                  {f.hint && <small className="muted">{f.hint}</small>}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="legal-admin-group">
          <span className="field-label legal-admin-group-title">Tárhelyszolgáltatók</span>
          <p className="muted small">Az Ekertv. szerint a tárhelyszolgáltató nevét, címét és elérhetőségét fel kell tüntetni.</p>
          <div className="legal-hosting">
            {hosting.map((h, i) => (
              <div key={i} className="legal-hosting-row">
                <input value={h.role} onChange={(e) => setHost(i, 'role', e.target.value)} placeholder="Feladat (pl. Szerver)" aria-label="Feladat" />
                <input value={h.name} onChange={(e) => setHost(i, 'name', e.target.value)} placeholder="Szolgáltató neve" aria-label="Szolgáltató neve" />
                <input value={h.address} onChange={(e) => setHost(i, 'address', e.target.value)} placeholder="Cím" aria-label="Cím" />
                <input value={h.contact} onChange={(e) => setHost(i, 'contact', e.target.value)} placeholder="E-mail vagy weboldal" aria-label="Elérhetőség" />
                <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => setHosting((list) => list.filter((_, j) => j !== i))} aria-label="Sor törlése">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost btn-tiny" onClick={() => setHosting((list) => [...list, { role: '', name: '', address: '', contact: '' }])}>
            <Icon name="plus" size={13} /> Új sor
          </button>
        </div>
      </section>

      <section className="card section-gap stagger-in" style={{ animationDelay: '60ms' }}>
        <div className="scans-head">
          <h2 className="card-title"><Icon name="file" size={18} /> Dokumentumok</h2>
          {customized ? <span className="status-pill status-pending">Egyedi szöveg</span> : <span className="status-pill status-active">Alapszöveg</span>}
        </div>
        <nav className="sub-tabs" aria-label="Jogi dokumentumok">
          {LEGAL_DOCUMENTS.map((d) => (
            <button key={d.slug} type="button" className={`sub-tab ${active === d.slug ? 'is-active' : ''}`} onClick={() => setActive(d.slug)}>
              {d.short}
            </button>
          ))}
        </nav>
        <div className="seller-grid">
          <label>
            <span className="field-label">Hatályos</span>
            <input value={current.updated} onChange={(e) => setDoc({ updated: e.target.value })} />
          </label>
          <div className="legal-admin-actions">
            <button type="button" className="btn-ghost btn-tiny" onClick={() => setPreview(!preview)}>
              <Icon name={preview ? 'file' : 'eye'} size={13} /> {preview ? 'Szerkesztés' : 'Előnézet'}
            </button>
            <button type="button" className="btn-ghost btn-tiny" disabled={!customized} onClick={() => setDoc({ body: activeDoc.body.trim(), updated: activeDoc.updated })}>
              <Icon name="refresh" size={13} /> Alapszöveg visszaállítása
            </button>
          </div>
        </div>
        {preview
          ? <div className="legal-body legal-admin-preview"><Markdown source={renderLegal(current.body, draft)} /></div>
          : <textarea className="legal-admin-editor mono" rows={22} value={current.body} onChange={(e) => setDoc({ body: e.target.value })} spellCheck={false} />}
        <details className="legal-placeholders">
          <summary className="small">Beilleszthető jelölők</summary>
          <div className="legal-placeholder-list">
            {PLACEHOLDER_HELP.map((p) => (
              <button key={p.token} type="button" className="chip chip-dim" onClick={() => copy(p.token, p.token)} title="Másolás">
                <code>{p.token}</code> {copiedKey === p.token ? 'másolva' : p.text}
              </button>
            ))}
          </div>
        </details>
      </section>

      <div className="settings-actions section-gap">
        <span className="muted small">A mentés minden jogi oldalt egyszerre frissít.</span>
        <button type="button" className={`btn-primary ${busy ? 'is-loading' : ''}`} onClick={save} disabled={busy}>
          {busy && <span className="btn-spinner" aria-hidden="true" />}
          Mentés
        </button>
      </div>
      {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
      {error && <p className="error-text error-in">{error}</p>}
    </>
  );
}
