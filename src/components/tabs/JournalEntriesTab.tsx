import { JournalEntry } from "../../types";
import { fmt, fmtDate } from "../../utils/formatters";

interface JournalEntriesTabProps {
  journalEntries: JournalEntry[];
  filteredJE: JournalEntry[];
  jeFilter: string;
  setJeFilter: (f: string) => void;
}

const JE_FILTERS = ["ALL", "INITIAL_RECOGNITION", "PAYMENT", "DEPRECIATION", "FX_DIFFERENCE", "RECLASSIFICATION", "MODIFICATION", "LEASE_EXPENSE"];
const JE_COLORS: Record<string, string> = {
  INITIAL_RECOGNITION: "blue", PAYMENT: "emerald", DEPRECIATION: "violet",
  FX_DIFFERENCE: "teal", RECLASSIFICATION: "orange", MODIFICATION: "amber", LEASE_EXPENSE: "amber",
};

export function JournalEntriesTab({ journalEntries, filteredJE, jeFilter, setJeFilter }: JournalEntriesTabProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-500">Filtra:</span>
        {JE_FILTERS.map(f => (
          <button key={f} onClick={() => setJeFilter(f)}
            className={"px-3 py-1 rounded-lg text-xs font-medium border transition-all " + (jeFilter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300")}>
            {f === "ALL" ? "Tutti" : f.replace(/_/g, " ")}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filteredJE.length} movimenti</span>
      </div>

      {filteredJE.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed p-12 text-center text-gray-400">
          <div className="text-3xl mb-2">📒</div>Nessuna scrittura.
        </div>
      )}

      <div className="space-y-3">
        {filteredJE.slice(0, 40).map((je, i) => {
          const col = JE_COLORS[je.type] || "gray";
          return (
            <div key={i} className={`bg-white rounded-xl border border-${col}-100 shadow-sm overflow-hidden`}>
              <div className={`bg-${col}-50 px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className={`bg-${col}-600 text-white px-2 py-0.5 rounded text-[10px] font-bold`}>{je.type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-gray-500">{fmtDate(je.date as string)}</span>
                  {(je.period as number) > 0 && <span className="text-xs text-gray-400">Periodo {je.period}</span>}
                </div>
                <div className="text-xs font-mono text-gray-400">Dare: € {fmt(je.lines.reduce((s, l) => s + l.debit, 0))}</div>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-gray-400 border-b">
                    <th className="px-4 py-1.5 text-left">Conto</th>
                    <th className="px-4 py-1.5 text-left">Descrizione</th>
                    <th className="px-4 py-1.5 text-right">Dare</th>
                    <th className="px-4 py-1.5 text-right">Avere</th>
                  </tr>
                </thead>
                <tbody>
                  {je.lines.map((l, j) => (
                    <tr key={j} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-400 text-[10px]">{l.account}</td>
                      <td className="px-4 py-2 text-gray-700">{l.desc}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-blue-700">{l.debit > 0 ? fmt(l.debit) : ""}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-rose-600">{l.credit > 0 ? fmt(l.credit) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {filteredJE.length > 40 && (
          <div className="text-center text-xs text-gray-400 py-3">
            Mostrate 40/{filteredJE.length} — usa Export per il file completo
          </div>
        )}
      </div>
    </div>
  );
}
