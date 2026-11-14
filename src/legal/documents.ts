export interface LegalDocument {
  slug: string;
  title: string;
  short: string;
  updated: string;
  body: string;
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: 'aszf',
    title: 'Általános Szerződési Feltételek',
    short: 'ÁSZF',
    updated: '2026. november 13.',
    body: `
Ez az Általános Szerződési Feltételek (ÁSZF) a(z) {{weboldal}} weboldalon elérhető, {{szolgaltatas.nev}} néven nyújtott szolgáltatások igénybevételének feltételeit tartalmazza: az **Avenge SS tool** (Minecraft screenshare vizsgálóeszköz) és az **Avenge Foundry** áruház (Minecraft pluginok és modellek értékesítése). A regisztrációval, a vásárlással vagy az előfizetéssel elfogadod ezt az ÁSZF-et.

## 1. A szolgáltató
{{szolgaltato.tabla}}

A fizetéseket és a számlázást viszonteladóként (merchant of record) a {{viszontelado.nev}} bonyolítja; adatai az [Impresszumban](/jogi/impresszum) találhatók.

## 2. Fogalmak
- **Vásárló / Felhasználó**: aki az avenge.hu-n vásárlói fiókot hoz létre, pluginokat vagy modelleket vásárol, vagy előfizet.
- **Plugin**: a Szolgáltató által fejlesztett, letölthető Minecraft szerverkiegészítő (digitális tartalom).
- **Modell**: a Szolgáltató által készített, letölthető Minecraft 3D modell, textúra vagy erőforráscsomag (pl. Blockbench, ModelEngine, ItemsAdder, Oraxen vagy Nexo formátumban; digitális tartalom).
- **Termék**: a pluginok és a modellek együttes megnevezése.
- **SS tool**: az Avenge screenshare vizsgálóeszköz (Windows kliensprogram és webes panel).
- **Előfizetés**: az SS tool havidíjas, automatikusan megújuló használati joga.
- **Szolgáltató**: {{szolgaltato.nev}} ({{szolgaltato.jogallas}}), a {{szolgaltatas.nev}} üzemeltetője.
- **Tebex**: a {{viszontelado.nev}}, amely a fizetéseket viszonteladóként (merchant of record) bonyolítja.

## 3. Regisztráció és fiók
1. Vásárlás és letöltés csak vásárlói fiókkal lehetséges (e-mail cím, jelszó és Minecraft-név). A Minecraft-nevet a Tebex a fizetés azonosítására használja, ezért a regisztrációkor megadott név utólag nem módosítható; elírás esetén az ügyfélszolgálat javítja.
2. A Felhasználó felel a megadott adatok valódiságáért és a jelszava titokban tartásáért.
3. Egy személy egy fiókot használhat; a fiók nem ruházható át, és nem adható tovább.
4. A Szolgáltató a fiókot felfüggesztheti vagy törölheti, ha a Felhasználó megszegi az ÁSZF-et vagy a Licencfeltételeket (pl. egy Termék jogosulatlan terjesztése, visszaélésszerű visszaterhelés, csalás).
5. A Felhasználó a fiókját bármikor törölheti a Fiókom oldalon.

## 4. Pluginok és modellek vásárlása
1. A Termékek ára az adatlapjukon szerepel; az akciós ár az akció időtartama alatt érvényes. Az árak a Tebex fizetési oldalán az alkalmazandó adóval együtt jelennek meg véglegesen.
2. A megrendelés a Tebex fizetési oldalán, a fizetés véglegesítésével jön létre. A fizetést és a számlázást a Tebex végzi; a fizetésre a Tebex saját vásárlói feltételei is vonatkoznak ({{viszontelado.feltetelek}}).
3. Sikeres fizetés után a Termék a Felhasználó fiókjában azonnal letölthetővé válik, a későbbi frissítéseivel együtt.
4. A vásárlással a Felhasználó **nem a Termék tulajdonjogát**, hanem a [Licencfeltételek](/jogi/licenc) szerinti, nem kizárólagos használati jogot szerzi meg.
5. A kompatibilitási adatok (Minecraft-verzió, szerverszoftver, modellkezelő plugin vagy formátum) tájékoztató jellegűek; a Felhasználó vásárlás előtt ellenőrizze, hogy a Termék megfelel-e a szerverének. A modellek használatához a leírásban megjelölt külső plugin (pl. ModelEngine, ItemsAdder) szükséges lehet, amelyet a Felhasználó maga szerez be.

## 5. Az SS tool előfizetés
1. Az előfizetés havidíjas, és a Felhasználó lemondásáig **havonta automatikusan megújul**; a díjat a Tebex terheli a megadott fizetési módra.
2. Az első sikeres fizetés után a Felhasználó saját szervezetet és Tulajdonos rangú hozzáférést kap az SS panelhez, ahol a csapata Admin és Staff rangjainak jogait maga állíthatja be.
3. Az előfizetés bármikor, egy gombbal lemondható az Előfizetés vagy a Fiókom oldalon; a már kifizetett időszak végéig a hozzáférés megmarad, utána újabb terhelés nem történik. Ha a lemondás után a Tebex mégis terhelne, a terhelést visszatérítjük.
4. Lejárt előfizetéssel új vizsgálati kód nem generálható; a korábbi eredmények a szervezet megőrzési beállításai szerint maradnak meg.
5. Az SS tool csak olyan személy vizsgálatára használható, aki a vizsgálatot maga indítja el a kapott kóddal. A Felhasználó (szerver) felel azért, hogy a vizsgálatot jogszerűen, a játékos megfelelő tájékoztatása mellett végezze, és az eredményeket csak a csalás kiszűrésére használja.
6. Az SS tool eredménye szakmai segítség a döntéshez, nem tévedhetetlen: a végső döntés (pl. kitiltás) a szerver staffjáé.

## 6. Elállási jog
A fogyasztót a 45/2014. (II. 26.) Korm. rendelet alapján főszabályként 14 napos elállási jog illeti meg. **Nem tárgyi adathordozón nyújtott digitális tartalom** (plugin, modell) esetén azonban az elállási jog megszűnik, ha a teljesítés a fogyasztó kifejezett előzetes beleegyezésével kezdődött meg, és a fogyasztó tudomásul vette, hogy ezzel elveszíti az elállási jogát (29. § (1) m) pont). Ezt a hozzájárulást a vásárlás előtt külön jelölőnégyzettel kérjük. Részletek: [Visszatérítési szabályzat](/jogi/visszaterites).

## 7. Szavatosság, felelősség
1. A Szolgáltató a Termékeket a leírásuk szerinti működéssel nyújtja, és a hibákat a frissítések keretében javítja. Hibás teljesítés esetén a fogyasztót a Ptk. és a 373/2021. (VI. 30.) Korm. rendelet szerinti jogok illetik meg.
2. A Szolgáltató nem felel a Termék nem rendeltetésszerű használatából, más pluginokkal vagy erőforráscsomagokkal való ütközéséből, illetve a szerver hibás beállításából eredő károkért, és az elmaradt haszonért - kivéve, ha a jogszabály ezt nem engedi kizárni.
3. A Szolgáltató a szolgáltatás folyamatos elérhetőségére törekszik, de karbantartás vagy üzemzavar miatt átmeneti kiesés előfordulhat.

## 8. Panaszkezelés, jogviták
1. Panaszaidat {{kapcsolat}} jelezheted; 30 napon belül írásban válaszolunk.
2. Fogyasztói jogvita esetén a lakóhelyed szerinti békéltető testülethez fordulhatsz, illetve az EU online vitarendezési platformját is használhatod: https://ec.europa.eu/consumers/odr.
3. A szerződésre a magyar jog az irányadó; a fogyasztó lakóhelye szerinti kötelező fogyasztóvédelmi szabályok ettől függetlenül alkalmazandók.

## 9. Módosítás
A Szolgáltató az ÁSZF-et módosíthatja; a módosítást a weboldalon közzéteszi. A már megkötött vásárlásokra a vásárláskor hatályos ÁSZF vonatkozik; előfizetés esetén a lényeges változásról a következő terhelés előtt értesítünk.
`
  },
  {
    slug: 'adatkezeles',
    title: 'Adatkezelési tájékoztató',
    short: 'Adatkezelés',
    updated: '2026. november 13.',
    body: `
Ez a tájékoztató az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR) és az Infotv. (2011. évi CXII. törvény) alapján mutatja be, milyen személyes adatokat kezelünk, miért és meddig.

## 1. Adatkezelő
{{szolgaltato.tabla}}

## 2. Vásárlói fiók és áruház
| Adat | Cél | Jogalap | Megőrzés |
|---|---|---|---|
| E-mail cím, jelszó (csak hash-elve), Minecraft-név | fiók, belépés, kapcsolattartás, a Tebex-fizetés azonosítása | szerződés teljesítése (GDPR 6. cikk (1) b)) | a fiók törléséig |
| Profilkép (ha feltöltesz) | a fiók személyre szabása | hozzájárulás (GDPR 6. cikk (1) a)), bármikor törölhető a Fiókom oldalon | a törlésig vagy a fiók törléséig |
| ÁSZF-elfogadás ideje és verziója | a hozzájárulás igazolása | jogi kötelezettség / jogos érdek | a fiók törléséig |
| Rendelések (tételek, összeg, időpont, Tebex-azonosító) | teljesítés, könyvelés, visszaélés-megelőzés | jogi kötelezettség (számviteli törvény) | 8 év; a fiók törlése után név nélkül |
| Vásárlási és visszatérítési bizonylatok (név, e-mail cím, tételek, összeg, időpont, Tebex-azonosító) | a fizetések és visszatérítések igazolása, elszámolás, könyvelés | jogi kötelezettség (számviteli törvény), jogos érdek (jogviták rendezése) | 8 év; a fiók törlése után is változatlanul |
| Megvásárolt pluginok és modellek, letöltések száma | letöltési jog biztosítása | szerződés teljesítése | a fiók törléséig |
| Előfizetés állapota, Tebex-hivatkozás | a havi előfizetés kezelése | szerződés teljesítése | a fiók törléséig |
| Kitiltás oka (ha van) | visszaélések megelőzése | jogos érdek | a fiók törléséig |

**Ügyfélszolgálati ticketek**: ha a weboldal Támogatás oldalán ticketet nyitsz, a vásárlói fiókodhoz rögzítjük a ticket témáját, tárgyát, a megadott azonosítót (pl. bizonylatszám), a veled folytatott levelezést és a csatolt képeket, valamint a nyitás, a válaszok és a lezárás idejét. Cél: a kérésed megválaszolása és a „egyszerre egy nyitott ticket, újat 3 naponta” szabály betartatása; jogalap: a kérésed teljesítése (GDPR 6. cikk (1) b)) és jogos érdek (f)). A ticketeket a lezárásuktól számított 1 évig őrizzük, a fiókod törlésekor pedig a csatolmányokkal együtt azonnal töröljük. Csatolmányként csak képet fogadunk el; ne küldj jelszót vagy bankkártyaadatot.

**Bankkártya-adatot nem kezelünk**: a fizetést a {{viszontelado.nev}} (Egyesült Királyság) végzi saját adatkezelőként; a fizetéshez megadott adatokra a Tebex adatvédelmi tájékoztatója vonatkozik (https://www.tebex.io/privacy). Mi a Tebextől csak a fizetés tényét, összegét, azonosítóját és a vásárló e-mail címét kapjuk meg; a Tebexnek a fizetéshez a regisztrációkor megadott Minecraft-nevet adjuk át.

## 3. Az SS tool vizsgálatai
A vizsgálatot a játékos maga indítja el a staff tagtól kapott kóddal; a program jelzi, hogy a csatlakozással a vizsgálat elindul, és az eredményt a staff látja.

A vizsgálat során a program a számítógépen ismert csalóprogramok és autoclickerek nyomait keresi. Ehhez elemzi a **számítógépen tárolt fájlokat** (nevüket, méretüket, ujjlenyomatukat és - jar fájloknál - a tartalmukat), a **futtatási előzményeket és rendszernaplókat** (pl. Prefetch, Windows-naplók, törölt fájlok nyomai), a **futó folyamatokat** (a Minecraft memóriájával együtt), a **telepített programokat és beállításaikat** (pl. egérszoftverek makrói), valamint a böngésző- és DNS-előzmények csalással kapcsolatos bejegyzéseit.

A szerverre a vizsgálat **eredménye** kerül: a találatok (fájlnév, elérési út, időbélyeg, súlyosság és a találatot alátámasztó részletek - pl. egy egérmakró lépései, egy csalással kapcsolatos böngésző- vagy DNS-bejegyzés), a Minecraft-felhasználónév, a gép hardverazonosítójából képzett lenyomat, a vizsgálat ideje és az IP-cím. Személyes dokumentumokat, képeket, üzeneteket vagy jelszavakat nem gyűjtünk.

- **Cél**: a csalás kiszűrése a Minecraft szervereken.
- **Jogalap**: a szerver jogos érdeke a tisztességes játék biztosításához (GDPR 6. cikk (1) f)), amelyet a játékos a vizsgálat önkéntes elindításával tudomásul vesz.
- **Adatkezelő**: az a szerver (szervezet), amelynek staff tagja a vizsgálatot kérte; a Szolgáltató ilyenkor a szerver megbízásából, adatfeldolgozóként tárolja az eredményt. A Szolgáltató saját szerverein végzett vizsgálatoknál a Szolgáltató az adatkezelő.
- **Megőrzés**: a szervezet beállítása szerint (alapértelmezés szerint a szervezet törléséig, vagy a beállított napok után automatikusan törlődik). A megosztó link legfeljebb 3 napig érvényes.

## 4. Technikai adatok
A weboldal a bejelentkezéshez a böngésző helyi tárolójában (localStorage) tárol egy belépési tokent, és megjegyzi az oldal aktuális témáját. Követő (marketing vagy analitikai) sütit nem használunk. A szerver a biztonság érdekében naplózza a kérések IP-címét és idejét, a staff műveleteit pedig a szervezet tevékenységnaplójában rögzíti. {{naplo.megorzes}} Részletek: [Süti tájékoztató](/jogi/cookie).

## 5. Adatfeldolgozók, címzettek
- **{{viszontelado.nev}}** (Egyesült Királyság) - fizetés, számlázás (önálló adatkezelő).
- **Discord Inc.** (USA) - ha a Discord szerverünkön ({{kapcsolat.discord}}) keresel minket, az üzeneteidet a Discord a saját adatvédelmi tájékoztatója szerint kezeli.
- **Tárhelyszolgáltatók** (adatfeldolgozók):
{{tarhely.lista}}

Az Egyesült Királyságba irányuló adattovábbítás az Európai Bizottság megfelelőségi határozata alapján, az Egyesült Államokba irányuló adattovábbítás megfelelő garanciák (EU-USA adatvédelmi keretrendszer, illetve általános szerződési feltételek) mellett történik.

## 6. Jogaid
Kérheted a személyes adataidhoz való hozzáférést, azok helyesbítését, törlését, az adatkezelés korlátozását, tiltakozhatsz a jogos érdeken alapuló adatkezelés ellen, és kérheted az adataid hordozható formában való kiadását. Kérésedet {{kapcsolat}} jelezheted; 1 hónapon belül válaszolunk. A vásárlói fiókodat a Fiókom oldalon magad is törölheted.

Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH, 1055 Budapest, Falk Miksa utca 9-11., https://naih.hu) fordulhatsz, vagy bírósághoz is.
`
  },
  {
    slug: 'visszaterites',
    title: 'Visszatérítési szabályzat',
    short: 'Visszatérítés',
    updated: '2026. november 13.',
    body: `
## 1. Pluginok és modellek (digitális tartalom)
A pluginok és a modellek nem tárgyi adathordozón nyújtott digitális tartalmak: a fizetés után azonnal letölthetők. A vásárlás előtt kifejezetten hozzájárulsz a teljesítés azonnali megkezdéséhez, és tudomásul veszed, hogy ezzel **elveszíted a 14 napos elállási jogodat** (45/2014. (II. 26.) Korm. rendelet 29. § (1) m) pont).

Ettől függetlenül visszatérítést adunk, ha:
- a Termék a leírásában szereplő, támogatott környezetben **lényegesen hibásan működik** (a modell pl. hibásan töltődik be vagy hiányos), és a hibát a bejelentéstől számított 14 napon belül nem javítjuk;
- **kétszer fizettél** ugyanazért a Termékért;
- a fizetés után a Termék **nem vált letölthetővé**, és ezt 48 órán belül nem orvosoljuk.

Nem adunk visszatérítést, ha a Termék a szervered beállítása, egy nem támogatott verzió, egy hiányzó modellkezelő plugin vagy egy másik plugin miatt nem működik, illetve ha egyszerűen meggondoltad magad a letöltés után.

## 2. SS tool előfizetés
- Az előfizetést bármikor lemondhatod; a következő hónapra már nem terhelünk.
- A megkezdett hónap díját nem térítjük vissza, de a hónap végéig használhatod a szolgáltatást.
- Ha a fizetést követő 14 napon belül a szolgáltatás a mi hibánkból nem volt használható, kérésre a havi díjat visszatérítjük; ilyenkor az előfizetés azonnal megszűnik.

## 3. Hogyan kérj visszatérítést?
Visszatérítést a fizetéstől számított **14 napon belül** kérhetsz. Írj a **{{kapcsolat.email}}** címre a vásárlói fiókod e-mail címéről, vagy nyiss ticketet a weboldal **Támogatás** oldalán (avenge.hu/tamogatas); add meg a bizonylat számát (a fiókod Számlák részén találod) és a probléma leírását. A jogos visszatérítést a Tebexen keresztül, a teljes összegről, az eredeti fizetési módra indítjuk; a pénz általában 5-10 munkanapon belül érkezik meg. A visszatérítésről visszatérítési bizonylatot kapsz, ami a fiókodban letölthető.

## 4. Visszaterhelés (chargeback)
Kérjük, mielőtt a bankodnál visszaterhelést kezdeményezel, keress minket. Visszatérítés vagy visszaterhelés esetén a Termék letöltési joga megszűnik, a licenc érvényét veszti; visszaélésszerű visszaterhelésnél a fiókot felfüggeszthetjük.
`
  },
  {
    slug: 'licenc',
    title: 'Licencfeltételek (pluginok és modellek)',
    short: 'Licenc',
    updated: '2026. november 13.',
    body: `
Ezek a feltételek az Avenge Foundry által értékesített Minecraft pluginok és modellek (együtt: Termékek) használatára vonatkoznak. A Termék megvásárlásával vagy letöltésével elfogadod őket.

## 1. A licenc
A vásárlással **nem kizárólagos, át nem ruházható, határozatlan idejű** jogot kapsz arra, hogy a Terméket a saját Minecraft szerverhálózatodon (egy tulajdonos vagy üzemeltető szerverein, a fejlesztői/teszt szervereket is beleértve) használd.

## 2. Megengedett
- A plugin futtatása a saját szerverhálózatodon, korlátlan számú játékossal.
- A konfiguráció és a szövegek szabad módosítása.
- A forráskód módosítása a saját használatra, ha a plugin forráskóddal érkezik.
- A modell beépítése a szervered erőforráscsomagjába (resource pack), amelyet a szerverre csatlakozó játékosok letöltenek; ez nem minősül továbbadásnak.
- A modell átszínezése, átméretezése és módosítása a saját szervereden való használatra.

## 3. Tilos
- A Termék vagy annak módosított változata **továbbadása, újraértékesítése, megosztása** vagy nyilvános közzététele (pl. "leak" oldalakon), ingyen sem.
- A modell forrásfájljainak (pl. .bbmodel) vagy a szerver erőforráscsomagjából kinyert modelleknek a kiadása, illetve más termékben való felhasználása.
- A plugin visszafejtése azzal a céllal, hogy annak részeit más termékben felhasználd vagy terjeszd.
- A licencellenőrzés vagy a vásárló-azonosítás megkerülése, eltávolítása.
- A Termék felhasználása más ügyfeleknek nyújtott szolgáltatásban (pl. eladott szerver-csomag részeként) külön engedély nélkül.

## 4. Frissítések, támogatás
A megvásárolt Termék frissítései a fiókodban díjmentesen letölthetők, amíg a Terméket fejlesztjük. Támogatást {{kapcsolat}} nyújtunk ésszerű időn belül.

## 5. A licenc megszűnése
A licenc megszűnik, ha megszeged ezeket a feltételeket, illetve visszatérítés vagy visszaterhelés esetén. Ilyenkor a Terméket törölnöd kell a szervereidről és az erőforráscsomagodból. A jogsértő terjesztés esetén a fiókodat kitilthatjuk, és a szerzői jogi jogsértés miatt jogi lépéseket tehetünk.

## 6. Szerzői jog
A Termékek szerzői jogai a Szolgáltatót ({{szolgaltato.nev}}) illetik. A Minecraft a Mojang AB védjegye; az Avenge Foundry nem áll kapcsolatban a Mojanggal vagy a Microsofttal.
`
  },
  {
    slug: 'impresszum',
    title: 'Impresszum',
    short: 'Impresszum',
    updated: '2026. november 13.',
    body: `
Az elektronikus kereskedelmi szolgáltatásokról szóló 2001. évi CVIII. törvény alapján:

## Szolgáltató
{{szolgaltato.tabla}}

## Viszonteladó (fizetés és számlázás)
A vásárlások és az előfizetések díját viszonteladóként (merchant of record) az alábbi cég szedi be, és ő állítja ki a számlát:

{{viszontelado.tabla}}

## Tárhelyszolgáltatók
{{tarhely.tabla}}

## Felügyeleti szervek
- Fogyasztóvédelem: a lakóhely szerinti kormányhivatal, illetve békéltető testület
- Adatvédelem: Nemzeti Adatvédelmi és Információszabadság Hatóság (https://naih.hu)

A Minecraft a Mojang AB védjegye. A(z) {{szolgaltatas.nev}} nem áll kapcsolatban a Mojanggal vagy a Microsofttal.
`
  },
  {
    slug: 'cookie',
    title: 'Süti (cookie) tájékoztató',
    short: 'Sütik',
    updated: '2026. november 13.',
    body: `
## Mit tárolunk a böngésződben?
Az avenge.hu **nem használ követő, reklám- vagy analitikai sütit**, ezért nem kérünk hozzájárulást süti-sávval.

A működéshez szükséges, a böngésző helyi tárolójában (localStorage) tárolt adatok:

| Kulcs | Cél | Élettartam |
|---|---|---|
| \`avenge_customer_token\` | vásárlói bejelentkezés | legfeljebb 7 nap, vagy kijelentkezésig |
| \`avenge_staff_token\` | staff (SS panel) bejelentkezés | legfeljebb 8 óra, vagy kijelentkezésig |
| \`avenge.siteTheme\` | az oldal aktuális (ünnepi) témájának megjegyzése, hogy betöltéskor ne villanjon | amíg nem törlöd |

Ezek a bejelentkezéshez, illetve a kért megjelenéshez feltétlenül szükségesek (az ePrivacy irányelv 5. cikk (3) bekezdése szerinti kivétel), és csak a te böngésződben vannak.

## Harmadik felek
A fizetéskor a **Tebex** fizetési oldalára kerülsz át; ott a Tebex a saját sütijeit használja a fizetés biztonságos lebonyolításához, a saját tájékoztatója szerint.

## Hogyan törölheted?
Kijelentkezéskor a token törlődik; a böngésző beállításaiban az avenge.hu tárolt adatait bármikor törölheted.
`
  }
];

export function findLegalDocument(slug: string | undefined): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}
