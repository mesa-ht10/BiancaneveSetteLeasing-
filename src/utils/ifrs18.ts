import { Contract, Schedule } from "../types";

export interface IFRS18ReportingEntry {
  account: string;
  description: string;
  debit: number;
  credit: number;
  category: "OPERATING" | "FINANCING";
}

export interface IFRS18ContractRow {
  contractCode: string;
  description: string;
  category: string;
  isExempt: boolean;
  cashPaymentYr1: number;
  rouDepreciation: number;
  interest: number;
  leaseExpense: number;
}

export interface IFRS18Impact {
  // KPI
  capitalizedLeaseExpenseEquivalent: number;
  exemptLeaseExpense: number;
  totalLeaseExpenseEquivalent: number;
  rouDepreciation: number;
  leaseInterest: number;
  // CE Reclassification
  operatingLeaseCostPostIFRS16: number;
  amountReclassifiedOutsideMOL: number;
  // Detail
  contractBreakdown: IFRS18ContractRow[];
  // Reporting entries
  reportingEntries: IFRS18ReportingEntry[];
}

export function buildIFRS18Impact(
  contracts: Contract[],
  allSchedules: { c: Contract; s: Schedule }[]
): IFRS18Impact {
  let capitalizedLeaseExpenseEquivalent = 0;
  let exemptLeaseExpense = 0;
  let rouDepreciation = 0;
  let leaseInterest = 0;

  const contractBreakdown: IFRS18ContractRow[] = [];

  for (const { c, s } of allSchedules) {
    const rows = s.rows as any[];
    if (!rows.length) continue;

    // Consider first 12 months (or one full period if monthly)
    const freqMonths = s.freqMonths || 1;
    const yr1Periods = Math.round(12 / freqMonths);
    const yr1Rows = rows.slice(0, yr1Periods);

    if (s.isExempt) {
      const expense = yr1Rows.reduce((a: number, r: any) => a + r.payment, 0);
      exemptLeaseExpense += expense;
      contractBreakdown.push({
        contractCode: c.contractCode,
        description: c.description,
        category: c.leaseCategory,
        isExempt: true,
        cashPaymentYr1: expense,
        rouDepreciation: 0,
        interest: 0,
        leaseExpense: expense,
      });
    } else {
      const cashPayment = yr1Rows.reduce((a: number, r: any) => a + r.payment, 0);
      const depr = (s.rouAmortPerPeriod || 0) * yr1Periods;
      const interest = yr1Rows.reduce((a: number, r: any) => a + r.interest, 0);

      capitalizedLeaseExpenseEquivalent += cashPayment;
      rouDepreciation += depr;
      leaseInterest += interest;

      contractBreakdown.push({
        contractCode: c.contractCode,
        description: c.description,
        category: c.leaseCategory,
        isExempt: false,
        cashPaymentYr1: cashPayment,
        rouDepreciation: depr,
        interest,
        leaseExpense: 0,
      });
    }
  }

  const totalLeaseExpenseEquivalent = capitalizedLeaseExpenseEquivalent + exemptLeaseExpense;
  const operatingLeaseCostPostIFRS16 = rouDepreciation + exemptLeaseExpense;
  const amountReclassifiedOutsideMOL = leaseInterest;

  const reportingEntries: IFRS18ReportingEntry[] = [
    {
      account: "REP.DA.IFRS16",
      description: "Ammortamento ROU Asset — Costo Operativo",
      debit: rouDepreciation,
      credit: 0,
      category: "OPERATING",
    },
    {
      account: "REP.OPEX.LEASE",
      description: "Canoni Esenti — Lease Expense Operativo",
      debit: exemptLeaseExpense,
      credit: 0,
      category: "OPERATING",
    },
    {
      account: "REP.MOL.RECLASS",
      description: "Riclassifica Interessi → Financing (fuori MOL)",
      debit: 0,
      credit: leaseInterest,
      category: "OPERATING",
    },
    {
      account: "REP.FIN.LEASE",
      description: "Interessi su Lease Liability — Oneri Finanziari",
      debit: leaseInterest,
      credit: 0,
      category: "FINANCING",
    },
  ];

  return {
    capitalizedLeaseExpenseEquivalent,
    exemptLeaseExpense,
    totalLeaseExpenseEquivalent,
    rouDepreciation,
    leaseInterest,
    operatingLeaseCostPostIFRS16,
    amountReclassifiedOutsideMOL,
    contractBreakdown,
    reportingEntries,
  };
}
