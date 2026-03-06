# Architettura

## Stack Tecnologico

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| Framework UI | React | 18 |
| Linguaggio | TypeScript | 5 |
| Build tool | Vite | 5 |
| Styling | Tailwind CSS | 3 |
| AI | Anthropic Claude API | claude-sonnet-4 |
| Storage | localStorage (browser) | — |
| CI/CD | GitHub Actions | — |
| Hosting | GitHub Pages | — |

---

## Struttura del Progetto

```
BiancaneveSetteLeasing/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build + deploy su GitHub Pages
├── src/
│   ├── App.tsx                 # Root: stato globale, routing tab, KPI aggregati
│   ├── vite-env.d.ts           # Tipi Vite (import.meta.env)
│   ├── index.css               # Tailwind directives
│   ├── main.tsx                # Entry point React
│   ├── constants/
│   │   └── index.ts            # NAV_TABS, LEASE_CATEGORIES, CURRENCIES, ecc.
│   ├── types/
│   │   └── index.ts            # Interfacce TS: Contract, Schedule, JournalEntry, ecc.
│   ├── utils/
│   │   ├── calculations.ts     # Engine IFRS16: buildSchedule, calcPV, getPeriodicRate
│   │   ├── journalEntries.ts   # buildJE: genera tutte le scritture IFRS16
│   │   ├── ifrs18.ts           # buildIFRS18Impact: analisi riclassificazione CE
│   │   ├── formatters.ts       # fmt, fmtDate, monthsBetween, addMonths
│   │   ├── validation.ts       # validateContract: regole di validazione form
│   │   ├── ai.ts               # askAIAssistant, analyzeLeasePDF
│   │   ├── storage.ts          # loadContracts, persistContracts (localStorage)
│   │   └── demoData.ts         # EMPTY template + DEMO_CONTRACTS (3 contratti)
│   └── components/
│       ├── ui/                 # Atomi riusabili (Badge, Field, Toggle, ecc.)
│       ├── ContractForm.tsx    # Form multi-sezione (9 sezioni)
│       ├── AIChatPanel.tsx     # Chat AI IFRS16 (pannello floating)
│       ├── AIImportModal.tsx   # Import contratto da PDF via AI
│       ├── ModificationModal.tsx  # Modifica contratto (remeasurement)
│       ├── CSVModal.tsx        # Preview e download export CSV
│       └── tabs/
│           ├── ContractsTab.tsx
│           ├── AmortizationTab.tsx
│           ├── JournalEntriesTab.tsx
│           ├── FinancialStatementsTab.tsx
│           ├── ModificationsTab.tsx
│           ├── ExportTab.tsx
│           └── IFRS18Tab.tsx
├── .env.local                  # NON committato — API key locale
├── .env.example                # Template variabili d'ambiente
├── vite.config.ts              # base: "/BiancaneveSetteLeasing-/"
├── tsconfig.json
└── package.json
```

---

## Flusso dei Dati

```
localStorage
    │
    ▼
App.tsx (useState<Contract[]>)
    │
    ├──► buildSchedule(contract)     → Schedule (ROU, Liability, rows)
    ├──► buildJE(contract, schedule) → JournalEntry[]
    ├──► buildIFRS18Impact(contracts, allSchedules) → IFRS18Impact
    │
    ▼
Tab components (solo lettura, props-down)
```

Lo stato è interamente in `App.tsx`. I tab component ricevono dati via props e non modificano mai lo stato direttamente — invocano callback (`onSave`, `onDelete`, ecc.) che risalgono ad `App.tsx`.

---

## Persistenza

I contratti sono salvati in `localStorage` con la chiave `mesa_ifrs16_v4`. La serializzazione avviene in `utils/storage.ts` ad ogni modifica dello stato (`useEffect` su `contracts`).

In assenza di dati salvati, vengono caricati i 3 contratti demo da `utils/demoData.ts`.
