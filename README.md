# 🍎 Biancaneve e i 7 Leasing — IFRS16 + IFRS18 POC

Applicazione web per la gestione dei contratti di leasing secondo lo standard **IFRS16** con analisi di impatto **IFRS18**, sviluppata con React + Vite + TypeScript + Tailwind CSS.

🌐 **Demo live:** [https://mesa-ht10.github.io/BiancaneveSetteLeasing-/](https://mesa-ht10.github.io/BiancaneveSetteLeasing-/)

---

## Funzionalità

### 📄 Gestione Contratti
- Censimento completo dei contratti di leasing (immobili, veicoli, IT, macchinari, ecc.)
- Supporto a opzioni contrattuali: acquisto, recesso, rinnovo
- Gestione esenzioni short-term (≤12 mesi) e low-value (par. 5 IFRS16)
- Mapping conti GL personalizzabile per ogni contratto
- Classificazione per centro di costo e business unit

### 📊 Piano di Ammortamento
- Calcolo automatico del **ROU Asset** e della **Lease Liability** iniziali
- Schedule completo con interessi, quota capitale, ammortamento ROU
- Supporto pagamenti in anticipo (ADVANCE) e in posticipo (ARREARS)
- Split corrente / non corrente della Lease Liability
- Gestione differenze cambio (FX) per contratti in valuta estera

### 📒 Journal Entries
- Generazione automatica delle scritture contabili IFRS16:
  - Rilevazione iniziale (Initial Recognition)
  - Pagamenti periodici (interesse + rimborso capitale)
  - Ammortamento ROU Asset
  - Differenze di cambio
  - Riclassifiche corrente/non corrente
  - Concessioni leasing (Lease Expense per contratti esenti)
- Filtro per tipologia di scrittura
- Export CSV completo

### 📈 Financial Statements
- **Balance Sheet**: impatto ROU Asset e Lease Liability (corrente/non corrente)
- **P&L**: ammortamento, interessi e lease expense del primo anno
- **Maturity Analysis**: cash flow non attualizzati per fasce temporali (par. 58 IFRS16)

### ⚡ Modifiche Contrattuali
- Gestione modifiche ex par. 44-46 IFRS16 (cambio canone, tasso, durata, scope)
- Calcolo automatico del **remeasurement** della Lease Liability
- Preview delta pre/post modifica con IBR aggiornato

### 📐 IFRS18 Impact *(nuovo)*
Analisi dell'impatto del nuovo standard **IFRS18** (emesso IASB maggio 2024, obbligatorio dal 1° gennaio 2027) sulla riclassificazione del conto economico. Aggregata su tutti i contratti, sola lettura.

- **KPI Cards** — primo anno aggregato:
  - Canoni capitalizzati equivalenti (cash-flow proxy pre-IFRS16)
  - Canoni esenti in OPEX (short-term / low-value)
  - Totale lease expense equivalente
  - Ammortamento ROU Asset (costo operativo — sopra MOL)
  - Interessi Lease Liability (→ Financing post-IFRS18)

- **Riclassificazione CE per contratto** — tabella dettagliata con cash yr1, ammortamento ROU, interessi, lease expense esenti e impatto sul MOL per ciascun contratto

- **MOL Bridge** — confronto visivo pre/post IFRS18:
  - Contributo al MOL pre-IFRS18 (ammortamento + interessi + canoni esenti)
  - Riclassifica interessi → Financing (par. 45 IFRS18)
  - Contributo al MOL post-IFRS18 (solo ammortamento + canoni esenti)
  - Delta MOL (miglioramento per uscita degli interessi dal perimetro operativo)

- **Scritture Simulate Reporting** — conti mock IFRS18:
  - `REP.DA.IFRS16` — Ammortamento ROU Asset (OPERATING)
  - `REP.OPEX.LEASE` — Canoni Esenti / Lease Expense (OPERATING)
  - `REP.MOL.RECLASS` — Riclassifica interessi fuori MOL (OPERATING)
  - `REP.FIN.LEASE` — Interessi su Lease Liability (FINANCING)

- **Note e Assunzioni** — box con riferimenti normativi e ipotesi di calcolo

### 🤖 AI Assistant
- Chat integrata con **Claude** (Anthropic) per guidance IFRS16
- Import automatico dati da PDF di contratto tramite AI
- Risposte contestualizzate al contratto selezionato
- Richiede API key Anthropic (configurabile localmente via `.env.local`)

### 📤 Export
- Export CSV: piano ammortamento, journal entries, riepilogo tutti i contratti

---

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| AI | Anthropic Claude API (browser-direct) |
| Storage | `localStorage` (persistenza locale per browser) |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Demo Live

L'applicazione è pubblicata automaticamente su GitHub Pages ad ogni push su `main`:

🔗 [https://mesa-ht10.github.io/BiancaneveSetteLeasing-/](https://mesa-ht10.github.io/BiancaneveSetteLeasing-/)

> Le funzionalità AI non sono attive sulla demo pubblica: richiedono una API key Anthropic configurata localmente.

---

## Avvio in locale

### Prerequisiti
- Node.js ≥ 18
- Una API key Anthropic (per le funzionalità AI)

### Installazione

```bash
git clone https://github.com/mesa-ht10/BiancaneveSetteLeasing-.git
cd BiancaneveSetteLeasing-
npm install
```

### Configurazione API Key

Crea il file `.env.local` nella root del progetto:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> ⚠️ Non committare mai `.env.local` — è già incluso nel `.gitignore`.

### Avvio

```bash
npm run dev
```

L'app sarà disponibile su [http://localhost:5173](http://localhost:5173).

---

## Struttura del Progetto

```
src/
├── App.tsx                        # Root: stato globale e layout
├── vite-env.d.ts                  # Tipi Vite (import.meta.env)
├── constants/                     # Costanti IFRS16 (categorie, valute, tab, ecc.)
├── types/                         # Interfacce TypeScript
├── utils/
│   ├── calculations.ts            # Engine calcolo ROU, Liability, schedule
│   ├── journalEntries.ts          # Generazione scritture contabili IFRS16
│   ├── ifrs18.ts                  # Calcolo impatto IFRS18 (buildIFRS18Impact)
│   ├── formatters.ts              # Formattazione numeri e date
│   ├── validation.ts              # Validazione form contratto
│   ├── ai.ts                      # Integrazione API Anthropic
│   ├── storage.ts                 # Persistenza dati (localStorage)
│   └── demoData.ts                # Contratti demo precaricati
└── components/
    ├── ui/                        # Atomi (Badge, Field, Input, Toggle, ecc.)
    ├── ContractForm.tsx           # Form contratto multi-sezione
    ├── AIChatPanel.tsx            # Chat AI IFRS16
    ├── AIImportModal.tsx          # Import PDF via AI
    ├── ModificationModal.tsx      # Modifica contratto (par. 44-46)
    ├── CSVModal.tsx               # Preview export CSV
    └── tabs/                      # Un componente per ciascuna delle 7 tab
        ├── ContractsTab.tsx
        ├── AmortizationTab.tsx
        ├── JournalEntriesTab.tsx
        ├── FinancialStatementsTab.tsx
        ├── ModificationsTab.tsx
        ├── ExportTab.tsx
        └── IFRS18Tab.tsx          # Analisi impatto IFRS18
```

---

## CI/CD

Il progetto usa **GitHub Actions** per il deploy automatico su GitHub Pages:

```
.github/workflows/deploy.yml
```

Ogni push su `main` trigera:
1. `npm ci` — installa dipendenze
2. `npm run build` — build Vite (con TypeScript check)
3. Deploy della cartella `dist/` su GitHub Pages

---

## Note

- I dati sono persistiti localmente tramite `localStorage`. In assenza di dati salvati, vengono caricati 3 contratti demo (immobile, veicoli, IT equipment).
- Le funzionalità AI richiedono una API key Anthropic valida e una connessione internet. Non sono attive nella demo pubblica su GitHub Pages.
- La tab **IFRS18 Impact** è di sola lettura e non richiede input aggiuntivi: elabora i dati già presenti nei contratti IFRS16 caricati.
- Il progetto è un **POC** (Proof of Concept) a scopo dimostrativo. IFRS18 applicazione obbligatoria dal 1° gennaio 2027.
