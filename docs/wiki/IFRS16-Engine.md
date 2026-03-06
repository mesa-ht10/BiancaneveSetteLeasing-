# IFRS16 Engine

Il cuore dell'applicazione è la funzione `buildSchedule(contract)` in `src/utils/calculations.ts`, che implementa il modello contabile IFRS16 per contratti di leasing capitalizzati.

---

## Calcolo della Lease Liability Iniziale

La Lease Liability iniziale è il **valore attuale** dei canoni futuri, attualizzato al tasso di sconto del contratto (IBR o tasso implicito):

```
Liability₀ = Σ [ Canone_t / (1 + r_periodo)^t ]
```

dove:
- `r_periodo` = tasso periodico ricavato dal tasso annuale e dalla base di conteggio giorni (ACT/365, ACT/360, 30/360)
- `t` = periodo (mensile, trimestrale, semestrale)
- Il calcolo tiene conto del timing dei pagamenti (ARREARS / ADVANCE)

### Aggiustamenti alla Liability₀

| Voce | Effetto |
|------|---------|
| Costi diretti iniziali (`initialDirectCosts`) | + aggiunti al ROU Asset |
| Pagamenti anticipati (`prepaidAmount`) | + aggiunti al ROU Asset |
| Incentivi leasing (`leaseIncentives`) | − sottratti al ROU Asset |
| Fondo ripristino (`restorationProvision`) | + aggiunti al ROU Asset |

---

## Calcolo del ROU Asset

```
ROU₀ = Liability₀ + initialDirectCosts + prepaidAmount - leaseIncentives + restorationProvision
```

---

## Schedule di Ammortamento

Per ogni periodo viene calcolata una riga con:

| Campo | Formula |
|-------|---------|
| `openingLiab` | Liability a inizio periodo |
| `interest` | `openingLiab × r_periodo` |
| `payment` | Canone del periodo |
| `principal` | `payment − interest` (ARREARS) |
| `closingLiab` | `openingLiab − principal` |
| `depreciation` | `ROU₀ / periodi_ammortamento` |
| `rouNet` | ROU lordo − ammortamento cumulato |
| `currentLiab` | Somma principal dei prossimi 12 mesi |
| `nonCurrentLiab` | `closingLiab − currentLiab` |

### Durata di ammortamento del ROU

La durata è il **minore** tra:
- Durata del leasing (lease term)
- Vita utile dell'asset (`usefulLifeMonths`) — se il trasferimento di proprietà è probabile o l'opzione di acquisto è ragionevolmente certa

---

## Gestione Opzioni Contrattuali

| Opzione | Effetto sul lease term |
|---------|----------------------|
| Rinnovo (`renewalOption`) | `+renewalOptionMonths` se `renewalOptionReasonablyCertain = true` |
| Recesso (`terminationOption`) | Durata ridotta alla `terminationOptionDate` se `terminationOptionReasonablyCertain = true` |
| Acquisto (`purchaseOption`) | ROU ammortizzato sulla vita utile asset se `purchaseOptionReasonablyCertain = true` |

---

## Contratti Esenti (par. 5 IFRS16)

I contratti con `exemptShortTerm = true` (durata ≤ 12 mesi) o `exemptLowValue = true` (valore basso) **non** vengono capitalizzati. Viene generato uno schedule semplificato con solo il canone periodico (`buildExemptSchedule`), che appare come **Lease Expense** nel P&L.

---

## Gestione FX

Per contratti in valuta diversa dalla valuta funzionale (`leaseCurrency ≠ companyLocalCurrency`):
- La Lease Liability è rimisurata ad ogni periodo al tasso di cambio corrente
- La differenza genera una riga `fxDiff` nello schedule
- In Journal Entries viene generata una scrittura separata su `accFxDiff`

I tassi FX possono essere inseriti manualmente (array `fxRates`) o usare un tasso fisso (`fxRate`).

---

## Basi di Conteggio Giorni

| Base | Formula tasso periodico |
|------|------------------------|
| ACT/365 | `(1 + r_annuale)^(giorni/365) - 1` |
| ACT/360 | `(1 + r_annuale)^(giorni/360) - 1` |
| 30/360 | `r_annuale × (30/360) × freq_mesi` |
