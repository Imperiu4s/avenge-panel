import { Layout } from '../components/Layout';

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2026-09-02',
    items: [
      'Rendszerszintű vizsgálat: Prefetch, Temp mappák és Legutóbbi elemek is a scan részévé váltak.',
      'A kliens alapértelmezetten rendszergazdai jogosultsággal indul, hogy a fenti helyekhez is hozzáférjen.',
      'Elkészült a Home, Account és Changelogs oldal a Panelen.'
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
      'A Scan Result oldalon megjelenik a LEGIT/UNLEGIT verdikt és a vissza-navigáció a Panelre.',
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
    <Layout>
      <h1 className="page-title">Changelogs</h1>
      <p className="page-subtitle">Amin dolgoztunk, verziónként.</p>

      <div className="changelog-list">
        {CHANGELOG.map((entry) => (
          <div className="card changelog-entry" key={entry.version}>
            <div className="changelog-entry-header">
              <span className="changelog-version">v{entry.version}</span>
              <span className="muted small">{entry.date}</span>
            </div>
            <ul>
              {entry.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Layout>
  );
}
