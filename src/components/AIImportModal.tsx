import { useState } from "react";
import { analyzeLeasePDF } from "../utils/ai";

interface AIImportModalProps {
  onImport: (result: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function AIImportModal({ onImport, onCancel }: AIImportModalProps) {
  const [status, setStatus] = useState<"idle" | "reading" | "analyzing" | "done" | "error">("idle");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); setStatus("reading"); setResult(null); setErrorMsg("");
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setStatus("analyzing");
      const extracted = await analyzeLeasePDF(base64);
      setResult(extracted); setStatus("done");
    } catch (err: any) {
      setErrorMsg("Errore: " + (err.message || "risposta AI non valida"));
      setStatus("error");
    }
  };

  const statusIcon = { idle: "📄", error: "📄", reading: "📖", analyzing: "🤖", done: "✅" }[status];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-t-2xl">
          <div>
            <div className="text-white font-bold">AI Import — Analisi PDF</div>
            <div className="text-violet-200 text-xs mt-0.5">L'AI legge e compila i campi automaticamente</div>
          </div>
          <button onClick={onCancel} className="text-white/70 hover:text-white text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-colors ${status === "analyzing" || status === "reading" ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-violet-400 hover:bg-violet-50"}`}>
            <div className="text-4xl mb-3">{statusIcon}</div>
            {status === "idle" && <><div className="font-semibold text-gray-700">Carica il PDF del contratto</div><div className="text-sm text-gray-400 mt-1">Clicca per selezionare</div></>}
            {status === "reading" && <div className="font-semibold text-blue-600 animate-pulse">Lettura...</div>}
            {status === "analyzing" && <><div className="font-semibold text-blue-700">AI in analisi...</div><div className="text-sm text-blue-500 animate-pulse">Estrazione dati IFRS16</div></>}
            {status === "done" && <><div className="font-semibold text-emerald-700">Completato</div><div className="text-sm text-gray-400 mt-1">{fileName}</div></>}
            {status === "error" && <><div className="font-semibold text-red-600">Errore</div><div className="text-sm text-red-400">{errorMsg}</div></>}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} disabled={status === "reading" || status === "analyzing"} />
          </label>
          {result && status === "done" && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-400 uppercase mb-3">Dati Estratti</div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["Codice", result.contractCode],
                  ["Locatore", result.lessorName],
                  ["Categoria", result.leaseCategory],
                  ["Canone", result.basePaymentAmount ? "€ " + result.basePaymentAmount : "—"],
                  ["Inizio", result.commencementDate],
                  ["Fine", result.endDate],
                  ["Tasso", result.discountRateAnnual ? result.discountRateAnnual + "%" : "—"],
                  ["Timing", result.paymentTiming],
                ] as [string, unknown][]).map(([k, v]) => (
                  <div key={k} className="bg-white rounded-lg p-2.5 border border-gray-100">
                    <div className="text-[10px] text-gray-400">{k}</div>
                    <div className="text-xs font-bold text-gray-700 truncate">{(v as string) || "—"}</div>
                  </div>
                ))}
              </div>
              {Array.isArray(result.warnings) && (result.warnings as string[]).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                  <div className="text-xs font-bold text-amber-700 mb-1">Verificare manualmente</div>
                  {(result.warnings as string[]).map((w, i) => <div key={i} className="text-xs text-amber-600">• {w}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-t px-6 py-4 flex justify-between bg-gray-50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Annulla</button>
          {result && status === "done" && (
            <button onClick={() => onImport(result)} className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700">
              Compila il form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
