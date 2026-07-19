# ADHD Dagbog

Mobilvenlig ADHD-journal med daglig tracking, ugerefleksion, grafer og PDF-eksport.  
Hostet gratis på GitHub Pages med data gemt sikkert i Supabase.

---

## Opsætning — trin for trin

### 1. Kør SQL-schema i Supabase (3 min)

1. Gå til [supabase.com/dashboard/project/vmprfkycustrczhptoty](https://supabase.com/dashboard/project/vmprfkycustrczhptoty)
2. Klik **SQL Editor → New query**
3. Kopiér hele indholdet af `supabase-schema.sql` og klik **Run**
4. Gå til **Settings → API** og kopiér:
   - **Project URL** (ligner `https://vmprfkycustrczhptoty.supabase.co`)
   - **anon / public** nøglen

---

### 2. Upload kode til GitHub (5 min)

Du har to muligheder:

**A) Via terminal (anbefalet):**
```bash
cd adhd-journal
git init
git add .
git commit -m "Første version af ADHD Dagbog"
git branch -M main
git remote add origin https://github.com/hougaardstenius-spec/ahdh-journal.git
git push -u origin main
```

**B) Via GitHub web:** Gå til dit repo og træk alle filer ind i upload-dialogen.

---

### 3. Tilføj Supabase-nøgler som GitHub Secrets (2 min)

1. Gå til dit GitHub-repo: **Settings → Secrets and variables → Actions**
2. Klik **New repository secret** — tilføj disse to:

| Navn | Værdi |
|------|-------|
| `VITE_SUPABASE_URL` | Din Project URL fra Supabase |
| `VITE_SUPABASE_ANON_KEY` | Din anon-nøgle fra Supabase |

---

### 4. Aktiver GitHub Pages (1 min)

1. I dit repo: **Settings → Pages**
2. Under **Source**: vælg **GitHub Actions**
3. Klik **Save**

GitHub bygger og deployer automatisk. Vent 2–3 minutter, så er appen live på:

**`https://hougaardstenius-spec.github.io/ahdh-journal`**

---

### 5. Push-notifikationer (valgfrit)

For at kæledyret kan sende dig en rigtig notifikation når det savner dig,
skal du tilføje 3 secrets mere samme sted som i trin 3
(**Settings → Secrets and variables → Actions**):

| Navn | Værdi |
|------|-------|
| `VITE_VAPID_PUBLIC_KEY` | Den offentlige VAPID-nøgle (genereres én gang, se nedenfor) |
| `VAPID_PRIVATE_KEY` | Den private VAPID-nøgle — må aldrig ligge andre steder end her |
| `SUPABASE_SERVICE_ROLE_KEY` | Din `service_role`-nøgle fra Supabase **Settings → API** — giver fuld databaseadgang, del den aldrig, indsæt kun direkte i GitHub-secret-feltet |

VAPID-nøgleparret genereres én gang med `npx web-push generate-vapid-keys`
og ændres ikke igen — hvis det regenereres, skal alle brugere aktivere
notifikationer forfra.

---

### 5. Tilføj til din telefons hjemmeskærm

**iPhone (Safari):**
1. Åbn appen i Safari
2. Tryk del-knappen (firkant med pil op)
3. Vælg "Føj til hjemmeskærm"

**Android (Chrome):**
1. Åbn appen i Chrome
2. Tryk ⋮ menu
3. Vælg "Installer app" eller "Føj til startskærm"

Appen kører herefter i fuldskærm uden browser-ramme — præcis som en native app.

---

## Fremtidige opdateringer

Redigér koden og kør:
```bash
git add .
git commit -m "Beskrivelse af ændring"
git push
```
GitHub Pages deployer automatisk inden for 2–3 minutter.

---

## Projektstruktur

```
adhd-journal/
├── index.html                    ← HTML entry point
├── vite.config.js                ← Vite + GitHub Pages base path
├── package.json
├── supabase-schema.sql           ← Kør dette i Supabase SQL Editor
├── public/
│   ├── manifest.json             ← PWA manifest
│   ├── icon-192.png
│   └── icon-512.png
├── .github/workflows/
│   └── deploy.yml                ← Auto-deploy til GitHub Pages
└── src/
    ├── main.jsx
    ├── App.jsx                   ← Navigation og auth
    ├── App.css
    ├── lib/
    │   ├── supabase.js           ← Supabase klient
    │   └── constants.js          ← Delte konstanter og helpers
    └── components/
        ├── Auth.jsx              ← Login / opret konto
        ├── DayView.jsx           ← Daglig dagbog
        ├── WeekView.jsx          ← Ugerefleksion
        ├── TrendsView.jsx        ← Grafer over tid
        └── ExportView.jsx        ← PDF-eksport
```
