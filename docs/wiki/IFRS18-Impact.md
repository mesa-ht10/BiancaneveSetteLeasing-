# IFRS18 Impact

La tab **IFRS18 Impact** analizza l'effetto del nuovo standard **IFRS18** (emesso IASB maggio 2024, obbligatorio dal 1° gennaio 2027) sulla presentazione del Conto Economico, in relazione ai contratti di leasing già registrati con IFRS16.

---

## Contesto Normativo

| Standard | Impatto |
|----------|---------|
| **IAS 1** (in vigore) | Presentazione libera dell'income statement. Le aziende potevano definire metriche non-GAAP (EBITDA, MOL) includendo o escludendo voci a propria discrezione. |
| **IFRS18** (dal 2027) | Introduce il subtotale obbligatorio **Operating Profit**. Gli interessi su leasing (IFRS16) devono essere classificati sotto OP nella categoria *Financing*, non più nell'area operativa. |

Il principale impatto pratico: le aziende che presentavano un "MOL/EBITDA" includendo gli interessi su Lease Liability vedranno questo indicatore **migliorare** per effetto della riclassifica obbligatoria.

---

## Funzione di Calcolo

```typescript
buildIFRS18Impact(contracts: Contract[], allSchedules: { c: Contract; s: Schedule }[]): IFRS18Impact
```

Localizzazione: `src/utils/ifrs18.ts`

### Campi restituiti

| Campo | Descrizione |
|-------|-------------|
| `capitalizedLeaseExpenseEquivalent` | Cash-flow yr1 dei contratti capitalizzati (proxy canone pre-IFRS16) |
| `exemptLeaseExpense` | Canoni yr1 dei contratti esenti (già in OPEX) |
| `totalLeaseExpenseEquivalent` | Somma dei due precedenti |
| `rouDepreciation` | Ammortamento ROU yr1 — classificato **OPERATING** (sopra OP) |
| `leaseInterest` | Interessi Lease Liability yr1 — classificato **FINANCING** (sotto OP) |
| `operatingLeaseCostPostIFRS16` | `rouDepreciation + exemptLeaseExpense` — impatto sul MOL post-IFRS18 |
| `amountReclassifiedOutsideMOL` | `leaseInterest` — importo che esce dal perimetro MOL |
| `contractBreakdown` | Dettaglio per contratto |
| `reportingEntries` | Scritture simulate sui conti `REP.*` |

---

## I 4 Blocchi della Tab

### 1 · KPI Cards

Cinque card colorate con i valori chiave del primo anno aggregati su tutti i contratti:

- 🔵 Canoni Capitalizzati Equiv.
- 🟡 Canoni Esenti (OPEX)
- 🟣 Totale Lease Equiv.
- 🟢 Ammortamento ROU
- 🔴 Interessi Lease → Financing

### 2 · Riclassificazione CE per Contratto

Tabella con una riga per contratto che mostra:

| Colonna | Contenuto |
|---------|-----------|
| Regime | `IFRS16` (capitalizzato) o `ESENTE` |
| Cash Yr1 | Flusso di cassa reale del primo anno |
| Amm.to ROU | Quota ammortamento ROU (solo contratti IFRS16) |
| Interessi | Oneri finanziari (solo contratti IFRS16) |
| Lease Exp. | Canone OPEX (solo contratti esenti) |
| ↓ MOL | Impatto sul Margine Operativo Lordo |

### 3 · MOL Bridge

Confronto visivo dell'impatto leasing sul MOL prima e dopo IFRS18:

```
Costo Lease Equivalente (proxy pre-IFRS16)      − € XXX
  Ammortamento ROU          (OPEX)               − € XXX
  Interessi lease           (Financing)          − € XXX
  Canoni esenti             (OPEX)               − € XXX
─────────────────────────────────────────────────────────
Contributo al MOL pre-IFRS18                     − € XXX
  Riclassifica IFRS18: Interessi → Financing     + € XXX
─────────────────────────────────────────────────────────
Contributo al MOL post-IFRS18                    − € XXX
                                    DELTA MOL  = + € XXX
```

### 4 · Scritture Simulate Reporting

| Conto | Descrizione | Dare | Avere | Categoria |
|-------|-------------|------|-------|-----------|
| `REP.DA.IFRS16` | Ammortamento ROU Asset | ✓ | — | OPERATING |
| `REP.OPEX.LEASE` | Canoni Esenti — Lease Expense | ✓ | — | OPERATING |
| `REP.MOL.RECLASS` | Riclassifica Interessi fuori MOL | — | ✓ | OPERATING |
| `REP.FIN.LEASE` | Interessi su Lease Liability | ✓ | — | FINANCING |

> I conti `REP.*` sono **simulati** per scopi di analisi. Non generano movimenti nel piano dei conti IFRS16.

---

## Note e Assunzioni

- I dati si riferiscono al **primo anno** di ciascun contratto (12 mesi dalla data di decorrenza)
- I contratti esenti (par. 5 IFRS16) mantengono il Lease Expense in OPEX sia pre che post IFRS18
- La tab è **sola lettura** e non richiede input aggiuntivi
- Applicazione obbligatoria IFRS18: **1° gennaio 2027**
