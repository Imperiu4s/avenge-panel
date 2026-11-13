import { Reveal } from '../components/motion';

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.9.0',
    date: '2026-11-13',
    items: [
      'Fizetés a Tebexben létrehozott csomagokkal: az előfizetés és a pluginok a Tebex saját csomagjain keresztül vásárolhatók, az árat a rendszer a Tebexből veszi át.',
      'Akciók Tebex-kuponnal: a kuponkód automatikusan a kosárra kerül.',
      'Tebex-kapcsolat tesztelése és az utolsó Tebex-hiba az Áruház adminban.'
    ]
  },
  {
    version: '2.8.1',
    date: '2026-11-13',
    items: [
      'Admin Panel / Discord: az Avenge Discord-botja a szerverről működik, a tokenje csak ott tárolódik.',
      'Egy gombnyomással berendezi a Discord szervert (rangok, csatornák, fórumok, jogosultságok, üdvözlő képernyő), és kirakja az info-üzeneteket.'
    ]
  },
  {
    version: '2.8.0',
    date: '2026-11-13',
    items: [
      'Számlák a vásárlói fiókban: minden plugin-vásárlásról, előfizetési díjról és visszatérítésről automatikusan PDF bizonylat készül, ami bármikor újra letölthető és soha nem törlődik.',
      'Visszatérítés az Admin Panel Áruház fülén: a fizetéstől számított 14 napon belül egy kattintással visszaküldhető a teljes összeg; a plugin joga vagy az előfizetés azonnal megszűnik, és visszatérítési bizonylat készül.',
      'Az adminok minden bizonylatot látnak és letölthetnek (keresés bizonylatszámra, e-mail címre, tranzakcióra), a vásárló adatlapján is.',
      'Az oldal kódja kommentek nélkül, tömörítve kerül ki; a fejlesztői eszközök és a forrásnézet megnyitása le van tiltva.'
    ]
  },
  {
    version: '2.7.0',
    date: '2026-11-13',
    items: [
      'Új: Avenge Foundry - az Avenge plugin-műhelye. Az avenge.hu/store oldalon saját fejlesztésű Minecraft pluginok vásárolhatók, verziókkal, változásnaplóval, képekkel és azonnali letöltéssel.',
      'Vásárlói fiók e-mail címmel és jelszóval: a megvett pluginok és minden frissítésük a fiókban tölthetők le. Fizetés a Tebexen keresztül.',
      'Az SS tool havi előfizetéssel is elérhető: az előfizető saját szervezetet és Admin fiókot kap, lemondás után a kifizetett hónap végéig él.',
      'Akciók (pl. Black Friday) egy pluginra vagy az összesre, időzítve; vásárlók kitiltása, törlése, plugin vagy előfizetési napok ajándékozása az Admin Panel Áruház fülén.',
      'Jogi oldalak: ÁSZF, adatkezelési tájékoztató, visszatérítési szabályzat, licencfeltételek, süti tájékoztató és impresszum.'
    ]
  },
  {
    version: '2.6.0',
    date: '2026-11-07',
    items: [
      'Makrók pontosan: minden makró lépésenként (melyik gomb le/fel, várakozás ms-ban, billentyű, egérmozgatás), a számolt kattintás/másodperccel, a két kattintás közti legrövidebb idővel és az ismétlési móddal (egyszer, amíg nyomva, toggle, N-szer).',
      'Minden makrónál látszik, melyik gombra és melyik profilban van kiosztva; a gombkiosztásban a makróra állított gombok külön jelölést kapnak.',
      'Az egér beállításai pontos értékkel: DPI-fokozatok, polling, debounce, LOD, szögkorrekció, motion sync, gyors-tüzelés. A 0-2 ms-os debounce (dupla kattintásra alkalmas) kiemelve.',
      'Új: az ATK Hub, VXE és a többi Electron-alapú egérprogram adatai (eszközök, makrók neve, típusa, ismétlése) is kiolvashatók.',
      'AutoHotkey-szkriptek gyorsbillentyűnként: melyik gombra mi fut le, Sleep-értékek, ciklusok és a kattintási ütem; az autoclicker-programok saját beállításai (kattintási időköz, CPS).'
    ]
  },
  {
    version: '2.5.0',
    date: '2026-11-07',
    items: [
      'Önmegsemmisítés ("self destruct") után is: a törölt jar-t visszaolvassa a lemezről (NTFS fájltábla) és a Windows visszaállítási pontjaiból, és ujjlenyomattal azonosítja.',
      'Felismeri a DoomsDay önmegsemmisítésének mintáját (a jar törlése és a helyén azonnal létrehozott, majd törölt mappa). Ha a Java futtatta is, ez már kritikus találat.',
      'A futó Minecraft memóriájában is megtalálja a DoomsDay betöltőjét, akkor is, ha a csalást kikapcsolták és a fájlját törölték.',
      'A takarítás nyomai: tömegesen törölt vagy hiányzó Prefetch, újra létrehozott NTFS-napló, törölt eseménynapló, tömegesen törölt Legutóbbi elemek és ugrólisták.',
      'Amit a takarítás ritkán ér el: a megnyitott jar-ok listája, az Explorer ugrólistái, a böngészők letöltései (csak csaló-oldalakra szűrve) és a DNS-gyorsítótár.'
    ]
  },
  {
    version: '2.4.0',
    date: '2026-11-07',
    items: [
      'DoomsDay felismerése akkor is, ha a fájl neve és mérete minden letöltésnél más: a jar belső szerkezete, a titkosított betöltő és a visszafejtő rutin bájtkódja alapján.',
      'Kiterjesztéstől függetlenül: egy .txt-re vagy .dat-ra átnevezett jar is lebukik a Letöltések, az Asztal, a Temp és a .minecraft mappákban.',
      'Letöltési forrás: ha egy fájlt a DoomsDay oldaláról töltöttek le, az magában is jelzés.',
      'Futó Minecraft: jelzi, ha menet közben Java-ügynököt töltöttek bele (injektálás), és ellenőrzi a -jar / -javaagent argumentumokat és a launcherek indítási beállításait.',
      'Törölt nyomok: a Java által futtatott, azóta törölt, véletlen nevű jar-ok a Prefetch és az NTFS-napló alapján.'
    ]
  },
  {
    version: '2.3.0',
    date: '2026-11-07',
    items: [
      'Új „Mire jelzett” blokk az eredmény tetején: a vizsgálat legerősebb találata (csalás vagy autoclicker), a nevével, a helyével, az okával és az idejével.',
      'Megosztó link: bárki megnyithatja bejelentkezés nélkül, 3 napig érvényes, és bármikor visszavonható.',
      'Az Admin Panel fülekre bontva: áttekintés napi grafikonnal, összes vizsgálat kereséssel és törléssel, előzmények tömeges törlése, beállítások, tevékenységnapló.',
      'Új beállítások: a kód érvényessége, a vizsgálatok automatikus törlése, a megosztás és a törlés joga, és hogy a Staff csak a saját vizsgálatait lássa.',
      'Felhasználónként: előzmények törlése és kijelentkeztetés minden eszközön.'
    ]
  },
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
      'Alaposabb fájlellenőrzés: a gyanús fájlok tartalmát is ellenőrzi, így az átnevezett csalóprogramok is lebuknak.',
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
