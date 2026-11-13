import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { storeApi, storeAssetUrl, storeDownloadUrl, type StoreProductDetail, type StoreRelease } from '../../api/store';
import { Icon } from '../../components/Icon';
import { Skeleton, useNow } from '../../components/motion';
import { useCustomer } from '../../store/CustomerAuth';
import { MinecraftNamePrompt, needsMinecraftName } from '../../store/MinecraftNamePrompt';
import { Markdown } from '../../store/Markdown';
import { PriceTag, ProductIcon } from '../../store/ProductCard';
import { useStoreInfo } from '../../store/StoreShell';
import { formatBytes, formatDate, timeLeft } from '../../store/format';

export async function downloadRelease(release: StoreRelease) {
  const { ticket } = await storeApi.downloadTicket(release.id);
  window.location.assign(storeDownloadUrl(release.id, ticket));
}

export function StoreProductPage() {
  const { slug = '' } = useParams();
  const { info } = useStoreInfo();
  const { isLoggedIn, refresh, me } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const [detail, setDetail] = useState<StoreProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'overview' | 'versions' | 'gallery'>('overview');
  const [consent, setConsent] = useState(false);
  const [askName, setAskName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const now = useNow(30000);

  const load = useCallback(() => {
    storeApi.product(slug)
      .then((d) => { setDetail(d); setNotFound(false); })
      .catch((err) => { if (err instanceof ApiError && err.status === 404) setNotFound(true); else setError('Nem sikerült betölteni a terméket.'); });
  }, [slug]);

  useEffect(() => { load(); }, [load, isLoggedIn]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  if (notFound) {
    return (
      <main className="page store-page">
        <div className="card store-empty">
          <Icon name="package" size={30} />
          <h3>Ez a termék nem található</h3>
          <p className="muted">Lehet, hogy átnevezték vagy már nem érhető el.</p>
          <Link to="/store" className="btn-secondary">Vissza az áruházba</Link>
        </div>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="page store-page">
        {error ? <p className="error-text">{error}</p> : (
          <div className="card"><Skeleton width={80} height={80} /><Skeleton width="40%" style={{ marginTop: 16 }} /><Skeleton width="70%" style={{ marginTop: 10 }} /></div>
        )}
      </main>
    );
  }

  const { card } = detail;
  const isModel = card.kind === 'model';
  const currency = info?.currency ?? 'EUR';
  const latest = detail.releases[0];
  const left = card.discountPercent > 0 ? timeLeft(card.discountEndsAt, now) : null;
  const canBuy = (info?.storeEnabled ?? true) && (info?.paymentsConfigured ?? false) || card.price === 0;

  async function handleBuy(minecraftName?: string) {
    if (!isLoggedIn) {
      navigate(`/store/fiok?vissza=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!consent) {
      setError('A vásárláshoz pipáld be a hozzájárulást az azonnali teljesítéshez.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await storeApi.checkout([card.id], true, minecraftName);
      if (result.checkoutUrl.startsWith(window.location.origin)) {
        await refresh();
        navigate(new URL(result.checkoutUrl).pathname + new URL(result.checkoutUrl).search);
      } else {
        window.location.assign(result.checkoutUrl);
      }
    } catch (err) {
      if (needsMinecraftName(err)) setAskName(true);
      setError(err instanceof ApiError ? err.message : 'Nem sikerült elindítani a fizetést.');
      setBusy(false);
    }
  }

  async function handleDownload(release: StoreRelease) {
    setError(null);
    try {
      await downloadRelease(release);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nem sikerült elindítani a letöltést.');
    }
  }

  return (
    <main className="page store-page product-page">
      <nav className="breadcrumbs small" aria-label="Morzsamenü">
        <Link to="/store">{info?.brandName ?? 'Avenge Foundry'}</Link>
        <span aria-hidden="true">/</span>
        {card.category && <><span>{card.category}</span><span aria-hidden="true">/</span></>}
        <span className="muted">{card.name}</span>
      </nav>

      <header className="product-hero stagger-in">
        <ProductIcon name={card.name} iconAssetId={card.iconAssetId} size={96} />
        <div className="product-hero-text">
          <h1>{card.name}</h1>
          <p className="muted">{card.tagline}</p>
          <div className="product-chips">
            <span className={`kind-pill ${isModel ? 'kind-pill-model' : ''}`}><Icon name={isModel ? 'cube' : 'package'} size={11} /> {isModel ? 'Modell' : 'Plugin'}</span>
            {card.supportedVersions && <span className="chip"><Icon name="layers" size={12} /> {card.supportedVersions}</span>}
            {card.platforms.map((p) => <span className="chip chip-dim" key={p}>{p}</span>)}
            {card.isFeatured && <span className="chip chip-hot"><Icon name="star" size={12} /> Kiemelt</span>}
          </div>
        </div>
      </header>

      <div className="product-layout">
        <div className="product-main">
          <nav className="foundry-tabs" aria-label="Termék fülek">
            <button type="button" className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}>Leírás</button>
            <button type="button" className={tab === 'versions' ? 'is-active' : ''} onClick={() => setTab('versions')}>
              Verziók <span className="foundry-tab-count">{detail.releases.length}</span>
            </button>
            {detail.gallery.length > 0 && (
              <button type="button" className={tab === 'gallery' ? 'is-active' : ''} onClick={() => setTab('gallery')}>
                Képek <span className="foundry-tab-count">{detail.gallery.length}</span>
              </button>
            )}
          </nav>

          {tab === 'overview' && (
            <section className="card product-description">
              {detail.gallery.length > 0 && (
                <button type="button" className="product-cover" onClick={() => setLightbox(detail.gallery[0])}>
                  <img src={storeAssetUrl(detail.gallery[0])} alt={`${card.name} képernyőkép`} />
                </button>
              )}
              {detail.description.trim()
                ? <Markdown source={detail.description} />
                : <p className="muted">{isModel ? 'Ehhez a modellhez' : 'Ehhez a pluginhoz'} még nincs részletes leírás.</p>}
            </section>
          )}

          {tab === 'versions' && (
            <section className="card release-list">
              {detail.releases.length === 0 && <p className="muted">Még nincs feltöltött verzió.</p>}
              {detail.releases.map((release, i) => (
                <article className="release-item" key={release.id}>
                  <header>
                    <strong className="mono">v{release.version}</strong>
                    {i === 0 && <span className="chip chip-hot">Legújabb</span>}
                    <span className="muted small">{formatDate(release.createdAt)} · {formatBytes(release.sizeBytes)}</span>
                    {detail.owned && (
                      <button type="button" className="btn-ghost btn-tiny" onClick={() => handleDownload(release)}>
                        <Icon name="download" size={13} /> Letöltés
                      </button>
                    )}
                  </header>
                  {release.changelog.trim() ? <Markdown source={release.changelog} className="markdown-compact" /> : <p className="muted small">Nincs változásnapló.</p>}
                  {detail.owned && release.sha256 && <p className="mono tiny-hash" title="SHA-256">SHA-256: {release.sha256}</p>}
                </article>
              ))}
            </section>
          )}

          {tab === 'gallery' && (
            <section className="gallery-grid">
              {detail.gallery.map((id) => (
                <button type="button" key={id} className="gallery-item" onClick={() => setLightbox(id)}>
                  <img src={storeAssetUrl(id)} alt={`${card.name} képernyőkép`} loading="lazy" />
                </button>
              ))}
            </section>
          )}
        </div>

        <aside className="product-side">
          <section className="card buy-card">
            {card.discountPercent > 0 && (
              <div className="buy-sale">
                <Icon name="tag" size={15} />
                <span><strong>{card.discountName ?? 'Akció'}</strong> −{card.discountPercent}%</span>
                {left && <span className="mono small">még {left}</span>}
              </div>
            )}
            <PriceTag price={card.price} listPrice={card.listPrice} currency={currency} discountPercent={card.discountPercent} large />
            <p className="muted small">Egyszeri vásárlás, élethosszig tartó frissítésekkel a fiókodban.</p>

            {detail.owned ? (
              <>
                <p className="success-text"><Icon name="check" size={16} /> A tiéd - bármikor letöltheted.</p>
                {latest && (
                  <button type="button" className="btn-primary btn-block" onClick={() => handleDownload(latest)}>
                    <Icon name="download" size={17} /> Letöltés (v{latest.version})
                  </button>
                )}
                <Link to="/store/fiok" className="btn-ghost btn-block">Termékeim</Link>
              </>
            ) : (
              <>
                {isLoggedIn && (
                  <label className="consent-check">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span>
                      Kérem a digitális tartalom azonnali szolgáltatását, és tudomásul veszem, hogy a letöltés
                      megkezdésével elveszítem a 14 napos elállási jogomat. Elfogadom az <Link to="/jogi/aszf">ÁSZF</Link>-et
                      és a <Link to="/jogi/licenc">licencfeltételeket</Link>.
                    </span>
                  </label>
                )}
                <button type="button" className={`btn-primary btn-block btn-large ${busy ? 'is-loading' : ''}`} disabled={busy || !canBuy} onClick={() => handleBuy()}>
                  {busy && <span className="btn-spinner" aria-hidden="true" />}
                  <Icon name="cart" size={18} />
                  {!isLoggedIn ? 'Belépés a vásárláshoz' : card.price === 0 ? 'Megszerzem ingyen' : 'Megvásárlom'}
                </button>
                {!canBuy && <p className="muted small">A vásárlás jelenleg szünetel.</p>}
                <p className="buy-secure small"><Icon name="lock" size={13} /> Biztonságos fizetés a Tebexen keresztül (bankkártya, PayPal és más módok).</p>
              </>
            )}
            {askName && <MinecraftNamePrompt initial={me?.minecraftUsername ?? ''} busy={busy} onSubmit={(name) => handleBuy(name)} />}
            {error && <p className="error-text error-in">{error}</p>}
          </section>

          <section className="card product-facts">
            <dl>
              <div><dt>Legújabb verzió</dt><dd className="mono">{latest ? `v${latest.version}` : '-'}</dd></div>
              <div><dt>Frissítve</dt><dd>{formatDate(card.updatedAt)}</dd></div>
              <div><dt>Minecraft</dt><dd>{card.supportedVersions || '-'}</dd></div>
              <div><dt>{isModel ? 'Kompatibilis' : 'Szerverszoftver'}</dt><dd>{card.platforms.join(', ') || '-'}</dd></div>
              {card.category && <div><dt>Kategória</dt><dd>{card.category}</dd></div>}
              <div><dt>Vásárlás / letöltés</dt><dd>{card.salesCount} / {card.downloadCount}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <img src={storeAssetUrl(lightbox)} alt="" />
          <button type="button" className="lightbox-close" aria-label="Bezárás"><Icon name="x" size={22} /></button>
        </div>
      )}
    </main>
  );
}
