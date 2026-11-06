import { Reveal } from '../components/motion';

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.2.0',
    date: '2026-11-06',
    items: [
      'Egérprogramok: gombonként látszik, mire van kiosztva, és pontosan mi változott: melyik gombra melyik makró került, melyik makró melyik lépése íródott át, melyik profil lett aktív.',
      'A korábbi állapotokat a program saját mentéseiből (SQLite WAL, biztonsági másolatok) és a Windows visszaállítási pontjaiból állítja vissza.',
      'Minden változásnál látszik, mennyire biztos az ideje: másodpercre pontos, időablak, vagy legkésőbb egy adott pillanatig.',
      'Minden találat saját idővonalat kapott: létrehozás, letöltés forrása, indítások, átnevezés (a régi névvel), törlés, Defender-észlelés - másodpercre.',
      'Új, közös idővonal az eredményoldalon, szűrhető indításokra, fájlműveletekre, törlésekre és egérváltozásokra.'
    ]
  },
  {
    version: '2.1.0',
    date: '2026-11-04',
    items: [
      'Egérprogramok felismerése: több mint 600 gyártói program és makróeszköz, az ismeretleneket általános szabályok fogják meg.',
      'Látszanak a profilok, az aktív profil és a makrók, a gyors kattintást és a visszarúgás-kompenzációt külön jelzi.',
      'Idővonal arról, mi változott az egérprogramban: mentések, törölt makrók, profilváltások a program naplójából.',
      'Összevetés ugyanennek a gépnek az előző vizsgálatával: mi tűnt el, és melyik profil lett aktív.',
      'Látszik a csatlakoztatott egér valódi neve is.'
    ]
  },
  {
    version: '2.0.0',
    date: '2026-11-03',
    items: [
      'Teljes gép vizsgálata: az NTFS fájltáblából minden meghajtó minden fájlja látszik, a gyanús fájlok tartalmát is ellenőrzi.',
      'Új futtatási előzmények: Prefetch, BAM, UserAssist, MuiCache és PCA. A már törölt programok is lebuknak.',
      'Új Defender-vizsgálat: korábbi észlelések és gyanús kivételek.',
      'Az exe a saját szerverünkről frissül, és csak aláírt frissítést fogad el.',
      'Letölteni csak regisztrált fiókkal vagy érvényes session kóddal lehet.',
      'Jelszó módosítása a Fiók oldalon, véletlen jelszó generálása fiók létrehozásakor.',
      'Teljesen új megjelenés a weboldalon és az exében.'
    ]
  },
  {
    version: '1.3.0',
    date: '2026-09-02',
    items: [
      'Rendszerszintű vizsgálat: Prefetch, Temp mappák és Legutóbbi elemek is a scan részévé váltak.',
      'A kliens alapértelmezetten rendszergazdai jogosultsággal indul, hogy a fenti helyekhez is hozzáférjen.',
      'Elkészült a Főoldal, a Fiók és az Újdonságok oldal a Panelen.'
    ]
  },
  {
    version: '1.2.0',
    date: '2026-08-28',
    items: [
      'Kibővített Minecraft-detekció: Doomsday, Meteor Client, LiquidBounce, Kami Blue és további ismert clientek.',
      'AutoClicker, Macro és TimerClicker/AutoHotKey minták detektálása.',
      'A telepített verziók (versions mappa) és az Asztal/Letöltések mappa is a vizsgálat része lett.'
    ]
  },
  {
    version: '1.1.0',
    date: '2026-08-20',
    items: [
      'Élő állapotfrissítések a Panelen (SignalR) - a kódgenerálástól az eredményig nincs szükség oldalfrissítésre.',
      'Az eredményoldalon megjelenik a LEGIT/UNLEGIT verdikt és a vissza-navigáció a Panelre.',
      'A generált kód automatikusan vágólapra kerül.'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-08-10',
    items: [
      'Az Avenge első kiadása: kódalapú munkamenet-generálás, kliens letöltés, alap Minecraft- és futófolyamat-vizsgálat.'
    ]
  }
];

export function ChangelogsPage() {
  return (
    <main className="page page-narrow">
      <header className="page-head stagger-in">
        <span className="eyebrow">Verziók</span>
        <h1>Újdonságok</h1>
        <p className="muted">Amin dolgoztunk, verziónként.</p>
      </header>

      <div className="timeline">
        <span className="timeline-beam" aria-hidden="true" />
        {CHANGELOG.map((entry, index) => (
          <Reveal className={`timeline-entry ${index === 0 ? 'timeline-entry-latest' : ''}`} key={entry.version} delay={index * 60}>
            <span className="timeline-node" aria-hidden="true" />
            <div className="card timeline-card spot">
              <div className="timeline-head">
                <span className="timeline-version">v{entry.version}</span>
                <span className="muted small">{entry.date}</span>
              </div>
              <ul>
                {entry.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
