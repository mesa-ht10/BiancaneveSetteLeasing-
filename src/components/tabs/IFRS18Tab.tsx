import { Contract, Schedule } from "../../types";
import { buildIFRS18Impact, IFRS18Impact } from "../../utils/ifrs18";
import { fmt } from "../../utils/formatters";
import { CAT_ICONS } from "../../constants";
import { useMemo } from "react";

interface IFRS18TabProps {
  contracts: Contract[];
  allSchedules: { c: Contract; s: Schedule }[];
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-600 to-blue-700",
    violet: "from-violet-600 to-violet-700",
    emerald: "from-emerald-600 to-teal-700",
    rose: "from-rose-600 to-rose-700",
    amber: "from-amber-500 to-orange-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.blue} rounded-2xl p-4 text-white shadow-sm`}>
      <div className="text-xs text-white/70 font-medium mb-1">{label}</div>
      <div className="text-xl font-bold">€ {value}</div>
      {sub && <div className="text-xs text-white/60 mt-1">{sub}</div>}
    </div>
  );
}

export function IFRS18Tab({ contracts, allSchedules }: IFRS18TabProps) {
  const impact = useMemo<IFRS18Impact>(
    () => buildIFRS18Impact(contracts, allSchedules),
    [contracts, allSchedules]
  );

  if (!contracts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="text-4xl mb-3">📊</div>
        <div className="text-sm">Nessun contratto disponibile per l'analisi IFRS18.</div>
      </div>
    );
  }

  const molPreIFRS18 = -(impact.operatingLeaseCostPostIFRS16 + impact.leaseInterest);
  const molPostIFRS18 = -impact.operatingLeaseCostPostIFRS16;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="text-2xl">📐</div>
          <div>
            <div className="text-lg font-bold">IFRS18 Impact Analysis</div>
            <div className="text-indigo-200 text-xs">
              Riclassificazione Conto Economico — primo anno · {contracts.length} contratti · dati aggregati
            </div>
          </div>
        </div>
      </div>

      {/* Block 1 — KPI Cards */}
      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          1 · KPI Chiave — Primo Anno
        </div>
        <div className="grid grid-cols-5 gap-3">
          <KPICard
            label="Canoni Capitalizzati Equiv."
            value={fmt(impact.capitalizedLeaseExpenseEquivalent)}
            sub="Cash-flow yr1 contratti IFRS16"
            color="blue"
          />
          <KPICard
            label="Canoni Esenti (OPEX)"
            value={fmt(impact.exemptLeaseExpense)}
            sub="Short-term / Low-value"
            color="amber"
          />
          <KPICard
            label="Totale Lease Equiv."
            value={fmt(impact.totalLeaseExpenseEquivalent)}
            sub="Proxy costo pre-IFRS16"
            color="violet"
          />
          <KPICard
            label="Ammortamento ROU"
            value={fmt(impact.rouDepreciation)}
            sub="Operativo — sopra MOL"
            color="emerald"
          />
          <KPICard
            label="Interessi Lease"
            value={fmt(impact.leaseInterest)}
            sub="→ Financing post-IFRS18"
            color="rose"
          />
        </div>
      </div>

      {/* Block 2 — CE Reclassification table */}
      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          2 · Riclassificazione CE per Contratto
        </div>
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-gray-500">Contratto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500">Tipo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500">Regime</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500">Cash Yr1</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500">Amm.to ROU</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500">Interessi</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500">Lease Exp.</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500">↓ MOL</th>
              </tr>
            </thead>
            <tbody>
              {impact.contractBreakdown.map((row, i) => {
                const impactOnMOL = row.isExempt
                  ? row.leaseExpense
                  : row.rouDepreciation;
                return (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-gray-800">{row.contractCode}</div>
                      <div className="text-gray-400 text-[10px] truncate max-w-[140px]">{row.description}</div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {CAT_ICONS[row.category] || "📦"} {row.category}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.isExempt
                        ? <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">ESENTE</span>
                        : <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">IFRS16</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">€ {fmt(row.cashPaymentYr1)}</td>
                    <td className="px-4 py-2.5 text-right text-violet-700 font-medium">
                      {row.rouDepreciation > 0 ? `€ ${fmt(row.rouDepreciation)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-rose-600 font-medium">
                      {row.interest > 0 ? `€ ${fmt(row.interest)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-600 font-medium">
                      {row.leaseExpense > 0 ? `€ ${fmt(row.leaseExpense)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-800">
                      € {fmt(impactOnMOL)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2">
                <td className="px-4 py-3 text-gray-700" colSpan={3}>Totale</td>
                <td className="px-4 py-3 text-right text-gray-700">€ {fmt(impact.totalLeaseExpenseEquivalent)}</td>
                <td className="px-4 py-3 text-right text-violet-700">€ {fmt(impact.rouDepreciation)}</td>
                <td className="px-4 py-3 text-right text-rose-600">€ {fmt(impact.leaseInterest)}</td>
                <td className="px-4 py-3 text-right text-amber-600">€ {fmt(impact.exemptLeaseExpense)}</td>
                <td className="px-4 py-3 text-right text-gray-800">€ {fmt(impact.operatingLeaseCostPostIFRS16)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Block 3 — MOL Bridge */}
      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          3 · MOL Bridge — Impatto IFRS18 sul Risultato Operativo
        </div>
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <div className="max-w-xl mx-auto space-y-2">
            {/* Line: lease expense equivalent */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="text-sm text-gray-700">Costo Lease Equivalente (pre-IFRS16 proxy)</div>
                <div className="text-[10px] text-gray-400">Canoni totali — proxy del vecchio operating lease</div>
              </div>
              <div className="text-sm font-bold text-gray-700">– € {fmt(impact.totalLeaseExpenseEquivalent)}</div>
            </div>

            {/* After IFRS16 split */}
            <div className="pl-4 space-y-1.5 py-2 border-b border-dashed">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Ammortamento ROU (OPEX — sopra MOL)</span>
                <span className="text-violet-600 font-medium">– € {fmt(impact.rouDepreciation)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Interessi Lease Liability (Financing — sotto OP)</span>
                <span className="text-rose-600 font-medium">– € {fmt(impact.leaseInterest)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Canoni Esenti (Lease Expense — sopra MOL)</span>
                <span className="text-amber-600 font-medium">– € {fmt(impact.exemptLeaseExpense)}</span>
              </div>
            </div>

            {/* Pre-IFRS18 MOL impact */}
            <div className="flex items-center justify-between py-2.5 bg-rose-50 rounded-xl px-4 border border-rose-100">
              <div>
                <div className="text-sm font-bold text-rose-700">Contributo al MOL — pre-IFRS18</div>
                <div className="text-[10px] text-rose-400">Ammort. + Interessi + Esenti sopra MOL</div>
              </div>
              <div className="text-base font-bold text-rose-700">– € {fmt(-molPreIFRS18)}</div>
            </div>

            {/* IFRS18 reclassification */}
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="text-sm text-emerald-700 font-semibold">Riclassifica IFRS18: Interessi → Financing</div>
                <div className="text-[10px] text-gray-400">Gli interessi escono dal perimetro MOL (par. 45 IFRS18)</div>
              </div>
              <div className="text-sm font-bold text-emerald-600">+ € {fmt(impact.leaseInterest)}</div>
            </div>

            {/* Post-IFRS18 MOL impact */}
            <div className="flex items-center justify-between py-2.5 bg-emerald-50 rounded-xl px-4 border border-emerald-100">
              <div>
                <div className="text-sm font-bold text-emerald-700">Contributo al MOL — post-IFRS18</div>
                <div className="text-[10px] text-emerald-500">Solo Ammort. + Canoni Esenti sopra Operating Profit</div>
              </div>
              <div className="text-base font-bold text-emerald-700">– € {fmt(-molPostIFRS18)}</div>
            </div>

            {/* Delta badge */}
            <div className="flex justify-end pt-1">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2 text-center">
                <div className="text-[10px] text-indigo-400 font-semibold uppercase">Delta MOL (miglioramento)</div>
                <div className="text-lg font-bold text-indigo-700">+ € {fmt(impact.amountReclassifiedOutsideMOL)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Block 4 — Simulated Reporting Entries */}
      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          4 · Scritture Simulate Reporting — Conti IFRS18
        </div>
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-indigo-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-indigo-600">Conto</th>
                <th className="text-left px-4 py-3 font-semibold text-indigo-600">Descrizione</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-600">Categoria</th>
                <th className="text-right px-4 py-3 font-semibold text-indigo-600">Dare</th>
                <th className="text-right px-4 py-3 font-semibold text-indigo-600">Avere</th>
              </tr>
            </thead>
            <tbody>
              {impact.reportingEntries.map((e, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-indigo-700 font-semibold">{e.account}</td>
                  <td className="px-4 py-2.5 text-gray-600">{e.description}</td>
                  <td className="px-4 py-2.5 text-center">
                    {e.category === "OPERATING"
                      ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">OPERATING</span>
                      : <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">FINANCING</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {e.debit > 0 ? `€ ${fmt(e.debit)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500">
                    {e.credit > 0 ? `€ ${fmt(e.credit)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-800 space-y-1.5">
        <div className="font-bold text-amber-700 text-sm mb-2">📋 Note e Assunzioni</div>
        <div>• I dati si riferiscono al <strong>primo anno</strong> di ciascun contratto (12 mesi dalla data di decorrenza).</div>
        <div>• Il <strong>Costo Lease Equivalente</strong> rappresenta i flussi di cassa effettivi (quota capitale + interessi) dei contratti capitalizzati, usato come proxy del vecchio canone operativo pre-IFRS16.</div>
        <div>• L'<strong>Ammortamento ROU Asset</strong> è classificato come costo operativo e rimane <em>sopra</em> l'Operating Profit IFRS18 (par. 45 lett. b).</div>
        <div>• Gli <strong>Interessi sulla Lease Liability</strong> rientrano nella categoria "Financing" secondo IFRS18 e vengono <em>esclusi</em> dal perimetro MOL/Operating Profit.</div>
        <div>• I contratti con esenzione short-term o low-value (par. 5 IFRS16) mantengono la Lease Expense in OPEX, sopra il MOL, sia pre che post IFRS18.</div>
        <div>• I conti simulati (<code className="bg-amber-100 px-1 rounded">REP.*</code>) sono di sola visualizzazione e non generano movimenti nel piano dei conti IFRS16.</div>
        <div>• Analisi basata su <strong>IFRS18 (emesso IASB maggio 2024)</strong>, applicazione obbligatoria dal 1° gennaio 2027.</div>
      </div>
    </div>
  );
}
