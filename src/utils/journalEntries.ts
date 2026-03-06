import { Contract, Schedule, JournalEntry, ScheduleRow } from "../types";
import { n } from "./formatters";

export function buildJE(c: Contract, schedule: Schedule | null): JournalEntry[] {
  if (!schedule) return [];
  const entries: JournalEntry[] = [];

  if (schedule.isExempt) {
    (schedule.rows as any[]).forEach((row: any) => {
      entries.push({
        date: row.date, type: "LEASE_EXPENSE", period: row.period,
        lines: [
          { account: c.accLeaseExpense || "64.02", desc: "Canone leasing (esenzione IFRS16)", debit: row.payment, credit: 0 },
          { account: "10.01 Banca", desc: "Pagamento canone", debit: 0, credit: row.payment },
        ],
      });
    });
    return entries;
  }

  const { liability0, rou0, rows } = schedule as { liability0: number; rou0: number; rows: ScheduleRow[] };
  const idc = n(c.initialDirectCosts), prepaid = n(c.prepaidAmount);
  const incentives = n(c.leaseIncentives), restoration = n(c.restorationProvision);

  const initLines = [
    { account: c.accROU || "02.01", desc: "ROU Asset — Lease Liability component", debit: liability0, credit: 0 },
    { account: c.accLeaseLiability || "22.01", desc: "Lease Liability iniziale", debit: 0, credit: liability0 },
  ];
  if (idc > 0) {
    initLines.push({ account: c.accROU || "02.01", desc: "ROU — Initial Direct Costs", debit: idc, credit: 0 });
    initLines.push({ account: "10.01 Banca", desc: "Pagamento IDC", debit: 0, credit: idc });
  }
  if (prepaid > 0) {
    initLines.push({ account: c.accROU || "02.01", desc: "ROU — Prepaid Payment", debit: prepaid, credit: 0 });
    initLines.push({ account: "10.01 Banca", desc: "Pagamento anticipato", debit: 0, credit: prepaid });
  }
  if (incentives > 0) {
    initLines.push({ account: c.accROU || "02.01", desc: "ROU — Incentivi (detrazione)", debit: 0, credit: incentives });
    initLines.push({ account: c.accIncentiveLiability || "33.01", desc: "Incentive Liability", debit: incentives, credit: 0 });
  }
  if (restoration > 0) {
    initLines.push({ account: c.accROU || "02.01", desc: "ROU — Restoration Provision", debit: restoration, credit: 0 });
    initLines.push({ account: c.accRestorationProvision || "34.01", desc: "Provision smantellamento", debit: 0, credit: restoration });
  }
  entries.push({ date: c.commencementDate, type: "INITIAL_RECOGNITION", period: 0, lines: initLines });

  (c.modifications || []).filter(m => m.applied).forEach(mod => {
    const diff = n(mod.remeasuredLiability) - n(mod.prevLiability);
    entries.push({
      date: mod.effectiveDate, type: "MODIFICATION", period: "MOD",
      lines: diff >= 0
        ? [{ account: c.accROU || "02.01", desc: "Rettifica ROU — Modifica " + mod.id, debit: Math.abs(diff), credit: 0 }, { account: c.accLeaseLiability || "22.01", desc: "Rettifica Lease Liability", debit: 0, credit: Math.abs(diff) }]
        : [{ account: c.accLeaseLiability || "22.01", desc: "Rettifica Lease Liability", debit: Math.abs(diff), credit: 0 }, { account: c.accROU || "02.01", desc: "Rettifica ROU — Modifica " + mod.id, debit: 0, credit: Math.abs(diff) }],
    });
  });

  rows.forEach((row: ScheduleRow) => {
    entries.push({
      date: row.date, type: "PAYMENT", period: row.period,
      lines: [
        { account: c.accInterestExp || "82.01", desc: "Interessi su Lease Liability", debit: row.interest, credit: 0 },
        { account: c.accLeaseLiability || "22.01", desc: "Rimborso quota capitale", debit: row.principal, credit: 0 },
        { account: "10.01 Banca", desc: "Pagamento canone (" + (c.postingFrequency || "MONTHLY") + ")", debit: 0, credit: row.payment },
      ],
    });
    entries.push({
      date: row.date, type: "DEPRECIATION", period: row.period,
      lines: [
        { account: c.accDepExp || "63.01", desc: "Ammortamento ROU Asset", debit: row.depreciation, credit: 0 },
        { account: "02.02 F.do Amm.ROU", desc: "Fondo ammortamento ROU", debit: 0, credit: row.depreciation },
      ],
    });
    if (row.isFX && Math.abs(row.fxDiff) > 0.01) {
      entries.push({
        date: row.date, type: "FX_DIFFERENCE", period: row.period,
        lines: row.fxDiff > 0
          ? [{ account: c.accFxDiff || "86.01", desc: "Diff. cambio su Lease Liability", debit: row.fxDiff, credit: 0 }, { account: c.accLeaseLiability || "22.01", desc: "Rettifica FX", debit: 0, credit: row.fxDiff }]
          : [{ account: c.accLeaseLiability || "22.01", desc: "Rettifica FX", debit: Math.abs(row.fxDiff), credit: 0 }, { account: c.accFxDiff || "86.01", desc: "Diff. cambio su Lease Liability", debit: 0, credit: Math.abs(row.fxDiff) }],
      });
    }
    if (c.splitCurrentNonCurrent && (row.currentLiab ?? 0) > 0) {
      entries.push({
        date: row.date, type: "RECLASSIFICATION", period: row.period,
        lines: [
          { account: c.accLeaseLiabilityNonCurrent || "22.01.NC", desc: "Riclassifica non corrente → corrente", debit: row.currentLiab!, credit: 0 },
          { account: c.accLeaseLiabilityCurrent || "22.01.C", desc: "Quota corrente", debit: 0, credit: row.currentLiab! },
        ],
      });
    }
  });
  return entries;
}
