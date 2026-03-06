import { useState, useMemo, useEffect, useCallback } from "react";
import { Contract, Schedule, JournalEntry, FormState, CSVPreview, Modification } from "./types";
import { NAV_TABS, CAT_ICONS } from "./constants";
import { loadContracts, persistContracts } from "./utils/storage";
import { buildSchedule, calcLeaseTerm } from "./utils/calculations";
import { buildJE } from "./utils/journalEntries";
import { fmt, fmtDate, n } from "./utils/formatters";
import { EMPTY } from "./utils/demoData";

import { ContractForm } from "./components/ContractForm";
import { CSVModal } from "./components/CSVModal";
import { ModificationModal } from "./components/ModificationModal";
import { AIChatPanel } from "./components/AIChatPanel";

import { ContractsTab } from "./components/tabs/ContractsTab";
import { AmortizationTab } from "./components/tabs/AmortizationTab";
import { JournalEntriesTab } from "./components/tabs/JournalEntriesTab";
import { FinancialStatementsTab } from "./components/tabs/FinancialStatementsTab";
import { ModificationsTab } from "./components/tabs/ModificationsTab";
import { ExportTab } from "./components/tabs/ExportTab";
import { IFRS18Tab } from "./components/tabs/IFRS18Tab";

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [jeFilter, setJeFilter] = useState("ALL");
  const [toast, setToast] = useState("");
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [showModModal, setShowModModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    loadContracts().then(cs => {
      setContracts(cs);
      if (cs.length > 0) setSelectedId(cs[0].contractId || cs[0].contractCode);
      setLoading(false);
    });
  }, []);
  useEffect(() => { if (!loading) persistContracts(contracts); }, [contracts, loading]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const selectedContract = contracts.find(c => (c.contractId || c.contractCode) === selectedId);
  const schedule = useMemo<Schedule | null>(() => selectedContract ? buildSchedule(selectedContract) : null, [selectedContract]);
  const journalEntries = useMemo<JournalEntry[]>(() => selectedContract && schedule ? buildJE(selectedContract, schedule) : [], [selectedContract, schedule]);
  const filteredJE = jeFilter === "ALL" ? journalEntries : journalEntries.filter(j => j.type === jeFilter);

  const filtered = contracts.filter(c =>
    (!search || c.description.toLowerCase().includes(search.toLowerCase()) || (c.contractCode || "").toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus === "ALL" || c.status === filterStatus)
  );

  const today = new Date();
  const allSchedules = useMemo(() => contracts.map(c => ({ c, s: buildSchedule(c) })).filter(x => x.s) as { c: Contract; s: Schedule }[], [contracts]);

  function getCurrentRow(rows: any[]): any | null {
    if (!rows || !rows.length) return null;
    const past = rows.filter((r: any) => new Date(r.date) <= today);
    return past.length > 0 ? past[past.length - 1] : rows[0];
  }

  const totLiab = allSchedules.reduce((s, { s: sc }) => { if (sc.isExempt) return s; const row = getCurrentRow(sc.rows as any[]); return s + (row?.closingLiab || sc.liability0 || 0); }, 0);
  const totROU = allSchedules.reduce((s, { s: sc }) => { if (sc.isExempt) return s; const row = getCurrentRow(sc.rows as any[]); return s + (row?.rouNet || sc.rou0 || 0); }, 0);
  const currentLiab = allSchedules.reduce((s, { s: sc }) => { if (sc.isExempt) return s; const row = getCurrentRow(sc.rows as any[]); return s + (row?.currentLiab || 0); }, 0);
  const nonCurrentLiab = Math.max(0, totLiab - currentLiab);
  const yr1Depr = allSchedules.reduce((s, { s: sc }) => sc.isExempt ? s : s + (sc.rouAmortPerPeriod || 0) * (12 / (sc.freqMonths || 1)), 0);
  const yr1Interest = allSchedules.reduce((s, { s: sc }) => {
    if (sc.isExempt) return s;
    const rows = sc.rows as any[];
    const yr1 = rows.filter((r: any) => { const d = new Date(r.date); const st = new Date(rows[0].date); return (d.getTime() - st.getTime()) / 2592e6 < 12; });
    return s + yr1.reduce((a: number, r: any) => a + r.interest, 0);
  }, 0);
  const yr1Expense = allSchedules.reduce((s, { s: sc }) => {
    if (!sc.isExempt) return s;
    return s + (sc.rows as any[]).slice(0, Math.round(12 / (sc.freqMonths || 1))).reduce((a: number, r: any) => a + r.payment, 0);
  }, 0);

  const handleSave = useCallback((c: Contract) => {
    const id = c.contractId || c.contractCode;
    setContracts(p => { const exists = p.some(x => (x.contractId || x.contractCode) === id); return exists ? p.map(x => (x.contractId || x.contractCode) === id ? c : x) : [...p, c]; });
    setSelectedId(id); setFormState(null);
    showToast(formState?.isNew ? "Contratto " + c.contractCode + " creato" : "Contratto " + c.contractCode + " aggiornato");
  }, [formState]);

  const handleDelete = useCallback((id: string) => {
    setContracts(p => { const next = p.filter(c => (c.contractId || c.contractCode) !== id); if (selectedId === id && next.length > 0) setSelectedId(next[0].contractId || next[0].contractCode); return next; });
    setDeleteConfirm(null); showToast("Contratto eliminato");
  }, [selectedId]);

  const handleAddModification = (mod: Modification) => {
    setContracts(p => p.map(c => {
      if ((c.contractId || c.contractCode) !== selectedId) return c;
      return { ...c, modifications: [...(c.modifications || []), mod] };
    }));
    setShowModModal(false);
    showToast("Modifica contratto applicata");
  };

  const handleRemoveMod = (modId: string) => {
    setContracts(p => p.map(c => {
      if ((c.contractId || c.contractCode) !== selectedId) return c;
      return { ...c, modifications: (c.modifications || []).filter(m => m.id !== modId) };
    }));
    showToast("Modifica rimossa");
  };

  const openCSV = (title: string, filename: string, csv: string) => setCsvPreview({ title, filename, content: csv });

  const handleExportSchedule = () => {
    if (!schedule) return;
    if (schedule.isExempt) {
      const csvRows = (schedule.rows as any[]).map((r: any) => [r.period, fmtDate(r.date), r.payment.toFixed(2)]);
      openCSV("Piano Esente", "MESA_Exempt_" + selectedContract!.contractCode + ".csv", [["Periodo", "Data", "Pagamento"], ...csvRows].map(r => r.join(";")).join("\n"));
      return;
    }
    const h = ["Per.", "Data", "Liab.Ap.", "Interessi", "Q.Cap.", "Canone", "Liab.Ch.", "ROU Netto", "Amm.to", "Corrente", "N.Corrente"];
    const rows = (schedule.rows as any[]).map((r: any) => [r.period, fmtDate(r.date), r.openingLiab.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.payment.toFixed(2), r.closingLiab.toFixed(2), r.rouNet.toFixed(2), r.depreciation.toFixed(2), (r.currentLiab || 0).toFixed(2), (r.nonCurrentLiab || 0).toFixed(2)]);
    openCSV("Piano Ammortamento", "MESA_Schedule_" + selectedContract!.contractCode + ".csv", [h, ...rows].map(r => r.join(";")).join("\n"));
  };

  const handleExportJE = () => {
    if (!journalEntries.length) return;
    const h = ["Data", "Tipo", "Periodo", "Conto", "Descrizione", "Dare", "Avere"];
    const rows = journalEntries.flatMap(je => je.lines.map(l => [fmtDate(je.date as string), je.type, je.period, l.account, '"' + l.desc + '"', l.debit.toFixed(2), l.credit.toFixed(2)]));
    openCSV("Journal Entries", "MESA_JE_" + selectedContract!.contractCode + ".csv", [h, ...rows].map(r => r.join(";")).join("\n"));
  };

  const handleExportAll = () => {
    const h = ["Contratto", "Descrizione", "Tipo", "Liability0", "ROU0", "Durata", "Tasso", "Stato", "Modifiche"];
    const rows = contracts.map(c => { const sc = buildSchedule(c); return [c.contractCode, '"' + c.description + '"', c.leaseCategory, (sc?.liability0 || 0).toFixed(2), (sc?.rou0 || 0).toFixed(2), calcLeaseTerm(c), c.discountRateAnnual || "N/A", c.status, (c.modifications || []).length]; });
    openCSV("Tutti i Contratti", "MESA_IFRS16_All.csv", [h, ...rows].map(r => r.join(";")).join("\n"));
  };

  const contractSelectorBar = (
    <div className="bg-white border-b px-6 py-2 flex items-center gap-2 overflow-x-auto">
      <span className="text-xs text-gray-400 shrink-0">Contratto:</span>
      {contracts.map(c => (
        <button key={c.contractId || c.contractCode} onClick={() => setSelectedId(c.contractId || c.contractCode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${selectedId === (c.contractId || c.contractCode) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
          {CAT_ICONS[c.leaseCategory] || "📦"} {c.contractCode}
          {(c.exemptShortTerm || c.exemptLowValue) && <span className="bg-amber-400 text-white text-[9px] px-1 rounded">EX</span>}
          {(c.modifications || []).length > 0 && <span className="bg-orange-400 text-white text-[9px] px-1 rounded">{(c.modifications || []).length}M</span>}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="text-3xl mb-3">⏳</div><div className="text-gray-500">Caricamento...</div></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <div className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white rounded-xl px-3 py-1.5 text-sm font-bold">MESA</div>
          <div>
            <div className="font-bold text-gray-800 text-sm">🍎 Biancaneve e i 7 Leasing</div>
            <div className="text-xs text-gray-400">{contracts.length} contratti · IFRS16 · Modifiche · AI Chat · Export</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIChat(p => !p)}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${showAIChat ? "bg-violet-600 text-white border-violet-600" : "bg-white border-gray-200 text-gray-600 hover:border-violet-400"}`}
          >
            🤖 AI Assistant
          </button>
          <button
            onClick={() => setFormState({ contract: { ...EMPTY, createdAt: new Date().toISOString() }, isNew: true })}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm"
          >
            + Nuovo Contratto
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-6 flex gap-1">
        {NAV_TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Contract selector bar (shown for tabs 1–4) */}
      {activeTab > 0 && activeTab < 5 && contractSelectorBar}

      {/* Tab content */}
      <div className="flex-1 p-6">
        {activeTab === 0 && (
          <ContractsTab
            contracts={contracts}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            setSelectedId={setSelectedId}
            setActiveTab={setActiveTab}
            setFormState={setFormState}
            setDeleteConfirm={setDeleteConfirm}
            totLiab={totLiab}
            totROU={totROU}
          />
        )}
        {activeTab === 1 && (
          <AmortizationTab schedule={schedule} selectedContract={selectedContract} />
        )}
        {activeTab === 2 && (
          <JournalEntriesTab
            journalEntries={journalEntries}
            filteredJE={filteredJE}
            jeFilter={jeFilter}
            setJeFilter={setJeFilter}
          />
        )}
        {activeTab === 3 && (
          <FinancialStatementsTab
            totLiab={totLiab}
            totROU={totROU}
            currentLiab={currentLiab}
            nonCurrentLiab={nonCurrentLiab}
            yr1Depr={yr1Depr}
            yr1Interest={yr1Interest}
            yr1Expense={yr1Expense}
            allSchedules={allSchedules}
          />
        )}
        {activeTab === 4 && (
          <ModificationsTab
            selectedContract={selectedContract}
            setShowModModal={setShowModModal}
            handleRemoveMod={handleRemoveMod}
          />
        )}
        {activeTab === 5 && (
          <ExportTab
            handleExportSchedule={handleExportSchedule}
            handleExportJE={handleExportJE}
            handleExportAll={handleExportAll}
            selectedContractExists={!!selectedContract}
          />
        )}
        {activeTab === 6 && (
          <IFRS18Tab contracts={contracts} allSchedules={allSchedules} />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm z-50">
          {toast}
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="text-lg font-bold text-gray-800 mb-2">Elimina contratto</div>
            <div className="text-sm text-gray-600 mb-5">Sei sicuro? L'operazione non è reversibile.</div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-xl border text-sm text-gray-600">Annulla</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold">Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {formState && <ContractForm contract={formState.contract} onSave={handleSave} onCancel={() => setFormState(null)} isNew={formState.isNew} />}
      {csvPreview && <CSVModal {...csvPreview} onClose={() => setCsvPreview(null)} />}
      {showModModal && selectedContract && (
        <ModificationModal contract={selectedContract} schedule={schedule} onSave={handleAddModification} onCancel={() => setShowModModal(false)} />
      )}
      {showAIChat && <AIChatPanel contract={selectedContract} onClose={() => setShowAIChat(false)} />}
    </div>
  );
}
