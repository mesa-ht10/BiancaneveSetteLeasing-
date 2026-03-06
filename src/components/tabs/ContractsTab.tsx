import { Contract, FormState, Schedule } from "../../types";
import { CAT_ICONS, STATUSES, MOCK_LESSORS } from "../../constants";
import { fmt, fmtDate, n } from "../../utils/formatters";
import { buildSchedule, calcLeaseTerm } from "../../utils/calculations";
import { Badge } from "../ui/Badge";
import { EMPTY } from "../../utils/demoData";

interface ContractsTabProps {
  contracts: Contract[];
  filtered: Contract[];
  search: string;
  setSearch: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  setSelectedId: (id: string) => void;
  setActiveTab: (i: number) => void;
  setFormState: (s: FormState | null) => void;
  setDeleteConfirm: (id: string | null) => void;
  totLiab: number;
  totROU: number;
}

export function ContractsTab({
  contracts, filtered, search, setSearch, filterStatus, setFilterStatus,
  setSelectedId, setActiveTab, setFormState, setDeleteConfirm, totLiab, totROU,
}: ContractsTabProps) {
  return (
    <div>
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {([
          ["Contratti", contracts.length, "blue", "📄"],
          ["Lease Liability", "€ " + fmt(totLiab, 0), "rose", "📊"],
          ["ROU Asset", "€ " + fmt(totROU, 0), "emerald", "🏗️"],
          ["Attivi", contracts.filter(c => c.status === "ACTIVE").length, "indigo", "✅"],
        ] as [string, string | number, string, string][]).map(([l, v, c, ic]) => (
          <div key={l} className={`bg-${c}-50 border border-${c}-100 rounded-2xl p-4`}>
            <div className="text-lg mb-1">{ic}</div>
            <div className={`text-xs text-${c}-500 font-semibold`}>{l}</div>
            <div className={`text-xl font-bold text-${c}-700`}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cerca..." className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none">
          <option value="ALL">Tutti gli stati</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} contratti</span>
      </div>

      {/* Contract list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed p-12 text-center text-gray-400">
            <div className="text-3xl mb-2">📋</div>Nessun contratto trovato
          </div>
        )}
        {filtered.map(c => {
          const sc: Schedule | null = buildSchedule(c);
          const isEx = c.exemptShortTerm || c.exemptLowValue;
          const liability = sc?.liability0 || 0;
          const rou = sc?.rou0 || 0;
          const lessor = MOCK_LESSORS.find(x => x.id === c.lessorId);
          const mods = (c.modifications || []).length;
          return (
            <div key={c.contractId || c.contractCode} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">{CAT_ICONS[c.leaseCategory] || "📦"}</div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-mono">{c.contractId || c.contractCode}</div>
                    <div className="font-bold text-gray-800">{c.description}</div>
                    <div className="text-xs text-gray-400">{lessor?.name || c.lessorId} · {c.postingFrequency}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge s={c.status} />
                  {isEx && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">ESENTE</span>}
                  {mods > 0 && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{mods} MOD</span>}
                  <button onClick={() => { setSelectedId(c.contractId || c.contractCode); setActiveTab(1); }} className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 px-2 py-1 rounded-lg">📊 Piano</button>
                  <button onClick={() => setFormState({ contract: c, isNew: false })} className="text-gray-300 hover:text-blue-500 text-lg">✏️</button>
                  <button onClick={() => setDeleteConfirm(c.contractId || c.contractCode)} className="text-gray-300 hover:text-red-500 text-lg">🗑️</button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {isEx
                  ? ([
                    ["Canone", "€ " + fmt(n(c.basePaymentAmount)), "gray"],
                    ["Spesa Tot.", "€ " + fmt(n(c.basePaymentAmount) * calcLeaseTerm(c)), "amber"],
                    ["Durata", calcLeaseTerm(c) + " mesi", "emerald"],
                    ["Tipo", "ESENTE", "red"],
                    ["Freq.", c.postingFrequency, "gray"],
                  ] as [string, string, string][]).map(([l, v, col]) => (
                    <div key={l} className={`bg-${col}-50 rounded-xl p-2 text-center border border-${col}-100`}>
                      <div className={`text-[10px] text-${col}-400`}>{l}</div>
                      <div className={`text-xs font-bold text-${col}-700`}>{v}</div>
                    </div>
                  ))
                  : ([
                    ["Canone", "€ " + fmt(n(c.basePaymentAmount)), "gray"],
                    ["Liability0", "€ " + fmt(liability, 0), "rose"],
                    ["ROU0", "€ " + fmt(rou, 0), "blue"],
                    ["Durata", calcLeaseTerm(c) + " mesi", "emerald"],
                    ["Tasso", c.discountRateAnnual + "%", "violet"],
                  ] as [string, string, string][]).map(([l, v, col]) => (
                    <div key={l} className={`bg-${col}-50 rounded-xl p-2 text-center border border-${col}-100`}>
                      <div className={`text-[10px] text-${col}-400`}>{l}</div>
                      <div className={`text-xs font-bold text-${col}-700`}>{v}</div>
                    </div>
                  ))
                }
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                <span>📅 {fmtDate(c.commencementDate)} → {fmtDate(c.endDate)}</span>
                {c.costCenterId && <><span>·</span><span>🎯 {c.costCenterId}</span></>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
