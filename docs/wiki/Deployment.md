# Deployment

---

## Sviluppo Locale

### Prerequisiti

- Node.js ≥ 18
- npm ≥ 9

### Installazione e avvio

```bash
git clone https://github.com/mesa-ht10/BiancaneveSetteLeasing-.git
cd BiancaneveSetteLeasing-
npm install
npm run dev
```

L'app è disponibile su http://localhost:5173

### Variabili d'ambiente

| Variabile | Obbligatoria | Descrizione |
|-----------|-------------|-------------|
| `VITE_ANTHROPIC_API_KEY` | No (solo per AI) | API key Anthropic — usata solo in sviluppo locale, chiamata diretta dal browser |

Crea `.env.local` nella root (mai committare su git):
```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Build di Produzione

```bash
npm run build
```

Genera la cartella `dist/` con i file statici ottimizzati.

Il comando esegue in sequenza:
1. `tsc` — TypeScript type check
2. `vite build` — bundle + minify + ottimizzazione asset

---

## GitHub Actions (CI/CD)

Il workflow `.github/workflows/deploy.yml` si attiva ad ogni push su `main`:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:       # avvio manuale dal pannello Actions
```

### Steps del workflow

| Step | Azione |
|------|--------|
| Checkout | Clona il codice |
| Setup Node 20 | Installa Node.js con cache npm |
| npm ci | Installa dipendenze (versioni esatte da package-lock.json) |
| npm run build | Build Vite → cartella `dist/` |
| Upload artifact | Carica `dist/` come Pages artifact |
| Deploy | Pubblica su GitHub Pages |

### Permessi richiesti

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

---

## GitHub Pages

L'applicazione è pubblicata automaticamente su:

🔗 https://mesa-ht10.github.io/BiancaneveSetteLeasing-/

### Configurazione Vite per GitHub Pages

Per far funzionare i path degli asset su un subpath (non root), `vite.config.ts` ha:

```typescript
export default defineConfig({
  plugins: [react()],
  base: "/BiancaneveSetteLeasing-/",
});
```

Senza questo `base`, i file JS/CSS non verrebbero trovati dal browser.

### Limitazioni della demo pubblica

| Funzionalità | Disponibile |
|-------------|------------|
| Tutti i tab IFRS16 | ✅ |
| IFRS18 Impact | ✅ |
| Export CSV | ✅ |
| Persistenza dati (localStorage) | ✅ per utente |
| AI Chat | ❌ (API key non configurata) |
| Import PDF AI | ❌ (API key non configurata) |

---

## Vercel

Il branch `vercel-deploy` è configurato per il deployment su Vercel con proxy AI sicuro.

### Setup iniziale

1. Su [vercel.com](https://vercel.com) → **Add New Project** → importa il repo
2. Seleziona il branch **`vercel-deploy`** come production branch
3. Framework preset: **Vite** (rilevato automaticamente)
4. Build command: `npm run build` — Output dir: `dist`

### Variabili d'ambiente Vercel

Configurare in **Project Settings → Environment Variables**:

| Variabile | Descrizione |
|-----------|-------------|
| `ANTHROPIC_API_KEY` | API key Anthropic (server-side, mai esposta al browser) |
| `ALLOWED_ORIGIN` | URL del deployment, es. `https://tua-app.vercel.app` |

> Vedi [[Sicurezza]] per i dettagli sulle protezioni implementate.

### Differenze rispetto a GitHub Pages

| Aspetto | GitHub Pages (`main`) | Vercel (`vercel-deploy`) |
|---------|----------------------|--------------------------|
| Hosting | Statico | Statico + Edge Functions |
| AI Chat | Chiave nel browser | Chiave solo server-side |
| Security headers | Nessuno | Configurati in `vercel.json` |
| `vite.config.ts` base | `/BiancaneveSetteLeasing-/` | `/` (root) |

---

## Aggiornare il Deployment

Ogni `git push origin main` rideploya automaticamente GitHub Pages in circa 2 minuti. Lo stato è visibile nel tab **Actions** del repository GitHub.

Per Vercel, ogni push su `vercel-deploy` attiva un nuovo deployment automatico.
