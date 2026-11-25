import { t, locale } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { storeApi, type StoreProductCard } from '../../api/store';
import { Icon } from '../../components/Icon';
import { CountUp, Skeleton, useNow } from '../../components/motion';
import { Markdown } from '../../store/Markdown';
import { ProductCard } from '../../store/ProductCard';
import { useStoreInfo } from '../../store/StoreShell';
import { formatPrice, timeLeft } from '../../store/format';
import avengeLogo from '../../assets/avenge-logo-crop.png';

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular';
type Tab = 'all' | 'plugin' | 'model' | 'about';

const KIND_TABS: { key: Exclude<Tab, 'about'>; label: string; icon: 'layers' | 'package' | 'cube' }[] = [
  { key: 'all', label: t('Összes'), icon: 'layers' },
  { key: 'plugin', label: t('Pluginok'), icon: 'package' },
  { key: 'model', label: t('Modellek'), icon: 'cube' }
];

const NOUN: Record<Exclude<Tab, 'about'>, string> = { all: t('termék'), plugin: t('plugin'), model: t('modell') };

function kindOf(p: StoreProductCard): 'plugin' | 'model' {
  return p.kind === 'model' ? 'model' : 'plugin';
}

const SORTS: { key: Sort; label: string }[] = [
  { key: 'featured', label: t('Kiemelt') },
  { key: 'newest', label: t('Legutóbb frissített') },
  { key: 'popular', label: t('Legnépszerűbb') },
  { key: 'price-asc', label: t('Ár szerint növekvő') },
  { key: 'price-desc', label: t('Ár szerint csökkenő') }
];

export function StorePage() {
  const { info, error: infoError } = useStoreInfo();
  const [products, setProducts] = useState<StoreProductCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [onlySale, setOnlySale] = useState(false);
  const [price, setPrice] = useState<'all' | 'free' | 'paid'>('all');
  const [sort, setSort] = useState<Sort>('featured');
  const now = useNow(30000);

  useEffect(() => {
    storeApi.products().then(setProducts).catch(() => setError(t('Nem sikerült betölteni a termékeket.')));
  }, []);

  const currency = info?.currency ?? 'EUR';
  const everything = useMemo(() => products ?? [], [products]);
  const kindTab: Exclude<Tab, 'about'> = tab === 'about' ? 'all' : tab;
  const all = useMemo(() => (kindTab === 'all' ? everything : everything.filter((p) => kindOf(p) === kindTab)), [everything, kindTab]);
  const counts = useMemo(() => ({
    all: everything.length,
    plugin: everything.filter((p) => kindOf(p) === 'plugin').length,
    model: everything.filter((p) => kindOf(p) === 'model').length
  }), [everything]);
  const noun = NOUN[kindTab];
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    all.forEach((p) => p.category && counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], locale));
  }, [all]);
  const allPlatforms = useMemo(() => [...new Set(all.flatMap((p) => p.platforms))].sort(), [all]);

  const sale = useMemo(() => {
    const discounted = everything.filter((p) => p.discountPercent > 0);
    if (discounted.length === 0) return null;
    const best = discounted.reduce((a, b) => (b.discountPercent > a.discountPercent ? b : a));
    return { name: best.discountName ?? t('Akció'), percent: best.discountPercent, endsAt: best.discountEndsAt, count: discounted.length, all: discounted.length === everything.length };
  }, [everything]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = all.filter((p) =>
      (!needle || `${p.name} ${p.tagline} ${p.category}`.toLowerCase().includes(needle)) &&
      (!category || p.category === category) &&
      (platforms.length === 0 || platforms.every((pl) => p.platforms.includes(pl))) &&
      (!onlySale || p.discountPercent > 0) &&
      (price === 'all' || (price === 'free' ? p.price === 0 : p.price > 0)));
    const sorted = [...filtered];
    switch (sort) {
      case 'newest': sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); break;
      case 'popular': sorted.sort((a, b) => b.salesCount + b.downloadCount - (a.salesCount + a.downloadCount)); break;
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      default: break;
    }
    return sorted;
  }, [all, query, category, platforms, onlySale, price, sort]);

  const filtersActive = query !== '' || category !== '' || platforms.length > 0 || onlySale || price !== 'all';
  const left = sale ? timeLeft(sale.endsAt, now) : null;

  return (
    <main className="page store-page">
      <section className="foundry-banner stagger-in">
        <span className="foundry-banner-art" aria-hidden="true" />
        <div className="foundry-identity">
          <div className="foundry-avatar"><img src={avengeLogo} alt="" /></div>
          <div className="foundry-identity-text">
            <span className="eyebrow">{t('Minecraft pluginok és modellek')}</span>
            <h1>{info?.brandName ?? 'Avenge Foundry'} <span className="verified-chip" title={t('Az Avenge hivatalos plugin-műhelye')}><Icon name="check" size={12} />{' '}{t('Hivatalos')}</span></h1>
            <p className="muted">{info?.tagline ? t(info.tagline) : t('Minecraft pluginok és modellek az Avenge csapatától.')}</p>
          </div>
        </div>
        <dl className="foundry-stats">
          <div><dt>{t('Plugin')}</dt><dd>{info ? <CountUp value={info.plugins} /> : '–'}</dd></div>
          {(info?.models ?? 0) > 0 && <div><dt>{t('Modell')}</dt><dd><CountUp value={info?.models ?? 0} /></dd></div>}
          <div><dt>{t('Vásárlás')}</dt><dd>{info ? <CountUp value={info.sales} /> : '–'}</dd></div>
          <div><dt>{t('Letöltés')}</dt><dd>{info ? <CountUp value={info.downloads} /> : '–'}</dd></div>
        </dl>
        {info?.subscriptionEnabled && (
          <Link to="/elofizetes" className="foundry-sub-cta">
            <Icon name="radar" size={18} />
            <span><strong>{t('Avenge PC Check')}</strong><small>{t('havi előfizetéssel,')}{' '}{formatPrice(info.subscriptionPrice, currency)}{t('/hó')}</small></span>
            <Icon name="arrow-right" size={16} />
          </Link>
        )}
      </section>

      {infoError && <p className="error-text">{infoError}</p>}
      {info && !info.storeEnabled && (
        <p className="store-notice"><Icon name="info" size={16} />{' '}{t('Az áruház karbantartás miatt átmenetileg nem fogad rendelést. A már megvásárolt termékeidet a fiókodban továbbra is letöltheted.')}</p>
      )}

      {sale && (
        <div className="sale-strip stagger-in" style={{ animationDelay: '60ms' }}>
          <Icon name="tag" size={18} />
          <strong>{sale.name}</strong>
          <span>{sale.all ? t('Minden termék') : t('{0} termék', sale.count)}{' '}{t('akár')}{' '}<b>−{sale.percent}%</b></span>
          {left && <span className="sale-strip-left mono"><Icon name="clock" size={13} />{' '}{t('még')}{' '}{left}</span>}
          <button type="button" className="btn-ghost btn-tiny" onClick={() => { setTab('all'); setOnlySale(true); }}>{t('Akciósak')}</button>
        </div>
      )}

      <nav className="foundry-tabs" aria-label={t('Alkotói oldal')}>
        {KIND_TABS.map((k) => (
          <button key={k.key} type="button" className={tab === k.key ? 'is-active' : ''} onClick={() => { setTab(k.key); setCategory(''); setPlatforms([]); }}>
            <Icon name={k.icon} size={14} /> {k.label} <span className="foundry-tab-count">{counts[k.key]}</span>
          </button>
        ))}
        <button type="button" className={tab === 'about' ? 'is-active' : ''} onClick={() => setTab('about')}>{t('Rólunk')}</button>
      </nav>

      {tab === 'about' ? (
        <section className="card foundry-about">
          {info?.about
            ? <Markdown source={info.about} />
            : (
              <div className="markdown">
                <h2>{t('Az Avenge csapat műhelye')}</h2>
                <p>{t('Az Avenge elsősorban PC Check eszköz Minecraft szervereknek. A Foundry ennek a kiegészítése: itt adjuk ki a saját fejlesztésű pluginjainkat és modelljeinket, ugyanazzal a gondossággal, amivel a csalásokat keressük.')}</p>
                <ul>
                  <li>{t('Minden pluginhoz és modellhez azonnali letöltés és frissítések a fiókodban')}</li>
                  <li>{t('Biztonságos fizetés a Tebexen keresztül')}</li>
                  <li>{t('Átlátható licencfeltételek és visszatérítési szabályzat')}</li>
                </ul>
              </div>
            )}
        </section>
      ) : (
        <div className="foundry-layout">
          <aside className="foundry-filters card">
            <label className="filter-search">
              <Icon name="search" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={kindTab === 'model' ? t('Keresés a modellek között') : kindTab === 'plugin' ? t('Keresés a pluginok között') : t('Keresés a termékek között')} aria-label={t('Keresés')} />
            </label>

            {categories.length > 0 && (
              <div className="filter-group">
                <span className="field-label">{t('Kategória')}</span>
                <button type="button" className={`filter-option ${category === '' ? 'is-active' : ''}`} onClick={() => setCategory('')}>{t('Összes')}{' '}<span>{all.length}</span>
                </button>
                {categories.map(([name, count]) => (
                  <button type="button" key={name} className={`filter-option ${category === name ? 'is-active' : ''}`} onClick={() => setCategory(name)}>
                    {name} <span>{count}</span>
                  </button>
                ))}
              </div>
            )}

            {allPlatforms.length > 0 && (
              <div className="filter-group">
                <span className="field-label">{kindTab === 'model' ? t('Kompatibilitás') : kindTab === 'plugin' ? t('Szerverszoftver') : 'Platform'}</span>
                {allPlatforms.map((pl) => (
                  <label className="filter-check" key={pl}>
                    <input
                      type="checkbox"
                      checked={platforms.includes(pl)}
                      onChange={(e) => setPlatforms((prev) => (e.target.checked ? [...prev, pl] : prev.filter((x) => x !== pl)))}
                    />
                    <span>{pl}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="filter-group">
              <span className="field-label">{t('Ár')}</span>
              <div className="segmented">
                {(['all', 'paid', 'free'] as const).map((key) => (
                  <button type="button" key={key} className={price === key ? 'is-active' : ''} onClick={() => setPrice(key)}>
                    {key === 'all' ? t('Mind') : key === 'paid' ? t('Fizetős') : t('Ingyenes')}
                  </button>
                ))}
              </div>
              <label className="filter-check">
                <input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} />
                <span>{t('Csak akciós')}</span>
              </label>
            </div>

            {filtersActive && (
              <button type="button" className="btn-ghost btn-tiny" onClick={() => { setQuery(''); setCategory(''); setPlatforms([]); setOnlySale(false); setPrice('all'); }}>
                <Icon name="x" size={13} />{' '}{t('Szűrők törlése')}</button>
            )}
          </aside>

          <section className="foundry-results">
            <div className="foundry-toolbar">
              <span className="muted small">{products ? `${visible.length} ${noun}` : t('Betöltés...')}</span>
              <label className="sort-select">
                <span className="small muted">{t('Rendezés')}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
            </div>

            {error && <p className="error-text">{error}</p>}
            {!products && !error && (
              <div className="product-grid">
                {[0, 1, 2].map((n) => (
                  <div className="product-card" key={n}><Skeleton width={64} height={64} /><Skeleton width="70%" style={{ marginTop: 14 }} /><Skeleton width="90%" style={{ marginTop: 10 }} /></div>
                ))}
              </div>
            )}
            {products && visible.length === 0 && (
              <div className="card store-empty">
                <Icon name={kindTab === 'model' ? 'cube' : 'package'} size={30} />
                <h3>{all.length === 0 ? (kindTab === 'model' ? t('Hamarosan érkeznek az első modellek') : kindTab === 'plugin' ? t('Hamarosan érkeznek az első pluginok') : t('Hamarosan érkeznek az első termékek')) : t('Nincs a szűrésnek megfelelő {0}', noun)}</h3>
                <p className="muted">{all.length === 0 ? t('Nézz vissza később, vagy addig próbáld ki az Avenge PC Check előfizetést.') : t('Próbálj kevesebb szűrőt.')}</p>
              </div>
            )}
            <div className="product-grid">
              {visible.map((p, i) => <ProductCard key={p.id} product={p} currency={currency} index={i} />)}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
