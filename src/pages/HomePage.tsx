import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon, type IconName } from '../components/Icon';
import { CountUp, Reveal } from '../components/motion';
import { RadarScope } from '../components/RadarScope';
import avengeLogo from '../assets/avenge-logo-crop.png';

const SOURCES = [
  'Prefetch', 'BAM', 'UserAssist', 'MuiCache', 'PCA', 'AppSwitched', 'Letöltési előzmények', 'Lomtár',
  'Microsoft Defender', 'Authenticode', 'PE-elemzés', 'JAR-elemzés', 'AutoHotkey', 'Futó folyamatok',
  'Minecraft mods', 'Egérprogramok', 'Makrók', 'Registry', 'VPN / proxy', 'Virtuális gép'
];

const STATS: { value: number; label: string; note: string }[] = [
  { value: 11, label: 'detektor', note: 'minden vizsgálatban lefut' },
  { value: 7, label: 'futtatási nyomforrás', note: 'a törölt programok is látszanak' },
  { value: 30, label: 'nap visszamenőleg', note: 'a futtatási előzményekben' },
  { value: 1, label: 'exe', note: 'nem kell telepíteni' }
];

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'key',
    title: 'Kódot generálsz',
    text: 'A Panelen egy kattintással kapsz egy 6 számjegyű session kódot és egy letöltő linket a játékosnak.'
  },
  {
    icon: 'download',
    title: 'A játékos elindítja',
    text: 'Letölti az Avenge-et a linkről, beírja a kódot. Más nem tud letölteni: a link csak érvényes kóddal működik.'
  },
  {
    icon: 'radar',
    title: 'Elvégzi a vizsgálatot',
    text: 'A haladást élőben látod a Panelen: a kliens átnézi a gyanús fájlokat, a futtatási előzményeket és a törölt fájlok nyomait.'
  },
  {
    icon: 'fingerprint',
    title: 'Megkapod a verdiktet',
    text: 'Aláírt eredmény érkezik vissza: minden találat forrással, elérési úttal és indoklással.'
  }
];

const CAPABILITIES: { icon: IconName; title: string; text: string; size: 'wide' | 'tall' | 'std'; fx: string }[] = [
  {
    icon: 'drive',
    title: 'Átnevezve is lebukik',
    text: 'Nem csak a fájlnév számít: a gyanús programokat a tartalmuk alapján is ellenőrzi, így egy átnevezett csalóprogram vagy autoclicker is lebukik.',
    size: 'wide',
    fx: 'rows'
  },
  {
    icon: 'history',
    title: 'Törölted? Akkor is látszik.',
    text: 'Prefetch, BAM, UserAssist, MuiCache és PCA: ami futott a gépen, nyomot hagyott. Azt is megmutatja, ami már nincs a lemezen.',
    size: 'tall',
    fx: 'pulse'
  },
  {
    icon: 'cpu',
    title: 'Fájlelemzés',
    text: 'Exe, DLL és JAR: injektálási képességek, packerek, aláírás, modul- és osztálynevek.',
    size: 'std',
    fx: 'hex'
  },
  {
    icon: 'shield',
    title: 'Defender-nyomok',
    text: 'A Windows korábbi észlelései és a gyanús kivételek is a jelentésbe kerülnek.',
    size: 'std',
    fx: 'none'
  },
  {
    icon: 'activity',
    title: 'Egérprogramok és makrók',
    text: 'Több mint 600 egérprogramot ismer fel. Megmutatja a profilokat és a makrókat, és azt is, mi változott bennük: melyik mentés mikor történt, mit töröltek, melyik profil lett aktív a vizsgálat előtt.',
    size: 'wide',
    fx: 'rows'
  },
  {
    icon: 'alert',
    title: 'Nyomeltüntetés',
    text: 'Naplótörlés, Prefetch-takarítás, frissen ürített lomtár: a takarítás maga is találat.',
    size: 'std',
    fx: 'none'
  },
  {
    icon: 'gamepad',
    title: 'Minecraft és más játékok',
    text: 'Modok, verziók, másodfiókok, X-ray csomagok, és a többi játékhoz való csalóprogramok ismert nyomai.',
    size: 'std',
    fx: 'none'
  },
  {
    icon: 'lock',
    title: 'Manipulálhatatlan eredmény',
    text: 'A kliens aláírja a beküldött eredményt és ellenőrzi a szerver tanúsítványát, így útközben nem lehet átírni. A frissítéseket is csak aláírva fogadja el.',
    size: 'wide',
    fx: 'none'
  }
];

const VERDICTS: { key: string; label: string; text: string }[] = [
  { key: 'legit', label: 'LEGIT', text: 'Nincs komoly találat. A kisebb, tájékoztató jelzéseket ettől még látod.' },
  { key: 'inconclusive', label: 'NEM EGYÉRTELMŰ', text: 'Közepes súlyú találat: a döntés a tiéd, a részletek segítenek benne.' },
  { key: 'unlegit', label: 'UNLEGIT', text: 'Magas vagy kritikus súlyú találat, vagy kitiltott gépről érkezett a vizsgálat.' }
];

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-logo stagger-in" style={{ animationDelay: '60ms' }}>
            <img src={avengeLogo} alt="Avenge" />
            <span className="hero-logo-glint" style={{ maskImage: `url(${avengeLogo})`, WebkitMaskImage: `url(${avengeLogo})` }} aria-hidden="true" />
          </div>
          <h1 className="hero-title">
            <span className="line-mask"><span style={{ animationDelay: '140ms' }}>Minden csalás</span></span>
            <span className="line-mask"><span style={{ animationDelay: '240ms' }}><em>nyomot</em> hagy.</span></span>
          </h1>
          <p className="hero-sub stagger-in" style={{ animationDelay: '380ms' }}>
            Az Avenge megkeresi a csalások nyomait: a gyanús fájlokat, a futtatási előzményeket és a törölt
            programokat. Az eredményt élőben, részletesen a staff elé teszi.
          </p>
          <div className="hero-actions stagger-in" style={{ animationDelay: '480ms' }}>
            <Link to={isAuthenticated ? '/panel' : '/login'} className="btn-primary btn-large">
              {isAuthenticated ? 'Panel megnyitása' : 'Belépés'} <Icon name="arrow-right" size={18} className="btn-arrow" />
            </Link>
            <a href="#hogyan" className="btn-secondary btn-large">Hogyan működik?</a>
          </div>
          <p className="hero-note stagger-in" style={{ animationDelay: '580ms' }}>
            <Icon name="lock" size={14} />
            <span>
              Saját szervered van? <Link to="/elofizetes" className="text-link">Havi előfizetéssel</Link> te is használhatod.
              Pluginokat és modelleket a <Link to="/store" className="text-link">Foundry</Link> áruházban találsz.
            </span>
          </p>
        </div>

        <div className="hero-scope stagger-in" style={{ animationDelay: '260ms' }}>
          <RadarScope />
          <span className="scope-corner scope-corner-a" aria-hidden="true" />
          <span className="scope-corner scope-corner-b" aria-hidden="true" />
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...SOURCES, ...SOURCES].map((source, i) => (
            <span key={i}>{source}</span>
          ))}
        </div>
      </div>

      <section className="stats-band">
        {STATS.map((stat, i) => (
          <Reveal className="stat" key={stat.label} delay={i * 90}>
            <strong><CountUp value={stat.value} duration={1200} /></strong>
            <span className="stat-label">{stat.label}</span>
            <span className="stat-note">{stat.note}</span>
          </Reveal>
        ))}
      </section>

      <section className="steps" id="hogyan">
        <Reveal className="section-head">
          <span className="eyebrow">Folyamat</span>
          <h2>Négy lépés a verdiktig</h2>
        </Reveal>
        <div className="steps-rail">
          <span className="steps-beam" aria-hidden="true" />
          {STEPS.map((step, i) => (
            <Reveal className="step" key={step.title} delay={i * 120}>
              <span className="step-node"><Icon name={step.icon} size={22} /></span>
              <span className="step-index">0{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="capabilities">
        <Reveal className="section-head">
          <span className="eyebrow">Mit néz át</span>
          <h2>Ott is keres, ahol nem számítanak rá</h2>
        </Reveal>
        <div className="bento">
          {CAPABILITIES.map((item, i) => (
            <Reveal className={`card spot bento-card bento-${item.size}`} key={item.title} delay={(i % 3) * 90}>
              {item.fx !== 'none' && <span className={`bento-fx bento-fx-${item.fx}`} aria-hidden="true" />}
              <span className="bento-icon"><Icon name={item.icon} size={22} /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="verdicts">
        <Reveal className="section-head">
          <span className="eyebrow">Eredmény</span>
          <h2>Három verdikt, világos szabályokkal</h2>
        </Reveal>
        <div className="verdict-row">
          {VERDICTS.map((verdict, i) => (
            <Reveal className={`card spot verdict-tile verdict-tile-${verdict.key}`} key={verdict.key} delay={i * 110}>
              <span className="verdict-tile-label">{verdict.label}</span>
              <p>{verdict.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="closing">
        <Reveal className="closing-inner">
          <h2>{isAuthenticated ? 'Készen állsz a következő vizsgálatra?' : 'Használd a saját szervereden'}</h2>
          <p>
            {isAuthenticated
              ? 'Generálj egy kódot, és a játékos pár kattintással elindíthatja a vizsgálatot.'
              : 'Havi előfizetéssel saját SS panelt kapsz a csapatodnak. Ha már van fiókod, itt tudsz belépni.'}
          </p>
          <div className="closing-actions">
            <Link to={isAuthenticated ? '/panel' : '/elofizetes'} className="btn-primary btn-large">
              {isAuthenticated ? 'Kód generálása' : 'Előfizetés'} <Icon name="arrow-right" size={18} className="btn-arrow" />
            </Link>
            {!isAuthenticated && <Link to="/login" className="btn-secondary btn-large">Belépés</Link>}
          </div>
        </Reveal>
      </section>
    </main>
  );
}
