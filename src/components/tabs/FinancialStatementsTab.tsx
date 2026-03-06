import { Schedule } from "../../types";
import { fmt, monthsBetween } from "../../utils/formatters";

interface FinancialStatementsTabProps {
  totLiab: number;
  totROU: number;
  currentLiab: number;
  nonCurrentLiab: number;
  yr1Depr: number;
  yr1Interest: number;
  yr1Expense: number;
  allSchedules: { s: Schedule }[];
}

export function FinancialStatementsTab({
  totLiab, totROU, currentLiab, nonCurrentLiab, yr1Depr, yr1Interest, yr1Expense, allSchedules,
}: FinancialStatementsTabProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Balance Sheet */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
          <div className="text-white font-bold">Balance Sheet — IFRS16 Impact</div>
          <div className="text-blue-200 text-xs">Al {new Date().toLocaleDateString("it-IT")}</div>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">ATTIVITÀ</div>
          <div className="flex justify-between items-center py-2 border-b"><span className="text-sm text-gray-700">ROU Asset (netto)</span><span className="text-sm font-bold text-blue-700">€ {fmt(totROU)}</span></div>
          <div className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2">PASSIVITÀ</div>
          <div className="flex justify-between items-center py-2 border-b"><span className="text-sm text-gray-700">Lease Liability Corrente</span><span className="text-sm font-bold text-rose-600">€ {fmt(currentLiab)}</span></div>
          <div className="flex justify-between items-center py-2 border-b"><span className="text-sm text-gray-700">Lease Liability Non Corrente</span><span className="text-sm font-bold text-rose-600">€ {fmt(nonCurrentLiab)}</span></div>
          <div className="flex justify-between items-center py-3 bg-rose-50 rounded-xl px-3">
            <span className="text-sm font-bold text-gray-700">Totale Lease Liability</span>
            <span className="text-lg font-bold text-rose-700">€ {fmt(totLiab)}</span>
          </div>
        </div>
      </div>

      {/* P&L */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4">
          <div className="text-white font-bold">P&L — IFRS16 Impact</div>
          <div className="text-emerald-200 text-xs">Primo anno</div>
        </div>
        <div className="p-5 space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">COSTI OPERATIVI</div>
          <div className="flex justify-between items-center py-2 border-b"><span className="text-sm text-gray-700">Ammortamento ROU Asset</span><span className="text-sm font-bold text-violet-700">€ {fmt(yr1Depr)}</span></div>
          {yr1Expense > 0 && <div className="flex justify-between items-center py-2 border-b"><span className="text-sm text-gray-700">Lease Expense (esenti)</span><span className="text-sm font-bold text-amber-600">€ {fmt(yr1Expense)}</span></div>}
          <div className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2">ONERI FINANZIARI</div>
          <div className="flex justify-between items-center py-2 border-b"><span className="text-sm text-gray-700">Interessi su Lease Liability</span><span className="text-sm font-bold text-rose-600">€ {fmt(yr1Interest)}</span></div>
          <div className="flex justify-between items-center py-3 bg-rose-50 rounded-xl px-3">
            <span className="text-sm font-bold text-gray-700">Totale Onere IFRS16</span>
            <span className="text-lg font-bold text-rose-700">€ {fmt(yr1Depr + yr1Interest + yr1Expense)}</span>
          </div>
        </div>
      </div>

      {/* Maturity Analysis */}
      <div className="col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-4">
          <div className="text-white font-bold">Maturity Analysis — Undiscounted Cash Flows (par. 58)</div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-5 gap-3">
            {["Anno 1", "Anno 2", "Anno 3", "Anno 4", "Oltre 4 anni"].map((label, i) => {
              const yearStart = i * 12, yearEnd = i === 4 ? 999 : (i + 1) * 12;
              const total = allSchedules.reduce((s, { s: sc }) => {
                if (sc.isExempt) return s;
                const rows = sc.rows as any[];
                if (!rows.length) return s;
                const yr = rows.filter((r: any) => {
                  const m = monthsBetween(rows[0].date, r.date);
                  return m >= yearStart && m < yearEnd;
                });
                return s + yr.reduce((a: number, r: any) => a + r.payment, 0);
              }, 0);
              const cols = ["blue", "emerald", "violet", "amber", "rose"];
              return (
                <div key={label} className={`bg-${cols[i]}-50 border border-${cols[i]}-100 rounded-xl p-4 text-center`}>
                  <div className={`text-xs text-${cols[i]}-500 font-semibold mb-1`}>{label}</div>
                  <div className={`text-base font-bold text-${cols[i]}-700`}>€ {fmt(total, 0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
