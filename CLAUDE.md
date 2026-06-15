# CLAUDE.md — Kenkäleikki

Internal context for Claude Code so future sessions can continue without
re-deriving everything. Update this file when state or decisions change.

> Käyttäjä: Veka (Vertti Airaksinen), Viking-IT Oy. Puhe suomeksi, koodi ja
> kommentit englanniksi, Conventional Commits. Aja `git push` aina commitin
> jälkeen. Älä turhaan höpötä; perustele päätökset.

## Mikä tämä on

Selainpohjainen hääjuhlan "kenkäleikki": vieraat äänestävät QR-koodilla kumpi
puolisoista sopii kuhunkin kysymykseen, juontajat ohjaavat tapahtumaa livenä, ja
reveal-vaiheessa verrataan morsiamen, sulhasen ja yleisön vastauksia. **Ei omaa
palvelinta** — data Supabasessa, UI GitHub Pagesissa. Mitoitus ~50–150 vierasta.

## Tech stack

React 18 + TypeScript + Vite 8, React Router 6 (**HashRouter**). Supabase
(Postgres + Realtime + RLS) + supabase-js. Deploy: GitHub Actions → GitHub Pages.

## Teema / Design system

Hääväripaletti on käytössä — **ei enää** vanha tumma gold/purple placeholder.
Tokenit `src/design-system/` (Claude Design -bundlesta: `tokens/colors|typography|
spacing|base.css` + `styles.css`-entry, jonka `src/index.css` importtaa ensin).
Kaksi pintaa: **cream "paperi"** vieraan/juontajan puhelimelle ja **deep plum
"stage"** projektorille (`.screen.stage`). Tiimivärit: morsian = fuksia, sulhanen
= vihreä (`.choice.bride` / `.choice.groom`). Typografia: Cormorant Garamond
(display), Pinyon Script (parin nimet), Mulish (UI) — Google Fontsista
`typography.css`:n `@import`illa. Ikoniton: tyypografiset glyfit (❀ ❦ ◆ ✓).
Sovellus tyylittyy luokkapohjaisesti `index.css`:ssä, joka mappaa luokat
DS-tokeneihin — ei DS:n React-komponentteja tuotannossa.

Parin nimet ovat yhdessä paikassa: `src/lib/couple.ts` (`COUPLE` + `teamName`).
**Essi** = morsian (fuksia/❀), **Samuli** = sulhanen (vihreä/❦). Nimet näkyvät
äänestysruuduissa (nimi + pieni rooli­alaotsikko), reveal-riveissä/palkeissa ja
projektorin idle-kortin script-wordmarkissa.

**Avoin:** lopullinen fonttisuunta odottaa vahvistusta (jos hääkutsulla oma
typografia, vaihdetaan `typography.css`:ään).

## Ulkoinen tila (mitä on jo pystytetty)

- **Repo:** https://github.com/vikingit-Veka/Kenkaleikki — **julkinen**.
- **Live (custom domain):** https://kenkaleikki.vikingit.fi/ — **aktiivinen,
  HTTPS pakotettu, Let's Encrypt -sertti approved**. Pages source = Actions.
  DNS: CNAME `kenkaleikki` → `vikingit-veka.github.io`. Custom domain serveröi
  juuresta → `VITE_BASE=/` (deploy.yml) ja `public/CNAME` pitää domainin pystyssä
  joka deployssa. Custom domain asetettu Pages-API:lla (`gh api PUT …/pages
  -f cname=… -F https_enforced=true`); Actions-deployssa pelkkä CNAME-tiedosto ei
  riitä, domain on oltava Pages-asetuksissa. Vanha `…github.io/Kenkaleikki/`
  redirectaa tänne.
- **GitHub secrets** asetettu: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (injektoidaan buildiin `deploy.yml`:ssä). Arvot ovat myös `.env`:ssä (gitignored).
- **Supabase:** Vekan projekti. Schema ajettu. Käytössä uusi *publishable*
  -avainmuoto (lyhyt, ~46 merkkiä), ei vanha pitkä JWT-anon.
- **Juontajatunnus** luodaan Supabase Auth → Add user (Auto Confirm). Julkinen
  rekisteröityminen pidettävä pois päältä.
- gh CLI on kirjautunut tilille `vikingit-Veka` (scopet: repo, workflow, project).

## Reitit (HashRouter → URL:t muotoa `…/#/polku`)

| Reitti | Kuka | Auth |
|--------|------|------|
| `/guest` | Vieraat (QR) | ei |
| `/screen` | Valkokangas: live-kysymys **ja** reveal | ei |
| `/reveal` | Pelkkä reveal (valinnainen alias) | ei |
| `/control/master` | Pää-juontaja | kyllä |
| `/control/bride` / `/control/groom` | Morsian / sulhanen | kyllä |
| `/login` | Juontajan kirjautuminen | — |

`RequireAuth` (`src/components/RequireAuth.tsx`) suojaa vain control-reitit.

## Tilakone (`event_state.phase`, yksi rivi id=1)

`draft → scheduled → voting_open → voting_closed → live_questions → reveal → closed`

Master vaihtaa vaihetta. Vieraan näkymä `Guest.tsx` rendaa per vaihe;
`scheduled` = "Odotetaan äänestyksen alkua" (myös nollauksen jälkeinen lepotila).

`event_state.screen_theme` (`'stage'` | `'paper'`, default `stage`) ohjaa
projektorin (`/screen`, `/reveal`) teemaa: tumma plum-stage vs vaalea paperi
valoisaan tilaan. Master togglaa, projektori lukee realtimena (sama kanava kuin
phase). Sarake lisätään `supabase/add-screen-theme.sql`:llä — aja kerran live-
projektiin (luki on `screen_theme ?? 'stage'`, joten koodi on turvallinen ennen
migraatiota, mutta toggle ei vaikuta ennen sitä).

## Tietokanta + RLS (`supabase/schema.sql`)

- `questions`, `couple_answers` (PK = question_id), `guest_votes`
  (unique question_id+session_id estää tuplaäänet), `event_state`.
- Trigger luo `couple_answers`-rivin jokaiselle uudelle kysymykselle.
- RLS-ydin: vieras saa INSERT `guest_votes` vain `voting_open`-vaiheessa; juontaja
  UPDATE `couple_answers` vain `live_questions`-vaiheessa; `couple_answers`
  luettavissa anonina vasta `reveal`/`closed`-vaiheessa (estää spoilauksen,
  mahdollistaa kirjautumattoman projektorin); `event_state` UPDATE vain
  authenticated.
- `reset_event()`: SECURITY DEFINER RPC, host-only execute. Tyhjentää äänet +
  parin vastaukset ja palauttaa `scheduled`-tilaan.

## Keskeiset päätökset ja MIKSI

- **HashRouter, ei BrowserRouter:** GitHub Pagesissa ei ole SPA-fallbackia, joten
  syvälinkit antaisivat 404. Hash välttää tämän ilman 404.html-kikkoja.
- **Custom domain vikingit.fi:n alle:** jaettu `github.io` saa Androidilla Google
  Safe Browsing -varoituksen ("Jatka sivustolle") maineperusteisesti. Oma
  hostname välttää tämän + antaa lyhyen osoitteen. URL-lyhennin EI auta, koska
  destinaatio (github.io) arvioidaan silti.
- **Repo julkinen:** Pages vaatii ilmaistilillä julkisen repon. Koodissa ei ole
  salaisuuksia — anon/publishable-avain on luonteeltaan selaimeen tarkoitettu, ja
  service_role-avainta ei käytetä missään.
- **Ei kirjautumista projektorille/vieraille:** käytännöllisempää häävenuella.
  Turvallisuus hoidetaan RLS:llä, ei loginilla, paitsi kirjoittavat control-reitit.
- **`reset_event()` SECURITY DEFINER -funktiona:** juontajatunnuksella ei ole
  DELETE-oikeutta `guest_votes`-tauluun eikä `couple_answers`-UPDATEa muulloin kuin
  live-vaiheessa. Funktio ohittaa RLS:n turvallisesti, execute vain authenticated.
- **`where true` reset-funktion DML:ssä:** Supabasen `safeupdate`-vahti estää
  WHERE-lauseettomat DELETE/UPDATE → "DELETE requires a WHERE clause".
- **`voting_closed`-vaihe lisätty:** alkup. suunnitelman tilakone unohti sen,
  mutta vierasnäkymä tarvitsee sen. Master ei enää aja sitä erikseen ("Sulje
  äänestys" poistettu), koska "Aloita live-osuus" sulkee äänestyksen RLS:llä.
- **Bride/groom-sarakerajoitus sovellustasolla, ei RLS:ssä (MVP-oikaisu):** mikä
  tahansa juontajatunnus voi teknisesti päivittää kumpaakin `couple_answers`
  -saraketta; UI estää väärän. Aito per-sarake-lukko vaatisi erilliset tunnukset
  + sarakekohtaiset politiikat. → mahdollinen jatkokehitys.

## Komennot

```bash
cp .env.example .env   # täytä Supabase URL + (publishable) key
npm install
npm run dev            # http://localhost:5173/#/guest
npm run build          # tsc --noEmit + vite build → dist/
```

Deploy: `git push origin main` → Actions buildaa ja julkaisee samaan URL:iin.
**QR-koodi (`qr-guest.png` / `.svg`) pysyy voimassa** kaikissa pikkupäivityksissä;
uusittava vain jos URL (repo-nimi / domain / tili) muuttuu.

Apuskriptit: `supabase/reset.sql` (pehmeä nollaus testikierrosten väliin, säilyttää
kysymykset), koko `schema.sql` uudelleen = täysi nollaus (drop+seed).

## Tunnetut puutteet / jatkoideat

- Bride/groom per-sarake-RLS (ks. yllä).
- Kysymysten hallinta-UI (nyt seed/SQL kautta).
- `actions/deploy-pages@v4` ajaa Node 20:llä (deprek. varoitus, ei kaada).
- Ei automaattitestejä (MVP).
