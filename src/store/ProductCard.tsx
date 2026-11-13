import { Link } from 'react-router-dom';
import { storeAssetUrl, type StoreProductCard } from '../api/store';
import { Icon } from '../components/Icon';
import { formatPrice } from './format';

export function ProductIcon({ name, iconAssetId, size = 64 }: { name: string; iconAssetId: string | null; size?: number }) {
  if (iconAssetId) {
    return <img className="product-icon" src={storeAssetUrl(iconAssetId)} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  }
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className="product-icon product-icon-fallback" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">{initials}</span>;
}

export function PriceTag({ price, listPrice, currency, discountPercent, large = false }: {
  price: number; listPrice: number; currency: string; discountPercent: number; large?: boolean;
}) {
  return (
    <span className={`price-tag ${large ? 'price-tag-large' : ''}`}>
      {discountPercent > 0 && <s className="price-list">{formatPrice(listPrice, currency)}</s>}
      <strong className={price === 0 ? 'price-free' : ''}>{formatPrice(price, currency)}</strong>
    </span>
  );
}

export function ProductCard({ product, currency, index = 0 }: { product: StoreProductCard; currency: string; index?: number }) {
  return (
    <Link to={`/store/${product.slug}`} className="product-card spot stagger-in" style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}>
      {product.discountPercent > 0 && (
        <span className="product-ribbon" title={product.discountName ?? undefined}>−{product.discountPercent}%</span>
      )}
      <div className="product-card-head">
        <ProductIcon name={product.name} iconAssetId={product.iconAssetId} />
        <div className="product-card-title">
          <h3>{product.name}</h3>
          <span className="product-card-meta">
            {product.category && <span>{product.category}</span>}
            {product.latestVersion && <span className="mono">v{product.latestVersion}</span>}
          </span>
        </div>
      </div>
      <p className="product-card-tagline">{product.tagline || 'Minecraft plugin az Avenge csapatától.'}</p>
      <div className="product-chips">
        {product.supportedVersions && <span className="chip"><Icon name="layers" size={12} /> {product.supportedVersions}</span>}
        {product.platforms.slice(0, 3).map((p) => <span className="chip chip-dim" key={p}>{p}</span>)}
        {product.platforms.length > 3 && <span className="chip chip-dim">+{product.platforms.length - 3}</span>}
      </div>
      <div className="product-card-foot">
        <span className="product-card-stats">
          <span title="Vásárlások"><Icon name="cart" size={13} /> {product.salesCount}</span>
          <span title="Letöltések"><Icon name="download" size={13} /> {product.downloadCount}</span>
        </span>
        <PriceTag price={product.price} listPrice={product.listPrice} currency={currency} discountPercent={product.discountPercent} />
      </div>
      {product.isFeatured && <span className="product-featured"><Icon name="star" size={11} /> Kiemelt</span>}
    </Link>
  );
}
