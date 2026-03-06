import { Contract, Modification } from "../../types";
import { fmt, fmtDate, n } from "../../utils/formatters";

interface ModificationsTabProps {
  selectedContract: Contract | undefined;
  setShowModModal: (v: boolean) => void;
  handleRemoveMod: (modId: string) => void;
}

export function ModificationsTab({ selectedContract, setShowModModal, handleRemoveMod }: ModificationsTabProps) {
  const mods: Modification[] = selectedContract?.modifications || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-bold text-gray-700">Gestione Modifiche Contratto</div>
          <div className="text-xs text-gray-400">Par. 44-46 IFRS16</div>
        </div>
        <button
          onClick={() => setShowModModal(true)}
          disabled={!selectedContract || selectedContract.exemptShortTerm || selectedContract.exemptLowValue}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
        >
          + Nuova Modifica
        </button>
      </div>

      {!selectedContract && (
        <div className="bg-white rounded-2xl border border-dashed p-12 text-center text-gray-400">Seleziona un contratto</div>
      )}

      {selectedContract && mods.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed p-12 text-center text-gray-400">
          <div className="text-3xl mb-2">⚡</div>
          <div className="font-medium mb-1">Nessuna modifica registrata</div>
          <div className="text-xs">Le modifiche cambiano scope o corrispettivo (par. 44 IFRS16)</div>
        </div>
      )}

      {selectedContract && mods.length > 0 && (
        <div className="space-y-3">
          {mods.map(mod => (
            <div key={mod.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
              <div className="bg-orange-50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">{(mod.type || "").replace(/_/g, " ")}</span>
                  <span className="text-xs text-gray-500">Data: <strong>{fmtDate(mod.effectiveDate)}</strong></span>
                  <span className="text-xs text-gray-400">{mod.id}</span>
                </div>
                <button onClick={() => handleRemoveMod(mod.id)} className="text-red-400 hover:text-red-600 text-xs">Rimuovi</button>
              </div>
              <div className="p-4 grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400">Liab. Pre</div>
                  <div className="text-sm font-bold text-gray-700">€ {fmt(mod.prevLiability)}</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400">Liab. Post</div>
                  <div className="text-sm font-bold text-blue-700">€ {fmt(mod.remeasuredLiability)}</div>
                </div>
                <div className={(n(mod.remeasuredLiability) - n(mod.prevLiability) >= 0 ? "bg-red-50" : "bg-emerald-50") + " rounded-xl p-3 text-center"}>
                  <div className="text-[10px] text-gray-400">Delta</div>
                  <div className={"text-sm font-bold " + (n(mod.remeasuredLiability) - n(mod.prevLiability) >= 0 ? "text-red-700" : "text-emerald-700")}>
                    {n(mod.remeasuredLiability) - n(mod.prevLiability) >= 0 ? "+" : ""}€ {fmt(Math.abs(n(mod.remeasuredLiability) - n(mod.prevLiability)))}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400">Nuovo Canone/mese</div>
                  <div className="text-sm font-bold text-gray-700">{mod.newPaymentAmount ? "€ " + fmt(n(mod.newPaymentAmount)) : "Invariato"}</div>
                </div>
              </div>
              {mod.reason && <div className="px-4 pb-3 text-xs text-gray-500">{mod.reason}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
