# Journal Entries

La funzione `buildJE(contract, schedule)` in `src/utils/journalEntries.ts` genera automaticamente tutte le scritture contabili IFRS16 per un contratto.

---

## Tipologie di Scritture Generate

### 1. Initial Recognition (tipo `INITIAL`)

Generata alla data di decorrenza del contratto. Rileva il ROU Asset e la Lease Liability iniziali.

| Conto | Dare | Avere |
|-------|------|-------|
| `accROU` (ROU Asset) | ROU₀ | — |
| `accLeaseLiability` (Lease Liability) | — | Liability₀ |
| `accIFRS16Clearing` (Clearing) | — | delta (IDC, prepaid, incentivi, ecc.) |

### 2. Periodic Payment (tipo `PAYMENT`)

Generata ad ogni scadenza del canone. Separa la quota interessi dalla quota capitale.

| Conto | Dare | Avere |
|-------|------|-------|
| `accInterestExp` (Interessi passivi) | interest | — |
| `accLeaseLiability` (Lease Liability) | principal | — |
| Cassa / Debiti vs Locatore | — | payment |

### 3. Depreciation (tipo `DEPRECIATION`)

Generata ad ogni periodo per l'ammortamento del ROU Asset.

| Conto | Dare | Avere |
|-------|------|-------|
| `accDepExp` (Amm.to ROU) | depreciation | — |
| `accROU` (ROU Asset — fondo) | — | depreciation |

### 4. FX Difference (tipo `FX_DIFF`)

Generata solo per contratti in valuta estera, quando la Lease Liability viene rimisurata al cambio corrente.

| Conto | Dare/Avere | Importo |
|-------|-----------|---------|
| `accLeaseLiability` | Dare o Avere | `|fxDiff|` |
| `accFxDiff` (Diff. cambio) | Avere o Dare | `|fxDiff|` |

### 5. Current/Non-Current Reclassification (tipo `RECLASS`)

Generata quando `splitCurrentNonCurrent = true`. Riclassifica la Lease Liability tra corrente e non corrente.

| Conto | Dare | Avere |
|-------|------|-------|
| `accLeaseLiabilityNonCurrent` | nonCurrentLiab | — |
| `accLeaseLiabilityCurrent` | currentLiab | — |
| `accLeaseLiability` | — | totLiab |

### 6. Lease Expense (tipo `LEASE_EXPENSE`)

Generata solo per contratti **esenti** (short-term / low-value). Registra il canone come costo operativo semplice.

| Conto | Dare | Avere |
|-------|------|-------|
| `accLeaseExpense` (Lease Expense) | payment | — |
| Cassa / Debiti vs Locatore | — | payment |

---

## Filtro per Tipologia

Nella tab **Journal Entries** è possibile filtrare le scritture per tipo:

| Filtro | Tipo |
|--------|------|
| Tutti | — |
| Rilevazione iniziale | `INITIAL` |
| Pagamenti | `PAYMENT` |
| Ammortamento | `DEPRECIATION` |
| Diff. cambio | `FX_DIFF` |
| Riclassifica | `RECLASS` |
| Lease Expense | `LEASE_EXPENSE` |

---

## Mapping Conti GL

I conti sono configurabili per ogni contratto nella sezione **Mapping GL** del form:

| Campo | Default suggerito |
|-------|------------------|
| `accROU` | ROU Asset per categoria (es. `16.ROU.PROP`) |
| `accLeaseLiability` | `20.LLEAS` |
| `accInterestExp` | `63.INT.LEASE` |
| `accDepExp` | `68.DEP.ROU` |
| `accLeaseExpense` | `63.LEASE.EXP` |
| `accFxDiff` | `86.FX.LEASE` |
| `accIFRS16Clearing` | `29.IFRS16.CLEAR` |
