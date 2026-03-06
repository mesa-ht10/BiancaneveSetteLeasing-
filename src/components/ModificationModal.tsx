import { useState, useMemo } from "react";
import { Contract, Modification, Schedule, ScheduleRow } from "../types";
import { FREQ_MONTHS } from "../constants";
import { monthsBetween, n, fmt } from "../utils/formatters";
import { getPeriodicRate, calcPV } from "../utils/calculations";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Sel } from "./ui/Sel";

interface ModificationModalProps {
  contract: Contract;
  schedule: Schedule | null;
  onSave: (mod: Modification) => void;
  onCancel: () => void;
}

const TYPES = [
  { value: "PAYMENT_CHANGE", label: "Cambio canone (par. 42b)" },
  { value: "RATE_CHANGE", label: "Cambio tasso (par. 43)" },
  { value: "TERM_CHANGE", label: "Modifica durata (par. 40a)" },
  { value: "SCOPE_INCREASE", label: "Aumento scope (par. 44)" },
  { value: "SCOPE_DECREASE", label: "Riduzione scope (par. 46a)" },
  { value: "COVID_CONCESSION", label: "Concessione Covid (par. 46A)" },
];

export function ModificationModal({ contract, schedule, onSave, onCancel }: ModificationModalProps) {
  const [mod, setMod] = useState({
    id: "MOD-" + Date.now(), effectiveDate: "", type: "PAYMENT_CHANGE",
    newPaymentAmount: "", newDiscountRate: "", reason: "",
    remeasuredLiability: 0, prevLiability: 0, applied: false,
  });
  const setF = (k: string, v: string) => setMod(p => ({ ...p, [k]: v }));

  const prevLiab = useMemo(() => {
    if (!schedule || schedule.isExempt || !mod.effectiveDate) return 0;
    const rows = schedule.rows as ScheduleRow[];
    const pastRows = rows.filter(r => new Date(r.date) <= new Date(mod.effectiveDate));
    return pastRows.length > 0 ? pastRows[pastRows.length - 1].closingLiab : (schedule.liability0 ?? 0);
  }, [schedule, mod.effectiveDate]);

  const newLiab = useMemo(() => {
    if (!mod.effectiveDate || !mod.newPaymentAmount) return prevLiab;
    const remMonths = monthsBetween(mod.effectiveDate, contract.endDate);
    const freq = contract.postingFrequency || "MONTHLY";
    const freqMonths = FREQ_MONTHS[freq];
    const rate = getPeriodicRate(n(mod.newDiscountRate) || n(contract.discountRateAnnual), freq);
    const pmt = n(mod.newPaymentAmount) * freqMonths;
    const periods = Math.ceil(remMonths / freqMonths);
    const stream: { amount: number; t: number }[] = [];
    for (let i = 1; i <= periods; i++) stream.push({ amount: pmt, t: i });
    return calcPV(stream, rate);
  }, [mod, contract, prevLiab]);

  const diff = newLiab - prevLiab;

  const handleSave = () => {
    onSave({ ...mod, prevLiability: prevLiab, remeasuredLiability: newLiab, applied: true });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-2xl flex items-center justify-between">
          <div>
            <div className="text-white font-bold">Modifica Contratto IFRS16</div>
            <div className="text-orange-100 text-xs">Par. 44-46 IFRS16 — Lease Modifications</div>
          </div>
          <button onClick={onCancel} className="text-white/70 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Una modifica cambia scope o corrispettivo. Il remeasurement usa il tasso IBR aggiornato (par. 45c).
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo Modifica"><Sel value={mod.type} onChange={v => setF("type", v)} options={TYPES} /></Field>
            <Field label="Data Effettiva" required><Input type="date" value={mod.effectiveDate} onChange={v => setF("effectiveDate", v)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nuovo Canone Mensile (EUR)" hint="Lascia vuoto se invariato"><Input type="number" value={mod.newPaymentAmount} onChange={v => setF("newPaymentAmount", v)} /></Field>
            <Field label="Nuovo Tasso Sconto (%)" hint="IBR aggiornato"><Input type="number" value={mod.newDiscountRate} onChange={v => setF("newDiscountRate", v)} placeholder={contract.discountRateAnnual} /></Field>
          </div>
          <Field label="Motivazione">
            <textarea
              value={mod.reason}
              onChange={e => setF("reason", e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              placeholder="Rinnovo, modifica tariffe, ecc..."
            />
          </Field>
          {mod.effectiveDate && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-400 uppercase mb-3">Preview Remeasurement</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                  <div className="text-[10px] text-gray-400">Liab. Pre</div>
                  <div className="text-sm font-bold text-gray-700">€ {fmt(prevLiab)}</div>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                  <div className="text-[10px] text-gray-400">Liab. Post</div>
                  <div className="text-sm font-bold text-blue-700">€ {fmt(newLiab)}</div>
                </div>
                <div className={`rounded-xl p-2.5 border ${diff >= 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
                  <div className="text-[10px] text-gray-400">Delta</div>
                  <div className={`text-sm font-bold ${diff >= 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {diff >= 0 ? "+" : ""}€ {fmt(Math.abs(diff))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-t px-6 py-4 flex justify-between bg-gray-50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Annulla</button>
          <button
            onClick={handleSave}
            disabled={!mod.effectiveDate}
            className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
          >
            Applica Modifica
          </button>
        </div>
      </div>
    </div>
  );
}
