# 🍎 Biancaneve e i 7 Leasing — Wiki

Benvenuto nella documentazione dell'applicazione **MESA Biancaneve e i 7 Leasing**, un POC (Proof of Concept) per la gestione dei contratti di leasing secondo gli standard **IFRS16** e l'analisi di impatto **IFRS18**.

🌐 **Demo live:** https://mesa-ht10.github.io/BiancaneveSetteLeasing-/
📦 **Repository:** https://github.com/mesa-ht10/BiancaneveSetteLeasing-

---

## Indice

| Pagina | Contenuto |
|--------|-----------|
| [[Architettura]] | Stack tecnologico, struttura del progetto, flusso dei dati |
| [[Contratti]] | Censimento, form, opzioni contrattuali, esenzioni |
| [[IFRS16-Engine]] | Calcolo ROU Asset, Lease Liability, ammortamento, FX |
| [[Journal-Entries]] | Scritture contabili generate automaticamente |
| [[Financial-Statements]] | Balance Sheet, P&L, Maturity Analysis |
| [[Modifiche-Contrattuali]] | Remeasurement, par. 44-46 IFRS16 |
| [[IFRS18-Impact]] | Riclassificazione CE, MOL Bridge, scritture simulate |
| [[AI-Assistant]] | Chat IFRS16, import PDF, configurazione API key |
| [[Export]] | Export CSV piano, JE, riepilogo contratti |
| [[Deployment]] | Avvio locale, GitHub Actions, GitHub Pages |

---

## Panoramica dell'applicazione

L'applicazione è composta da **7 tab** di navigazione:

```
Contratti → Piano Ammortamento → Journal Entries → Financial Statements
→ Modifiche → Export → IFRS18 Impact
```

Ogni tab lavora sul medesimo dataset di contratti caricati in memoria e persistiti in `localStorage`. Non è richiesto alcun backend: tutta la logica è client-side.

---

## Quick Start

```bash
git clone https://github.com/mesa-ht10/BiancaneveSetteLeasing-.git
cd BiancaneveSetteLeasing-
npm install
# Crea .env.local con la tua API key Anthropic (opzionale, solo per AI)
npm run dev
```

Al primo avvio vengono caricati **3 contratti demo**:
- `LEA-2024-001` — Uffici Milano (PROPERTY, 59 mesi, 3.5%)
- `LEA-2024-002` — Flotta Auto 3 Veicoli (VEHICLE, 35 mesi, 4.2%)
- `LEA-2024-003` — Server Farm IT Equipment (IT_EQUIPMENT, 47 mesi, 5.0%)
