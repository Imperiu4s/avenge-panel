import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { storeAdminApi, storeAssetUrl, type AdminProduct, type ProductUpsert } from '../../../api/store';
import { Markdown } from '../../../store/Markdown';
import { ProductIcon } from '../../../store/ProductCard';
import { formatBytes, formatDate, formatPrice } from '../../../store/format';
import { Icon } from '../../Icon';
import { Skeleton } from '../../motion';

const PLATFORM_PRESETS = ['Paper', 'Spigot', 'Purpur', 'Folia', 'Bukkit', 'Velocity', 'BungeeCord', 'Waterfall', 'Fabric'];

const EMPTY: ProductUpsert = {
  name: '', slug: '', tagline: '', description: '', category: '', price: 0,
  supportedVersions: '', platforms: 'Paper, Spigot', isPublished: false, isFeatured: false, sortOrder: 0
};

function toDraft(p: AdminProduct): ProductUpsert {
  return {
    name: p.name, slug: p.slug, tagline: p.tagline, description: p.description, category: p.category, price: p.price,
    supportedVersions: p.supportedVersions, platforms: p.platforms, isPublished: p.isPublished, isFeatured: p.isFeatured, sortOrder: p.sortOrder
  };
}

function ProductEditor({ product, currency, onSaved, onClose }: {
  product: AdminProduct | null; currency: string; onSaved: (id: string) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<ProductUpsert>(product ? toDraft(product) : EMPTY);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [releaseFile, setReleaseFile] = useState<File | null>(null);
  const [releaseVersion, setReleaseVersion] = useState('');
  const [releaseChangelog, setReleaseChangelog] = useState('');

  // Csak másik plugin kiválasztásakor töltjük újra: egy kép feltöltése ne dobja el a mentetlen szerkesztést.
  const productId = product?.id;
  useEffect(() => {
    setDraft(product ? toDraft(product) : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const platforms = draft.platforms.split(',').map((p) => p.trim()).filter(Boolean);
  const set = <K extends keyof ProductUpsert>(key: K, value: ProductUpsert[K]) => { setDraft((d) => ({ ...d, [key]: value })); setNotice(null); };

  function togglePlatform(name: string) {
    const next = platforms.includes(name) ? platforms.filter((p) => p !== name) : [...platforms, name];
    set('platforms', next.join(', '));
  }

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült.');
    } finally {
      setBusy(null);
    }
  }

  const save = (e: FormEvent) => {
    e.preventDefault();
    run('save', async () => {
      const result = product
        ? await storeAdminApi.updateProduct(product.id, draft)
        : await storeAdminApi.createProduct(draft);
      setNotice(product ? 'Mentve.' : 'Plugin létrehozva - most már feltölthetsz ikont, képeket és verziót.');
      onSaved(result.id);
    });
  };

  const uploadIcon = (file: File | undefined) => file && product && run('icon', async () => {
    await storeAdminApi.uploadAsset(product.id, file, 'icon');
    onSaved(product.id);
  });

  const uploadGallery = (files: FileList | null) => files && product && run('gallery', async () => {
    for (const file of Array.from(files)) await storeAdminApi.uploadAsset(product.id, file, 'gallery');
    onSaved(product.id);
  });

  const uploadRelease = (e: FormEvent) => {
    e.preventDefault();
    if (!product || !releaseFile) return;
    run('release', async () => {
      await storeAdminApi.uploadRelease(product.id, releaseFile, releaseVersion.trim(), releaseChangelog);
      setReleaseFile(null);
      setReleaseVersion('');
      setReleaseChangelog('');
      setNotice('Verzió feltöltve - a vásárlók azonnal letölthetik.');
      onSaved(product.id);
    });
  };

  const remove = () => product && window.confirm(`Törlöd a(z) ${product.name} plugint? Csak a még soha el nem adott plugin törölhető.`) && run('delete', async () => {
    await storeAdminApi.deleteProduct(product.id);
    onClose();
    onSaved('');
  });

  return (
    <section className="card product-editor stagger-in">
      <div className="scans-head">
        <h2 className="card-title"><Icon name="package" size={18} /> {product ? product.name : 'Új plugin'}</h2>
        <div className="editor-head-actions">
          {product?.isPublished && <Link to={`/store/${product.slug}`} className="btn-ghost btn-tiny" target="_blank"><Icon name="eye" size={13} /> Megtekintés</Link>}
          <button type="button" className="btn-ghost btn-tiny" onClick={onClose}><Icon name="x" size={13} /> Bezárás</button>
        </div>
      </div>

      <form onSubmit={save}>
        <div className="settings-grid">
          <label>
            <span className="field-label">Név</span>
            <input required maxLength={80} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="pl. Avenge Duels" />
          </label>
          <label>
            <span className="field-label">URL (slug)</span>
            <input maxLength={60} value={draft.slug} onChange={(e) => set('slug', e.target.value)} placeholder="automatikus a névből" />
            <small className="muted">avenge.hu/store/{draft.slug || '…'}</small>
          </label>
          <label>
            <span className="field-label">Ár ({currency})</span>
            <input type="number" min={0} max={10000} step="0.01" value={draft.price} onChange={(e) => set('price', Number(e.target.value))} />
            <small className="muted">0 = ingyenes (fiókkal letölthető)</small>
          </label>
          <label>
            <span className="field-label">Rövid leírás</span>
            <input maxLength={160} value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Egy mondat a kártyára" />
          </label>
          <label>
            <span className="field-label">Kategória</span>
            <input maxLength={40} value={draft.category} onChange={(e) => set('category', e.target.value)} placeholder="pl. Minigame, Gazdaság, Admin" />
          </label>
          <label>
            <span className="field-label">Támogatott Minecraft-verziók</span>
            <input maxLength={80} value={draft.supportedVersions} onChange={(e) => set('supportedVersions', e.target.value)} placeholder="pl. 1.8.8 – 1.21.4" />
          </label>
        </div>

        <span className="field-label">Szerverszoftver</span>
        <div className="platform-picker">
          {[...new Set([...PLATFORM_PRESETS, ...platforms])].map((name) => (
            <button type="button" key={name} className={`chip-toggle ${platforms.includes(name) ? 'is-active' : ''}`} onClick={() => togglePlatform(name)}>
              {platforms.includes(name) && <Icon name="check" size={11} />} {name}
            </button>
          ))}
        </div>

        <div className="field-label-row">
          <span className="field-label">Részletes leírás (Markdown)</span>
          <button type="button" className="btn-ghost btn-tiny" onClick={() => setPreview(!preview)}>{preview ? 'Szerkesztés' : 'Előnézet'}</button>
        </div>
        {preview
          ? <div className="markdown-preview"><Markdown source={draft.description || '_Üres leírás_'} /></div>
          : (
            <textarea
              className="textarea-code"
              rows={14}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={'## Funkciók\n- Gyors arénák\n- Testreszabható kitek\n\n## Parancsok\n| Parancs | Leírás |\n|---|---|\n| /duel <játékos> | Kihívás |'}
            />
          )}
        <small className="muted">Támogatott: # címek, **félkövér**, *dőlt*, `kód`, listák, táblázat, [link](https://…), ![kép](https://…).</small>

        <div className="toggle-list">
          <label className="toggle-row">
            <span className="toggle-text"><strong>Közzétéve</strong><small>Megjelenik az áruházban és megvásárolható. Kikapcsolva rejtett, de a vevők továbbra is letölthetik.</small></span>
            <input type="checkbox" className="switch" checked={draft.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
          </label>
          <label className="toggle-row">
            <span className="toggle-text"><strong>Kiemelt</strong><small>A lista elején, "Kiemelt" jelöléssel.</small></span>
            <input type="checkbox" className="switch" checked={draft.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
          </label>
        </div>

        <div className="settings-actions">
          {product ? <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={remove} disabled={busy !== null}><Icon name="trash" size={13} /> Plugin törlése</button> : <span />}
          <button type="submit" className={`btn-primary ${busy === 'save' ? 'is-loading' : ''}`} disabled={busy !== null}>
            {busy === 'save' && <span className="btn-spinner" aria-hidden="true" />}
            {product ? 'Mentés' : 'Létrehozás'}
          </button>
        </div>
      </form>

      {product && (
        <div className="editor-media">
          <div>
            <span className="field-label">Ikon</span>
            <div className="icon-upload">
              <ProductIcon name={product.name} iconAssetId={product.iconAssetId} size={72} />
              <label className="btn-secondary btn-tiny file-button">
                <Icon name="plus" size={13} /> {product.iconAssetId ? 'Csere' : 'Feltöltés'}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { uploadIcon(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              <small className="muted">Négyzetes, min. 256×256 px, max. 5 MB</small>
            </div>
          </div>
          <div>
            <span className="field-label">Képek (galéria)</span>
            <div className="gallery-admin">
              {product.gallery.map((asset) => (
                <figure key={asset.id}>
                  <img src={storeAssetUrl(asset.id)} alt="" />
                  <button type="button" className="gallery-remove" aria-label="Kép törlése" onClick={() => run('asset', async () => { await storeAdminApi.deleteAsset(asset.id); onSaved(product.id); })}>
                    <Icon name="x" size={13} />
                  </button>
                </figure>
              ))}
              <label className="gallery-add file-button">
                <Icon name="plus" size={20} />
                <span className="small">Kép hozzáadása</span>
                <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { uploadGallery(e.target.files); e.target.value = ''; }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {product && (
        <div className="editor-releases">
          <span className="field-label">Verziók</span>
          <form className="release-upload" onSubmit={uploadRelease}>
            <label className="btn-secondary btn-tiny file-button">
              <Icon name="file" size={13} /> {releaseFile ? releaseFile.name : '.jar / .zip kiválasztása'}
              <input type="file" accept=".jar,.zip" onChange={(e) => setReleaseFile(e.target.files?.[0] ?? null)} />
            </label>
            <input required maxLength={40} placeholder="Verzió (pl. 1.2.0)" value={releaseVersion} onChange={(e) => setReleaseVersion(e.target.value)} />
            <textarea rows={3} placeholder="Változásnapló (Markdown, nem kötelező)" value={releaseChangelog} onChange={(e) => setReleaseChangelog(e.target.value)} />
            <button type="submit" className={`btn-primary btn-tiny ${busy === 'release' ? 'is-loading' : ''}`} disabled={!releaseFile || busy !== null}>
              {busy === 'release' && <span className="btn-spinner" aria-hidden="true" />}
              <Icon name="download" size={13} /> Feltöltés
            </button>
          </form>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Verzió</th><th>Fájl</th><th>Méret</th><th>Feltöltve</th><th>SHA-256</th><th /></tr></thead>
              <tbody>
                {product.releases.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">v{r.version}</td>
                    <td className="small">{r.fileName}</td>
                    <td className="small muted">{formatBytes(r.sizeBytes)}</td>
                    <td className="small muted">{formatDate(r.createdAt)}</td>
                    <td className="mono small muted" title={r.sha256}>{r.sha256.slice(0, 12)}…</td>
                    <td>
                      <button type="button" className="btn-ghost btn-tiny btn-danger" onClick={() => window.confirm(`Törlöd a v${r.version} verziót? A vevők ezt a verziót többé nem tölthetik le.`) && run('release-del', async () => { await storeAdminApi.deleteRelease(r.id); onSaved(product.id); })}>
                        Törlés
                      </button>
                    </td>
                  </tr>
                ))}
                {product.releases.length === 0 && <tr><td colSpan={6} className="muted empty-row">Még nincs feltöltött verzió - a vásárlók addig nem tudnak letölteni.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {notice && <p className="success-text"><Icon name="check" size={15} /> {notice}</p>}
      {error && <p className="error-text error-in">{error}</p>}
    </section>
  );
}

export function StoreProductsAdmin({ currency }: { currency: string }) {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProducts(await storeAdminApi.products());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült betölteni a pluginokat.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = editing && editing !== 'new' ? products?.find((p) => p.id === editing) ?? null : null;

  return (
    <>
      {editing && (
        <ProductEditor
          key={editing}
          product={current}
          currency={currency}
          onClose={() => setEditing(null)}
          onSaved={async (id) => { await load(); if (id) setEditing(id); }}
        />
      )}

      <section className="card section-gap stagger-in">
        <div className="scans-head">
          <h2 className="card-title"><Icon name="package" size={18} /> Pluginok</h2>
          <button type="button" className="btn-primary btn-tiny" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> Új plugin</button>
        </div>
        {error && <p className="error-text">{error}</p>}
        {!products && !error && <Skeleton width="100%" height={60} />}
        {products && (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Plugin</th><th>Ár</th><th>Állapot</th><th className="align-right">Eladás</th><th className="align-right">Tulajdonos</th><th className="align-right">Letöltés</th><th>Verzió</th><th /></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={editing === p.id ? 'row-selected' : ''}>
                    <td>
                      <span className="product-cell">
                        <ProductIcon name={p.name} iconAssetId={p.iconAssetId} size={34} />
                        <span><strong>{p.name}</strong><small className="muted">/{p.slug}</small></span>
                      </span>
                    </td>
                    <td className="mono small">
                      {p.discountPercent > 0 ? <><s className="muted">{formatPrice(p.price, currency)}</s> {formatPrice(p.effectivePrice, currency)}</> : formatPrice(p.price, currency)}
                    </td>
                    <td>
                      <span className={`status-pill ${p.isPublished ? 'status-paid' : 'status-pending'}`}>{p.isPublished ? 'Közzétéve' : 'Rejtett'}</span>
                      {p.isFeatured && <span className="chip chip-hot chip-inline"><Icon name="star" size={10} /></span>}
                    </td>
                    <td className="align-right mono">{p.salesCount}</td>
                    <td className="align-right mono">{p.owners}</td>
                    <td className="align-right mono">{p.downloadCount}</td>
                    <td className="mono small">{p.releases[0] ? `v${p.releases[0].version}` : <span className="notice-inline">nincs</span>}</td>
                    <td><button type="button" className="btn-ghost btn-tiny" onClick={() => { setEditing(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Szerkesztés</button></td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={8} className="muted empty-row">Még nincs plugin. Kezdd az "Új plugin" gombbal.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
