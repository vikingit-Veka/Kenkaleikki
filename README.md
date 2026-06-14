# Kenkäleikki

Selainpohjainen hääjuhlan kenkäleikki. Vieraat äänestävät QR-koodin kautta,
juontajat ohjaavat tapahtumaa livenä ja reveal-vaihe vertaa morsiamen,
sulhasen ja yleisön vastauksia. Ei omaa palvelinta — kaikki data Supabasessa,
käyttöliittymä GitHub Pagesissa.

## Tech

React + TypeScript + Vite + React Router (HashRouter) · Supabase (Postgres,
Realtime, RLS) · GitHub Pages.

## Reitit

| Reitti            | Kuka            | Auth     |
| ----------------- | --------------- | -------- |
| `/guest`          | Häävieraat (QR) | ei       |
| `/screen`         | Valkokangas     | ei       |
| `/reveal`         | Valkokangas     | juontaja |
| `/control/master` | Pää-juontaja    | juontaja |
| `/control/bride`  | Morsian-tiimi   | juontaja |
| `/control/groom`  | Sulhanen-tiimi  | juontaja |
| `/login`          | Juontajat       | —        |

HashRouterin takia URL:t ovat muotoa `https://.../#/guest`.

## Tilakone (`event_state.phase`)

`draft → scheduled → voting_open → voting_closed → live_questions → reveal → closed`

Master-ohjaus vaihtaa vaihetta. Vieraat voivat äänestää vain `voting_open`-vaiheessa
(pakotettu RLS:ssä), juontajat syöttävät parin vastaukset vain `live_questions`-vaiheessa.

## Paikallinen kehitys

```bash
cp .env.example .env   # täytä Supabase URL + anon key
npm install
npm run dev
```

## Käyttöönotto

Ks. juurikansion erilliset ohjeet (Supabase-projekti, SQL, GitHub-secrets, Pages).
Skeema on `supabase/schema.sql`, deploy `.github/workflows/deploy.yml`.
