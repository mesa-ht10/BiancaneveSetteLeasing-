# 🍎 Biancaneve e i 7 Leasing — IFRS16 POC

Applicazione web per la gestione dei contratti di leasing secondo lo standard **IFRS16**, sviluppata con React + Vite + TypeScript + Tailwind CSS.

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

### 🤖 AI Assistant
- Chat integrata con **Claude** (Anthropic) per guidance IFRS16
- Import automatico dati da PDF di contratto tramite AI
- Risposte contestualizzate al contratto selezionato

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
| Storage | `window.storage` (persistenza locale) |

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
├── constants/                     # Costanti IFRS16 (categorie, valute, ecc.)
├── types/                         # Interfacce TypeScript
├── utils/
│   ├── calculations.ts            # Engine calcolo ROU, Liability, schedule
│   ├── journalEntries.ts          # Generazione scritture contabili
│   ├── formatters.ts              # Formattazione numeri e date
│   ├── validation.ts              # Validazione form contratto
│   ├── ai.ts                      # Integrazione API Anthropic
│   ├── storage.ts                 # Persistenza dati
│   └── demoData.ts                # Contratti demo precaricati
└── components/
    ├── ui/                        # Atomi (Badge, Field, Input, Toggle, ecc.)
    ├── ContractForm.tsx           # Form contratto multi-sezione
    ├── AIChatPanel.tsx            # Chat AI IFRS16
    ├── AIImportModal.tsx          # Import PDF via AI
    ├── ModificationModal.tsx      # Modifica contratto (par. 44-46)
    ├── CSVModal.tsx               # Preview export CSV
    └── tabs/                      # Un componente per ciascuna delle 6 tab
```

---

## Note

- I dati sono persistiti localmente tramite `window.storage`. In assenza di dati salvati, vengono caricati 3 contratti demo (immobile, veicoli, IT equipment).
- Le funzionalità AI richiedono una API key Anthropic valida e una connessione internet.
- Il progetto è un **POC** (Proof of Concept) a scopo dimostrativo.
