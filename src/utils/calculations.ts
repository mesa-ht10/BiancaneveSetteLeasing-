import { Contract, Schedule, ScheduleRow } from "../types";
import { FREQ_MONTHS } from "../constants";
import { monthsBetween, addMonths, n } from "./formatters";

export function getPeriodicRate(annualRate: number, freq: string): number {
  const months = FREQ_MONTHS[freq] || 1;
  return Math.pow(1 + annualRate / 100, months / 12) - 1;
}

export function calcLeaseTerm(c: Contract): number {
  let t = monthsBetween(c.commencementDate, c.endDate);
  if (c.renewalOption && c.renewalOptionReasonablyCertain) t += parseInt(c.renewalOptionMonths || "0");
  if (c.terminationOption && c.terminationOptionReasonablyCertain && c.terminationOptionDate) {
    const tm = monthsBetween(c.commencementDate, c.terminationOptionDate);
    if (tm > 0) t = Math.min(t, tm);
  }
  if (c.purchaseOption && c.purchaseOptionReasonablyCertain && c.purchaseOptionDate) {
    const pm = monthsBetween(c.commencementDate, c.purchaseOptionDate);
    if (pm > 0) t = Math.min(t, pm);
  }
  return t;
}

export function calcAmortTerm(c: Contract, leaseTermMonths: number): number {
  if (c.ownershipTransferLikely || c.purchaseOptionReasonablyCertain) {
    const ul = parseInt(c.usefulLifeMonths || "0");
    if (ul > 0) return ul;
  }
  return leaseTermMonths;
}

export function calcPV(payments: { amount: number; t: number }[], periodicRate: number): number {
  return payments.reduce((pv, { amount, t }) => pv + amount / Math.pow(1 + periodicRate, t), 0);
}

export function getPeriodFxRate(contract: Contract, periodIndex: number): number {
  if (Array.isArray(contract.fxRates) && contract.fxRates[periodIndex] != null) {
    return contract.fxRates[periodIndex];
  }
  return n(contract.fxRate || 1) * Math.pow(1.001, periodIndex);
}

function buildExemptSchedule(c: Contract): Schedule {
  const freq = c.postingFrequency || "MONTHLY";
  const freqMonths = FREQ_MONTHS[freq];
  const leaseTermMonths = calcLeaseTerm(c);
  const pmt = n(c.basePaymentAmount);
  const rows = [];
  for (let m = 0; m < leaseTermMonths; m += freqMonths) {
    rows.push({ period: Math.floor(m / freqMonths) + 1, date: addMonths(c.commencementDate, m), payment: pmt * freqMonths, isExempt: true });
  }
  return { isExempt: true, rows: rows as any, leaseTermMonths, freqMonths, totalExpense: rows.reduce((s, r) => s + r.payment, 0) };
}

export function buildSchedule(c: Contract): Schedule | null {
  if (c.exemptShortTerm || c.exemptLowValue) return buildExemptSchedule(c);
  const freq = c.postingFrequency || "MONTHLY";
  const freqMonths = FREQ_MONTHS[freq];
  const leaseTermMonths = calcLeaseTerm(c);
  if (!leaseTermMonths) return null;
  const annualRate = n(c.discountRateAnnual);
  if (!annualRate) return null;
  const periodicRate = getPeriodicRate(annualRate, freq);
  const pmt = n(c.basePaymentAmount) * freqMonths;
  if (!pmt) return null;
  const numPeriods = Math.ceil(leaseTermMonths / freqMonths);
  const isFX = c.leaseCurrency !== c.companyLocalCurrency;

  const mods = (c.modifications || []).filter(m => m.applied).sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());

  const pmtStream: { amount: number; t: number }[] = [];
  for (let i = 1; i <= numPeriods; i++) {
    const t = c.paymentTiming === "ADVANCE" ? i - 1 : i;
    if (t >= 0) pmtStream.push({ amount: pmt, t });
  }
  if (c.purchaseOptionReasonablyCertain && n(c.purchaseOptionPrice) > 0)
    pmtStream.push({ amount: n(c.purchaseOptionPrice), t: numPeriods });

  const liability0 = calcPV(pmtStream, periodicRate) * (n(c.fxRate) || 1);
  const idc = n(c.initialDirectCosts);
  const prepaid = n(c.prepaidAmount);
  const incentives = n(c.leaseIncentives);
  const restoration = n(c.restorationProvision);
  const rou0 = liability0 + prepaid - incentives + idc + restoration;
  const amortTermMonths = calcAmortTerm(c, leaseTermMonths);
  const amortPeriods = Math.ceil(amortTermMonths / freqMonths);
  const rouAmortPerPeriod = rou0 / amortPeriods;

  let liab = liability0;
  let rouAccAmort = 0;
  const rows: ScheduleRow[] = [];

  for (let i = 1; i <= numPeriods; i++) {
    const periodDate = addMonths(c.commencementDate, (i - 1) * freqMonths);

    const activeMod = mods.filter(m => monthsBetween(c.commencementDate, m.effectiveDate) <= (i - 1) * freqMonths).slice(-1)[0] || null;
    const effectivePmt = (activeMod && n(activeMod.newPaymentAmount)) ? n(activeMod.newPaymentAmount) * freqMonths : pmt;
    const effectiveRate = (activeMod && n(activeMod.newDiscountRate)) ? getPeriodicRate(n(activeMod.newDiscountRate), freq) : periodicRate;

    let interest: number, principal: number, closingLiab: number;
    if (c.paymentTiming === "ADVANCE") {
      const liabAfterPayment = Math.max(0, liab - effectivePmt);
      interest = liabAfterPayment * effectiveRate;
      principal = effectivePmt;
      closingLiab = liabAfterPayment;
    } else {
      interest = liab * effectiveRate;
      principal = Math.max(0, effectivePmt - interest);
      closingLiab = Math.max(0, liab - principal);
    }

    rouAccAmort += rouAmortPerPeriod;
    const rouNet = Math.max(0, rou0 - rouAccAmort);

    let fxDiff = 0;
    if (isFX) {
      const prevRate = getPeriodFxRate(c, i - 1);
      const currRate = getPeriodFxRate(c, i);
      fxDiff = closingLiab * (currRate - prevRate) / currRate;
    }

    rows.push({
      period: i, date: periodDate, freqMonths,
      openingLiab: liab, interest, principal,
      payment: effectivePmt, closingLiab, rouGross: rou0, rouAccAmort, rouNet,
      depreciation: rouAmortPerPeriod, fxDiff, isFX,
      modApplied: activeMod ? activeMod.id : null,
    });
    liab = closingLiab;
  }

  const periodsIn12m = Math.round(12 / freqMonths);
  rows.forEach((row, idx) => {
    const nextRows = rows.slice(idx + 1, idx + 1 + periodsIn12m);
    row.currentLiab = nextRows.reduce((s, r) => s + r.principal, 0);
    row.nonCurrentLiab = Math.max(0, row.closingLiab - row.currentLiab);
  });

  return { liability0, rou0, rouAmortPerPeriod, leaseTermMonths, amortTermMonths, numPeriods, freqMonths, rows, isFX, annualRate, periodicRate };
}
