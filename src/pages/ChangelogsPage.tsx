import { t } from '../i18n';
import { Reveal } from '../components/motion';

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.7.0',
    date: '2026-11-25',
    items: [
      t('Angol nyelv: az egész weboldal, az áruház és az Admin Panel is elérhető angolul. A nyelvet a menüben lehet váltani (HU / EN), alapból a böngésző nyelve szerint választ. A jogi dokumentumok angol fordítást kaptak, de a magyar változat az irányadó.'),
      t('Discord-összekapcsolás: a Fiókom oldalon összekapcsolhatod a Discord-fiókodat. Az Avenge bot az alkalmazásaid közé kerül, az Avenge Discordon pedig automatikusan megkapod az Előfizető vagy a Plugin vásárló szerepkört (lejáratkor, visszatérítéskor és leválasztáskor a bot leveszi).'),
      t('Minecraft-verzió értesítő: ha új Minecraft-verzió jelenik meg, a Discord-bot embedben szól egy beállítható (akár privát) csatornába, hogy frissítsd a pluginokat, és külön szól, amikor a Paper is támogatja. Beállítás: /mcertesito parancs vagy Admin Panel / Discord. A /mcverzio parancs bárhol megmutatja a legújabb verziókat.'),
      t('Az adatkezelési és a süti tájékoztató kiegészült a Discord-összekapcsolással és a nyelvválasztással.')
    ]
  },
  {
    version: '3.6.0',
    date: '2026-11-24',
    items: [
      t('Visszatérítés: a pluginok és a modellek a fizetéstől számított 3 napon belül téríthetők vissza, ha még nem töltötted le őket. A letöltést a rendszer rögzíti. Az ÁSZF és a visszatérítési szabályzat ennek megfelelően frissült.'),
      t('Admin Panel / Szervezetek: a szervezetek átnevezhetők és törölhetők, a tagjaik rangja és állapota módosítható, a plugin-kulcsaik visszavonhatók, és az előfizetésük napokkal meghosszabbítható.'),
      t('Ha egy előfizetés lejár (3 nap türelmi idővel), a szervezet egy nappal később minden adatával automatikusan törlődik; a vásárlói fiók törlésekor azonnal. A Szervezetek fülön látszik, melyik szervezet mikor törlődik.'),
      t('Admin Panel / Discord: a bottal bármelyik csatornába írhatsz sima szöveget vagy színes embedet mezőkkel, képpel és link-gombokkal, élő előnézettel. Az info-üzenetek szövegei és linkjei frissültek (PC Check, plugin, visszatérítés, ticketek).'),
      t('A vizsgálat eredményében látszik, mikor indult el a játékos Minecraftja (kliens és verzió), és a talált csalásnál az is, hogy ugyanabban a játékmenetben futott-e. Az idővonalon is megjelenik. Ehhez az Avenge program 2.8.0-s verziója kell.'),
      t('A ticketek törölhetők az Admin Panel Ticketek fülén.')
    ]
  },
  {
    version: '3.5.0',
    date: '2026-11-24',
    items: [
      t('Az Avenge SS új neve Avenge PC Check: a weboldalon, az áruházban, a pluginban, a Discord naplóban és a programban is.'),
      t('Admin Panel / Szervezetek: az összes szervezet egy helyen, az előfizetőkével együtt. Látszanak a tagok, a vizsgálatok az eredményekkel, az előfizetés, a plugin és a plugin-kulcsok, valamint a szervezet tevékenységnaplója. Csak megtekintés, és minden megnyitás naplózódik.'),
      t('A PC Check plugin az áruházban vásárolható meg: az előfizetők a Plugin fülön a letöltés helyett a Vásárlás gombot látják, és kulcsot is csak a vásárlás után hozhatnak létre.'),
      t('Letisztultabb témák: eltűnt a háttérben folyamatosan futó csík, a hóesés, a szirmok és a levelek a tartalom mögé kerültek és ritkábbak lettek, a díszek nem mozognak és nem takarják el a tartalmat.')
    ]
  },
  {
    version: '3.4.0',
    date: '2026-11-22',
    items: [
      t('Automatikus kitiltás: ha a játékos a /ss után 5 percen belül nem kezdi el a vizsgálatot, vagy közben bezárja a programot, a plugin a staff nevében lefuttatja a kitiltó parancsot (alapból /tempban <játékos> SS-megtagadása, LiteBans sablonnal). Egy perccel előtte a játékos figyelmeztetést kap. Az idő és a parancs a configban állítható.'),
      t('Discord napló: minden SS-esemény (indulás, elkezdte, eredmény, megtagadta, kitiltás, kilépés, vége) Discordra kerül. Az eredménynél látszik, hogy a játékos átment vagy megbukott, hány találata volt, mik a legfontosabbak, és ott a link az eredményhez.'),
      t('A napló az Avenge Discord szerverére mindig megy, a saját szerveredre pedig a plugin config webhook.url beállításával küldheted ugyanezt.'),
      t('Az adatkezelési tájékoztató kiegészült a Discord naplóval.')
    ]
  },
  {
    version: '3.3.0',
    date: '2026-11-22',
    items: [
      t('SS chat: SS alatt a játékos és a staff külön chatben beszél, amit csak ők látnak. A többi staff spy módban belelát, a játékos pedig nem látja a közös chatet.'),
      t('Erősebb befagyasztás: a játékos nem tud mozogni és forogni sem, és vakságot kap.'),
      t('Az akciósáv SS alatt végig látható, és felülírja a szerver többi akciósávos üzenetét.'),
      t('Az SS szerver és a fallback szerver használata kikapcsolható: ilyenkor a játékos ott marad, ahol van.'),
      t('A vizsgálati kód a chatben egy kattintással másolható.'),
      t('Ingame már csak az látszik, hogy a játékos elkezdte, befejezte vagy megtagadta a vizsgálatot. A részletek a panelen vannak.'),
      t('Ha a játékos vizsgálat közben bezárja az Avenge programot, a vizsgálat azonnal Megszakadt állapotba kerül, és a staff ingame is értesítést kap.')
    ]
  },
  {
    version: '3.2.0',
    date: '2026-11-22',
    items: [
      t('Avenge SS Velocity-plugin (Minecraft 1.19.4 - 1.21.x): a /ss paranccsal a játékos az SS szerverre kerül, befagyasztja, és címben, bossbaron, akciósávon és chatben kapja az utasításokat. Minden szöveg átírható a messages.yml-ben.'),
      t('A plugin automatikusan Avenge-kódot kér a játékosnak, és a staff élőben látja a chatben, mikor indul a vizsgálat, hol tart, és mi lett az eredmény.'),
      t('Ha a játékos SS közben kilép, a staff azonnal értesítést kap, és beállítható, milyen parancs fusson ilyenkor (pl. kitiltás).'),
      t('Admin Panel / Plugin: a plugin letöltése, telepítési útmutató és a plugin-kulcsok kezelése.')
    ]
  },
  {
    version: '3.1.0',
    date: '2026-11-14',
    items: [
      t('Ünnepi témák: Alap, Karácsonyi, Húsvéti és Halloween. Az Admin Panel Témák fülén egy kattintással mindenkinek átállítható, előnézettel.'),
      t('Karácsony: hóesés, hullócsillag, fényfüzér a menün, mikulássapka a logón, havas kártyák magyallal, cukorbot-csíkos gombok, fenyős-ajándékos lábléc.'),
      t('Húsvét: pasztell színek, hulló szirmok és pillangók, zászlófüzér, nyuszifül a logón, virágos kártyák, festett tojások és kikukucskáló nyuszi.'),
      t('Halloween: telihold és köd, denevérek, hulló falevelek, pókhálók és lógó pók, boszorkánykalap, világító tökök és sírkövek.'),
      t('Ticketrendszer a weboldalon: a Támogatás oldalon témát választva ticketet nyithatsz, képet csatolhatsz, és a staff ott válaszol. Új válasznál jelzést kapsz a fiókodban. Egyszerre egy nyitott ticket lehet, újat 3 naponta nyithatsz.'),
      t('Admin Panel / Ticketek: válaszadás, átvétel, lezárás és újranyitás, a vásárló adataival együtt.'),
      t('A Discord-bot folyamatosan online.'),
      t('Az előfizetés egy gombbal lemondható az Előfizetés és a Fiókom oldalon is.'),
      t('A regisztrációkor megadott Minecraft-név nem módosítható; elírás esetén az admin javítja.'),
      t('A fiókonkénti színtéma és a kitiltott gépek funkció megszűnt.')
    ]
  },
  {
    version: '3.0.0',
    date: '2026-11-13',
    items: [
      t('Új rangrendszer: Tulajdonos, Admin és Staff. A Tulajdonos az Admin Panel Rangok fülén jogonként állítja be, mit tehet az Admin és a Staff (vizsgálatok, törlés, megosztás, felhasználók, beállítások, napló, kitiltások, áruház, Discord, jogi oldalak).'),
      t('Minden szervezet legrégebbi adminja automatikusan Tulajdonos lett; Tulajdonos rangot csak Tulajdonos adhat, és Tulajdonos fiókját csak Tulajdonos módosíthatja.'),
      t('Modellek az áruházban: a pluginok mellett Minecraft modellek (ModelEngine, ItemsAdder, Oraxen, Nexo, Blockbench) is vásárolhatók, külön fülön és szűrővel.'),
      t('Profilkép és színtéma: a vásárlói és a staff fiókban is feltölthető profilkép, és hét színtéma közül választható.'),
      t('A regisztrációnál megadott név a Minecraft-neved: fizetéskor már nem kell újra beírni, és a Fiókom oldalon bármikor módosítható.'),
      t('Az Admin Panel fülei kiférnek: több sorba tördelődnek.')
    ]
  },
  {
    version: '2.9.3',
    date: '2026-11-13',
    items: [
      t('Admin Panel / Jogi: a szolgáltató, a viszonteladó (Tebex) és a tárhelyszolgáltatók adatai, valamint minden jogi dokumentum szövege szerkeszthető, előnézettel.'),
      t('A jogi oldalak kitöltve: szolgáltató, kapcsolat (e-mail és Discord ticket), a Tebex mint viszonteladó.')
    ]
  },
  {
    version: '2.9.0',
    date: '2026-11-13',
    items: [
      t('Fizetés a Tebexben létrehozott csomagokkal: az előfizetés és a pluginok a Tebex saját csomagjain keresztül vásárolhatók, az árat a rendszer a Tebexből veszi át.'),
      t('Akciók Tebex-kuponnal: a kuponkód automatikusan a kosárra kerül.'),
      t('Tebex-kapcsolat tesztelése és az utolsó Tebex-hiba az Áruház adminban.'),
      t('Ha a Tebex belépést kér a fizetés előtt, a vásárló a belépés után automatikusan visszatér, és megy tovább a fizetéshez.'),
      t('Minecraft típusú Tebex-boltnál a fizetés előtt elkérjük a vásárló Minecraft-nevét, és a fiókban megjegyezzük.')
    ]
  },
  {
    version: '2.8.1',
    date: '2026-11-13',
    items: [
      t('Admin Panel / Discord: az Avenge Discord-botja a szerverről működik, a tokenje csak ott tárolódik.'),
      t('Egy gombnyomással berendezi a Discord szervert (rangok, csatornák, fórumok, jogosultságok, üdvözlő képernyő), és kirakja az info-üzeneteket.')
    ]
  },
  {
    version: '2.8.0',
    date: '2026-11-13',
    items: [
      t('Számlák a vásárlói fiókban: minden plugin-vásárlásról, előfizetési díjról és visszatérítésről automatikusan PDF bizonylat készül, ami bármikor újra letölthető és soha nem törlődik.'),
      t('Visszatérítés az Admin Panel Áruház fülén: a fizetéstől számított 14 napon belül egy kattintással visszaküldhető a teljes összeg; a plugin joga vagy az előfizetés azonnal megszűnik, és visszatérítési bizonylat készül.'),
      t('Az adminok minden bizonylatot látnak és letölthetnek (keresés bizonylatszámra, e-mail címre, tranzakcióra), a vásárló adatlapján is.'),
      t('Az oldal kódja kommentek nélkül, tömörítve kerül ki; a fejlesztői eszközök és a forrásnézet megnyitása le van tiltva.')
    ]
  },
  {
    version: '2.7.0',
    date: '2026-11-13',
    items: [
      t('Új: Avenge Foundry - az Avenge plugin-műhelye. Az avenge.hu/store oldalon saját fejlesztésű Minecraft pluginok vásárolhatók, verziókkal, változásnaplóval, képekkel és azonnali letöltéssel.'),
      t('Vásárlói fiók e-mail címmel és jelszóval: a megvett pluginok és minden frissítésük a fiókban tölthetők le. Fizetés a Tebexen keresztül.'),
      t('Az SS tool havi előfizetéssel is elérhető: az előfizető saját szervezetet és Admin fiókot kap, lemondás után a kifizetett hónap végéig él.'),
      t('Akciók (pl. Black Friday) egy pluginra vagy az összesre, időzítve; vásárlók kitiltása, törlése, plugin vagy előfizetési napok ajándékozása az Admin Panel Áruház fülén.'),
      t('Jogi oldalak: ÁSZF, adatkezelési tájékoztató, visszatérítési szabályzat, licencfeltételek, süti tájékoztató és impresszum.')
    ]
  },
  {
    version: '2.6.0',
    date: '2026-11-07',
    items: [
      t('Makrók pontosan: minden makró lépésenként (melyik gomb le/fel, várakozás ms-ban, billentyű, egérmozgatás), a számolt kattintás/másodperccel, a két kattintás közti legrövidebb idővel és az ismétlési móddal (egyszer, amíg nyomva, toggle, N-szer).'),
      t('Minden makrónál látszik, melyik gombra és melyik profilban van kiosztva; a gombkiosztásban a makróra állított gombok külön jelölést kapnak.'),
      t('Az egér beállításai pontos értékkel: DPI-fokozatok, polling, debounce, LOD, szögkorrekció, motion sync, gyors-tüzelés. A 0-2 ms-os debounce (dupla kattintásra alkalmas) kiemelve.'),
      t('Új: az ATK Hub, VXE és a többi Electron-alapú egérprogram adatai (eszközök, makrók neve, típusa, ismétlése) is kiolvashatók.'),
      t('AutoHotkey-szkriptek gyorsbillentyűnként: melyik gombra mi fut le, Sleep-értékek, ciklusok és a kattintási ütem; az autoclicker-programok saját beállításai (kattintási időköz, CPS).')
    ]
  },
  {
    version: '2.5.0',
    date: '2026-11-07',
    items: [
      t('Önmegsemmisítés ("self destruct") után is: a törölt jar-t visszaolvassa a lemezről (NTFS fájltábla) és a Windows visszaállítási pontjaiból, és ujjlenyomattal azonosítja.'),
      t('Felismeri a DoomsDay önmegsemmisítésének mintáját (a jar törlése és a helyén azonnal létrehozott, majd törölt mappa). Ha a Java futtatta is, ez már kritikus találat.'),
      t('A futó Minecraft memóriájában is megtalálja a DoomsDay betöltőjét, akkor is, ha a csalást kikapcsolták és a fájlját törölték.'),
      t('A takarítás nyomai: tömegesen törölt vagy hiányzó Prefetch, újra létrehozott NTFS-napló, törölt eseménynapló, tömegesen törölt Legutóbbi elemek és ugrólisták.'),
      t('Amit a takarítás ritkán ér el: a megnyitott jar-ok listája, az Explorer ugrólistái, a böngészők letöltései (csak csaló-oldalakra szűrve) és a DNS-gyorsítótár.')
    ]
  },
  {
    version: '2.4.0',
    date: '2026-11-07',
    items: [
      t('DoomsDay felismerése akkor is, ha a fájl neve és mérete minden letöltésnél más: a jar belső szerkezete, a titkosított betöltő és a visszafejtő rutin bájtkódja alapján.'),
      t('Kiterjesztéstől függetlenül: egy .txt-re vagy .dat-ra átnevezett jar is lebukik a Letöltések, az Asztal, a Temp és a .minecraft mappákban.'),
      t('Letöltési forrás: ha egy fájlt a DoomsDay oldaláról töltöttek le, az magában is jelzés.'),
      t('Futó Minecraft: jelzi, ha menet közben Java-ügynököt töltöttek bele (injektálás), és ellenőrzi a -jar / -javaagent argumentumokat és a launcherek indítási beállításait.'),
      t('Törölt nyomok: a Java által futtatott, azóta törölt, véletlen nevű jar-ok a Prefetch és az NTFS-napló alapján.')
    ]
  },
  {
    version: '2.3.0',
    date: '2026-11-07',
    items: [
      t('Új „Mire jelzett” blokk az eredmény tetején: a vizsgálat legerősebb találata (csalás vagy autoclicker), a nevével, a helyével, az okával és az idejével.'),
      t('Megosztó link: bárki megnyithatja bejelentkezés nélkül, 3 napig érvényes, és bármikor visszavonható.'),
      t('Az Admin Panel fülekre bontva: áttekintés napi grafikonnal, összes vizsgálat kereséssel és törléssel, előzmények tömeges törlése, beállítások, tevékenységnapló.'),
      t('Új beállítások: a kód érvényessége, a vizsgálatok automatikus törlése, a megosztás és a törlés joga, és hogy a Staff csak a saját vizsgálatait lássa.'),
      t('Felhasználónként: előzmények törlése és kijelentkeztetés minden eszközön.')
    ]
  },
  {
    version: '2.2.0',
    date: '2026-11-06',
    items: [
      t('Egérprogramok: gombonként látszik, mire van kiosztva, és pontosan mi változott: melyik gombra melyik makró került, melyik makró melyik lépése íródott át, melyik profil lett aktív.'),
      t('A korábbi állapotokat a program saját mentéseiből (SQLite WAL, biztonsági másolatok) és a Windows visszaállítási pontjaiból állítja vissza.'),
      t('Minden változásnál látszik, mennyire biztos az ideje: másodpercre pontos, időablak, vagy legkésőbb egy adott pillanatig.'),
      t('Minden találat saját idővonalat kapott: létrehozás, letöltés forrása, indítások, átnevezés (a régi névvel), törlés, Defender-észlelés - másodpercre.'),
      t('Új, közös idővonal az eredményoldalon, szűrhető indításokra, fájlműveletekre, törlésekre és egérváltozásokra.')
    ]
  },
  {
    version: '2.1.0',
    date: '2026-11-04',
    items: [
      t('Egérprogramok felismerése: több mint 600 gyártói program és makróeszköz, az ismeretleneket általános szabályok fogják meg.'),
      t('Látszanak a profilok, az aktív profil és a makrók, a gyors kattintást és a visszarúgás-kompenzációt külön jelzi.'),
      t('Idővonal arról, mi változott az egérprogramban: mentések, törölt makrók, profilváltások a program naplójából.'),
      t('Összevetés ugyanennek a gépnek az előző vizsgálatával: mi tűnt el, és melyik profil lett aktív.'),
      t('Látszik a csatlakoztatott egér valódi neve is.')
    ]
  },
  {
    version: '2.0.0',
    date: '2026-11-03',
    items: [
      t('Alaposabb fájlellenőrzés: a gyanús fájlok tartalmát is ellenőrzi, így az átnevezett csalóprogramok is lebuknak.'),
      t('Új futtatási előzmények: Prefetch, BAM, UserAssist, MuiCache és PCA. A már törölt programok is lebuknak.'),
      t('Új Defender-vizsgálat: korábbi észlelések és gyanús kivételek.'),
      t('Az exe a saját szerverünkről frissül, és csak aláírt frissítést fogad el.'),
      t('Letölteni csak regisztrált fiókkal vagy érvényes session kóddal lehet.'),
      t('Jelszó módosítása a Fiók oldalon, véletlen jelszó generálása fiók létrehozásakor.'),
      t('Teljesen új megjelenés a weboldalon és az exében.')
    ]
  },
  {
    version: '1.3.0',
    date: '2026-09-02',
    items: [
      t('Rendszerszintű vizsgálat: Prefetch, Temp mappák és Legutóbbi elemek is a scan részévé váltak.'),
      t('A kliens alapértelmezetten rendszergazdai jogosultsággal indul, hogy a fenti helyekhez is hozzáférjen.'),
      t('Elkészült a Főoldal, a Fiók és az Újdonságok oldal a Panelen.')
    ]
  },
  {
    version: '1.2.0',
    date: '2026-08-28',
    items: [
      t('Kibővített Minecraft-detekció: Doomsday, Meteor Client, LiquidBounce, Kami Blue és további ismert clientek.'),
      t('AutoClicker, Macro és TimerClicker/AutoHotKey minták detektálása.'),
      t('A telepített verziók (versions mappa) és az Asztal/Letöltések mappa is a vizsgálat része lett.')
    ]
  },
  {
    version: '1.1.0',
    date: '2026-08-20',
    items: [
      t('Élő állapotfrissítések a Panelen (SignalR) - a kódgenerálástól az eredményig nincs szükség oldalfrissítésre.'),
      t('Az eredményoldalon megjelenik a LEGIT/UNLEGIT verdikt és a vissza-navigáció a Panelre.'),
      t('A generált kód automatikusan vágólapra kerül.')
    ]
  },
  {
    version: '1.0.0',
    date: '2026-08-10',
    items: [
      t('Az Avenge első kiadása: kódalapú munkamenet-generálás, kliens letöltés, alap Minecraft- és futófolyamat-vizsgálat.')
    ]
  }
];

export function ChangelogsPage() {
  return (
    <main className="page page-narrow">
      <header className="page-head stagger-in">
        <span className="eyebrow">{t('Verziók')}</span>
        <h1>{t('Újdonságok')}</h1>
        <p className="muted">{t('Amin dolgoztunk, verziónként.')}</p>
      </header>

      <div className="timeline">
        <span className="timeline-beam" aria-hidden="true" />
        {CHANGELOG.map((entry, index) => (
          <Reveal className={`timeline-entry ${index === 0 ? 'timeline-entry-latest' : ''}`} key={entry.version} delay={index * 60}>
            <span className="timeline-node" aria-hidden="true" />
            <div className="card timeline-card spot">
              <div className="timeline-head">
                <span className="timeline-version">{t('v')}{entry.version}</span>
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
