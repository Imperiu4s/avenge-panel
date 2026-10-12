import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Icon, type IconName } from '../components/Icon';
import { useAuth } from '../auth/AuthContext';
import { CountUp, Reveal, useInView } from '../components/motion';
import avengeLogo from '../assets/avenge-logo.png';

interface Tier {
  key: 'basic' | 'lifetime' | 'network';
  label: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  highlighted?: boolean;
}

const TIERS: Tier[] = [
  {
    key: 'basic',
    label: 'Basic',
    priceMonthly: 10,
    priceAnnual: 96,
    features: ['1 License', '100% Detects Cheats', '2000+ Strings', 'Monthly / Annual']
  },
  {
    key: 'lifetime',
    label: 'Lifetime',
    priceMonthly: 24,
    priceAnnual: 24,
    features: ['1 License', '100% Detects cheats', '2000+ Strings', 'Lifetime'],
    highlighted: true
  },
  {
    key: 'network',
    label: 'Network',
    priceMonthly: 85,
    priceAnnual: 816,
    features: ['20 Licenses', '100% Detects Cheats', '2000+ Strings', '24/7 Support', 'Annual']
  }
];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'rocket',
    title: 'Easy to use',
    text: "Our tool is very simple to use, it is very intuitive and can help you in many situations in which you don't have time and are in a hurry. Anyway you can find tutorials by clicking here."
  },
  {
    icon: 'bolt',
    title: 'Speed',
    text: 'We use a method to maximize scanning speed without compromising results.'
  },
  {
    icon: 'layers',
    title: 'Two type of scans',
    text: 'As opposed to others, our tool uses a normal string-scan and another deeper scan, with which it is able to find most of the clients around.'
  },
  {
    icon: 'shield',
    title: 'Protection',
    text: 'Our team uses a unique protection system that makes the tool as safe and efficient as possible.'
  },
  {
    icon: 'headset',
    title: 'Support',
    text: 'We are active 24/7 to give support to the most dubious users.'
  },
  {
    icon: 'key',
    title: 'Authenticate',
    text: "Our auth system is one of the best around, you will be safe in every situations and your informations as passwords and emails won't be published."
  }
];

const CHART_POINTS = [
  600, 700, 900, 3200, 9800, 6800, 2400, 900, 744, 900, 1400, 2000, 2900, 2600, 2100, 2700, 3300
];

const CHART_LABELS = [
  '01 July 2020', '02 July 2020', '03 July 2020', '04 July 2020',
  '05 July 2020', '06 July 2020', '07 July 2020', '08 July 2020'
];

const STATS: { value: number; suffix: string; label: string }[] = [
  { value: 666, suffix: '+', label: 'Users' },
  { value: 800, suffix: '+', label: 'Detected cheats' },
  { value: 72, suffix: '', label: 'Total lifetime license' },
  { value: 18, suffix: '+', label: 'Total enterprise licenses' }
];

function buildLinePath(points: number[], width: number, height: number, max: number): string {
  const stepX = width / (points.length - 1);
  return points
    .map((value, i) => {
      const x = i * stepX;
      const y = height - (value / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function HomePage() {
  const { isAdmin } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [toast, setToast] = useState<string | null>(null);
  const { ref: chartRef, inView: chartInView } = useInView<HTMLDivElement>();

  const showComingSoon = (tier: string) => {
    setToast(`A(z) "${tier}" csomag fizetése hamarosan elérhető lesz.`);
    window.clearTimeout((showComingSoon as unknown as { t?: number }).t);
    const t = window.setTimeout(() => setToast(null), 3000);
    (showComingSoon as unknown as { t?: number }).t = t;
  };

  const chartWidth = 900;
  const chartHeight = 260;
  const chartMax = 12000;
  const linePath = buildLinePath(CHART_POINTS, chartWidth, chartHeight, chartMax);
  const areaPath = `${linePath} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;

  return (
    <Layout fullBleed>
      <main className="home-page">
        {/* Hero */}
        <section className="home-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-logo-wrap stagger-in" style={{ animationDelay: '0ms' }}>
            <img src={avengeLogo} alt="Avenge" className="hero-logo" />
          </div>
          <p className="hero-quote stagger-in" style={{ animationDelay: '120ms' }}>
            "THE BEST WAY TO AVENGE YOUR ENEMIES."
          </p>
          <div className="hero-actions stagger-in" style={{ animationDelay: '220ms' }}>
            <a href="#plans" className="btn-primary hero-btn">
              Get started <span className="btn-arrow">→</span>
            </a>
            <a href="#features" className="btn-secondary hero-btn-secondary">Learn more</a>
          </div>

          {isAdmin && (
            <Link to="/admin" className="admin-cta-link stagger-in" style={{ animationDelay: '320ms' }}>
              <Icon name="shield" size={16} /> Admin panel megnyitása
            </Link>
          )}

          <div className="mini-pricing-row">
            {TIERS.map((tier, i) => (
              <div className="mini-pricing-card hover-lift stagger-in" key={tier.key} style={{ animationDelay: `${380 + i * 110}ms` }}>
                <span className="mini-pricing-badge">
                  €{tier.key === 'basic' ? `${tier.priceMonthly}/mo` : tier.priceMonthly}
                </span>
                <h3>{tier.label}</h3>
                <p className="muted">
                  {tier.key === 'basic' &&
                    `Buy a Basic license for ${tier.priceMonthly}€ and start detecting more than 800+ hacked clients, clickers etc.`}
                  {tier.key === 'lifetime' &&
                    `Buy a lifetime license for ${tier.priceMonthly}€ you don't even need to update the payment. Are you ready?`}
                  {tier.key === 'network' &&
                    'Are you owning a minecraft server and do you want to make your staff members unbypassable? Buy an enterprise license for year.'}
                </p>
                <button className="mini-pricing-link" onClick={() => showComingSoon(tier.label)}>
                  {tier.key === 'basic' ? 'Swipe' : 'Buy now'} →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section className="home-analytics">
          <Reveal>
            <h2>Analytics</h2>
            <p className="muted">Down below you can find all the stats and goals reached.</p>
          </Reveal>

          <Reveal className="stats-strip" delay={100}>
            {STATS.map((stat) => (
              <div className="stat-cell" key={stat.label}>
                <strong><CountUp value={stat.value} suffix={stat.suffix} /></strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </Reveal>

          <div className={`chart-wrap ${chartInView ? 'chart-drawn' : ''}`} ref={chartRef}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} className="area-chart" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--avenge-red)" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="var(--avenge-red)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <line
                  key={f}
                  x1={0}
                  x2={chartWidth}
                  y1={chartHeight * f}
                  y2={chartHeight * f}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              ))}
              <path d={areaPath} fill="url(#chartFill)" className="chart-area" />
              <path
                d={linePath}
                fill="none"
                stroke="var(--avenge-red)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                pathLength={1}
                className="chart-line"
              />
            </svg>
            <div className="chart-y-labels">
              {[12000, 9000, 6000, 3000, 0].map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <div className="chart-x-labels">
              {CHART_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="home-features" id="features">
          <Reveal as="p" className="eyebrow">OUR FEATURES</Reveal>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Reveal className="feature-card" key={f.title} delay={(i % 3) * 120} variant="scale">
                <span className="feature-icon"><Icon name={f.icon} size={26} /></span>
                <h3>{f.title}</h3>
                <p className="muted">{f.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section className="home-plans" id="plans">
          <svg className="plans-wave" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
            <path className="plans-wave-path" d="M0,60 C300,0 900,0 1200,60 L1200,0 L0,0 Z" />
          </svg>
          <div className="plans-orb plans-orb-a" aria-hidden="true" />
          <div className="plans-orb plans-orb-b" aria-hidden="true" />
          <Reveal>
            <h2>Plans</h2>
            <p className="plans-subtitle">Choose a plan to start.</p>
          </Reveal>

          <Reveal className="billing-toggle" delay={80}>
            <span className={billing === 'monthly' ? 'toggle-active' : ''}>Monthly</span>
            <button
              className={`toggle-switch ${billing === 'annual' ? 'toggle-switch-on' : ''}`}
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              aria-label="Számlázási gyakoriság váltása"
            >
              <span className="toggle-knob" />
            </button>
            <span className={billing === 'annual' ? 'toggle-active' : ''}>Annual</span>
          </Reveal>

          <div className="plans-grid">
            {TIERS.map((tier, i) => {
              const price = tier.key === 'lifetime' ? tier.priceMonthly : billing === 'monthly' ? tier.priceMonthly : tier.priceAnnual;
              return (
              <Reveal
                className={`plan-card hover-lift ${tier.highlighted ? 'plan-card-highlight' : ''}`}
                key={tier.key}
                delay={i * 130}
              >
                <span className="plan-badge">{tier.label.toUpperCase()}</span>
                <div className="plan-price">
                  <span className="plan-price-currency">€</span>
                  {/* A key cseréje újrajátssza a "flip" animációt minden
                      havi/éves váltásnál. */}
                  <span className="plan-price-value" key={`${tier.key}-${price}`}>{price}</span>
                </div>
                <ul className="plan-features">
                  {tier.features.map((feature, fi) => (
                    <li key={feature} style={{ animationDelay: `${i * 130 + 250 + fi * 70}ms` }}>
                      <span className="check-dot">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={tier.highlighted ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => showComingSoon(tier.label)}
                >
                  <Icon name="cart" size={18} /> Buy now
                </button>
              </Reveal>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="home-footer-cta">
          <Reveal className="footer-cta-row">
            <div>
              <h3>Ready to get started?</h3>
              <p className="muted">Contact us or press the red button and start the experience.</p>
            </div>
            <div className="footer-cta-actions">
              <a href="#" className="btn-secondary" onClick={(e) => e.preventDefault()}>Contact us</a>
              <a href="#plans" className="btn-primary">Get started</a>
            </div>
          </Reveal>
          <p className="footer-legal muted small">
            ©2026 This page is protected by reCAPTCHA and is subject to the Google{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a> and our{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>.
          </p>
        </section>

        {toast && <div className="home-toast">{toast}</div>}
      </main>
    </Layout>
  );
}
