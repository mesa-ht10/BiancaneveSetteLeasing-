import { Contract, Schedule, ScheduleRow } from "../../types";
import { fmt, fmtDate } from "../../utils/formatters";

interface AmortizationTabProps {
  schedule: Schedule | null;
  selectedContract: Contract | undefined;
}

export function AmortizationTab({ schedule, selectedContract }: AmortizationTabProps) {
  if (!schedule) {
    return (
      <div className="bg-white rounded-2xl border border-dashed p-12 text-center text-gray-400">
        <div className="text-3xl mb-2">⚠️</div>Nessun piano. Verifica dati contratto.
      </div>
    );
  }

  if (schedule.isExempt) {
    return (
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-amber-700 text-sm">
          Contratto esente — canone rilevato come spesa operativa (par. 6 IFRS16)
        </div>
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase text-[10px]">
                <th className="px-4 py-3 text-left">Per.</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-right">Pagamento/Spesa</th>
              </tr>
            </thead>
            <tbody>
              {(schedule.rows as any[]).map((r: any, i: number) => (
                <tr key={r.period} className={"border-t " + (i % 2 === 0 ? "" : "bg-gray-50/50")}>
                  <td className="px-4 py-2 font-mono text-gray-400">{r.period}</td>
                  <td className="px-4 py-2">{fmtDate(r.date)}</td>
                  <td className="px-4 py-2 text-right font-mono text-amber-600">{fmt(r.payment)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold border-t-2">
                <td className="px-4 py-3" colSpan={2}>TOTALE</td>
                <td className="px-4 py-3 text-right text-amber-700">{fmt(schedule.totalExpense)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  const rows = schedule.rows as ScheduleRow[];

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-5">
        {([
          ["ROU Asset Iniziale", "€ " + fmt(schedule.rou0), "blue"],
          ["Lease Liability Iniziale", "€ " + fmt(schedule.liability0), "rose"],
          ["Amm.to/periodo", "€ " + fmt(schedule.rouAmortPerPeriod), "violet"],
          ["Periodi", schedule.numPeriods + " (" + selectedContract?.postingFrequency + ")", "emerald"],
        ] as [string, string, string][]).map(([l, v, c]) => (
          <div key={l} className={`bg-${c}-50 rounded-xl p-3 border border-${c}-100`}>
            <div className={`text-xs text-${c}-500 font-semibold`}>{l}</div>
            <div className={`text-lg font-bold text-${c}-700`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase text-[10px]">
                {["Per.", "Data", "Liab.Ap.", "Interessi", "Q.Cap.", "Canone", "Liab.Ch.", "ROU Netto", "Amm.to", "Corrente", "N.Corr.", ...(schedule.isFX ? ["FX"] : [""])].map(h => (
                  <th key={h} className="px-2 py-3 text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.period} className={"border-t " + (i % 2 === 0 ? "bg-white" : "bg-gray-50/50") + " hover:bg-blue-50/30 " + (r.modApplied ? "border-l-2 border-l-orange-400" : "")}>
                  <td className="px-2 py-2 font-mono text-gray-400">{r.period}{r.modApplied && <span className="ml-1 text-orange-500 text-[9px]">M</span>}</td>
                  <td className="px-2 py-2 text-gray-600 whitespace-nowrap">{fmtDate(r.date)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmt(r.openingLiab)}</td>
                  <td className="px-2 py-2 text-right font-mono text-rose-600">{fmt(r.interest)}</td>
                  <td className="px-2 py-2 text-right font-mono text-blue-600">{fmt(r.principal)}</td>
                  <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(r.payment)}</td>
                  <td className="px-2 py-2 text-right font-mono">{fmt(r.closingLiab)}</td>
                  <td className="px-2 py-2 text-right font-mono text-emerald-600">{fmt(r.rouNet)}</td>
                  <td className="px-2 py-2 text-right font-mono text-violet-600">{fmt(r.depreciation)}</td>
                  <td className="px-2 py-2 text-right font-mono text-orange-500">{fmt(r.currentLiab || 0)}</td>
                  <td className="px-2 py-2 text-right font-mono text-gray-500">{fmt(r.nonCurrentLiab || 0)}</td>
                  {schedule.isFX && <td className="px-2 py-2 text-right font-mono text-teal-600">{fmt(r.fxDiff || 0)}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold border-t-2 text-xs">
                <td className="px-2 py-3" colSpan={3}>TOTALI</td>
                <td className="px-2 py-3 text-right text-rose-700">{fmt(rows.reduce((s, r) => s + r.interest, 0))}</td>
                <td className="px-2 py-3 text-right text-blue-700">{fmt(rows.reduce((s, r) => s + r.principal, 0))}</td>
                <td className="px-2 py-3 text-right">{fmt(rows.reduce((s, r) => s + r.payment, 0))}</td>
                <td colSpan={2} />
                <td className="px-2 py-3 text-right text-violet-700">{fmt(rows.reduce((s, r) => s + r.depreciation, 0))}</td>
                <td colSpan={schedule.isFX ? 3 : 2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
