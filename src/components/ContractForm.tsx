import { useState, useMemo } from "react";
import { Contract } from "../types";
import { LEASE_CATEGORIES, CURRENCIES, STATUSES, MOCK_LESSORS, POSTING_FREQ, DAY_COUNT, PAYMENT_TIMING, RATE_SOURCE, MOCK_CCS, MOCK_BUS, CAT_ICONS, FREQ_MONTHS } from "../constants";
import { monthsBetween, n, fmt, genId } from "../utils/formatters";
import { calcLeaseTerm, calcAmortTerm, calcPV, getPeriodicRate } from "../utils/calculations";
import { validateContract } from "../utils/validation";
import { MOCK_LESSORS as ML } from "../constants";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Sel } from "./ui/Sel";
import { Toggle } from "./ui/Toggle";
import { SecTitle } from "./ui/SecTitle";
import { AIImportModal } from "./AIImportModal";

interface ContractFormProps {
  contract: Contract;
  onSave: (c: Contract) => void;
  onCancel: () => void;
  isNew: boolean;
}

const FSECTIONS = [
  { id: "identification", label: "Identificazione", icon: "🏷️" },
  { id: "contractual", label: "Dati Contrattuali", icon: "📋" },
  { id: "options", label: "Opzioni", icon: "🔀" },
  { id: "policy", label: "Policy IFRS16", icon: "📐" },
  { id: "financial", label: "Finanziari", icon: "💰" },
  { id: "fx", label: "Valuta & FX", icon: "💱" },
  { id: "gl", label: "Mapping GL", icon: "📒" },
  { id: "controlling", label: "Controlling", icon: "🎯" },
  { id: "workflow", label: "Workflow", icon: "✅" },
];

const SECTION_ERR_KEYS: Record<string, string[]> = {
  identification: ["contractCode", "description", "lessorId", "commencementDate", "endDate"],
  financial: ["discountRateAnnual", "basePaymentAmount"],
  options: ["purchaseOptionPrice", "terminationOptionDate", "renewalOptionMonths", "usefulLifeMonths"],
  contractual: ["leaseCategory", "basePaymentAmount"],
};

const GL_FIELDS: [string, string][] = [
  ["accROU", "ROU Asset"], ["accLeaseLiability", "Lease Liability"],
  ["accInterestExp", "Interessi Passivi"], ["accDepExp", "Amm.to ROU"],
  ["accLeaseExpense", "Lease Expense (esenzioni)"], ["accFxDiff", "Differenze Cambio"],
  ["accIncentiveLiability", "Incentive Liability"], ["accRestorationProvision", "Restoration Provision"],
];

export function ContractForm({ contract, onSave, onCancel, isNew }: ContractFormProps) {
  const [data, setData] = useState<Contract>({ ...contract, modifications: contract.modifications || [] });
  const [sec, setSec] = useState("identification");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAI, setShowAI] = useState(false);
  const setF = (k: string, v: unknown) => setData(p => ({ ...p, [k]: v }));

  const lt = useMemo(() => monthsBetween(data.commencementDate, data.endDate), [data.commencementDate, data.endDate]);
  const et = useMemo(() => calcLeaseTerm(data), [data]);
  const isExempt = data.exemptShortTerm || data.exemptLowValue;
  const freq = data.postingFrequency || "MONTHLY";
  const freqMonths = FREQ_MONTHS[freq];
  const periodicRate = useMemo(() => getPeriodicRate(n(data.discountRateAnnual), freq), [data.discountRateAnnual, freq]);
  const numPeriods = Math.ceil(et / freqMonths);
  const pmtPerPeriod = n(data.basePaymentAmount) * freqMonths;
  const pmtStream = useMemo(() => {
    const s: { amount: number; t: number }[] = [];
    for (let i = 1; i <= numPeriods; i++) {
      const t = data.paymentTiming === "ADVANCE" ? i - 1 : i;
      if (t >= 0) s.push({ amount: pmtPerPeriod, t });
    }
    if (data.purchaseOptionReasonablyCertain && n(data.purchaseOptionPrice) > 0)
      s.push({ amount: n(data.purchaseOptionPrice), t: numPeriods });
    return s;
  }, [numPeriods, pmtPerPeriod, data]);
  const fxRateVal = n(data.fxRate) || 1;
  const liability0 = useMemo(() => isExempt ? 0 : calcPV(pmtStream, periodicRate) * fxRateVal, [pmtStream, periodicRate, fxRateVal, isExempt]);
  const rou0 = useMemo(() => isExempt ? 0 : liability0 + n(data.prepaidAmount) - n(data.leaseIncentives) + n(data.initialDirectCosts) + n(data.restorationProvision), [liability0, data, isExempt]);

  const handleAIImport = (ex: Record<string, unknown>) => {
    const lessor = ML.find(l => l.name.toLowerCase().includes(((ex.lessorName as string) || "").toLowerCase()));
    setData(p => ({
      ...p,
      contractCode: (ex.contractCode as string) || p.contractCode,
      description: (ex.description as string) || p.description,
      lessorId: lessor?.id || p.lessorId,
      leaseCurrency: (ex.leaseCurrency as string) || p.leaseCurrency,
      commencementDate: (ex.commencementDate as string) || p.commencementDate,
      endDate: (ex.endDate as string) || p.endDate,
      leaseCategory: (ex.leaseCategory as string) || p.leaseCategory,
      assetDescription: (ex.assetDescription as string) || p.assetDescription,
      basePaymentAmount: (ex.basePaymentAmount as string) || p.basePaymentAmount,
      paymentTiming: (ex.paymentTiming as string) || p.paymentTiming,
      discountRateAnnual: (ex.discountRateAnnual as string) || p.discountRateAnnual,
      discountRateSource: (ex.discountRateSource as string) || p.discountRateSource,
      initialDirectCosts: (ex.initialDirectCosts as string) || p.initialDirectCosts,
      prepaidAmount: (ex.prepaidAmount as string) || p.prepaidAmount,
      leaseIncentives: (ex.leaseIncentives as string) || p.leaseIncentives,
      restorationProvision: (ex.restorationProvision as string) || p.restorationProvision,
      usefulLifeMonths: (ex.usefulLifeMonths as string) || p.usefulLifeMonths,
      purchaseOption: ex.purchaseOption != null ? (ex.purchaseOption as boolean) : p.purchaseOption,
      purchaseOptionPrice: (ex.purchaseOptionPrice as string) || p.purchaseOptionPrice,
      purchaseOptionDate: (ex.purchaseOptionDate as string) || p.purchaseOptionDate,
      purchaseOptionReasonablyCertain: ex.purchaseOptionReasonablyCertain != null ? (ex.purchaseOptionReasonablyCertain as boolean) : p.purchaseOptionReasonablyCertain,
      terminationOption: ex.terminationOption != null ? (ex.terminationOption as boolean) : p.terminationOption,
      terminationOptionDate: (ex.terminationOptionDate as string) || p.terminationOptionDate,
      terminationOptionPenalty: (ex.terminationOptionPenalty as string) || p.terminationOptionPenalty,
      renewalOption: ex.renewalOption != null ? (ex.renewalOption as boolean) : p.renewalOption,
      renewalOptionMonths: (ex.renewalOptionMonths as string) || p.renewalOptionMonths,
      ownershipTransferLikely: ex.ownershipTransferLikely != null ? (ex.ownershipTransferLikely as boolean) : p.ownershipTransferLikely,
      exemptShortTerm: ex.exemptShortTerm != null ? (ex.exemptShortTerm as boolean) : p.exemptShortTerm,
      exemptLowValue: ex.exemptLowValue != null ? (ex.exemptLowValue as boolean) : p.exemptLowValue,
      notes: (ex.notes as string) || p.notes,
    }));
    setShowAI(false); setSec("identification");
  };

  const handleSave = () => {
    const e = validateContract(data);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const now = new Date().toISOString();
    onSave({ ...data, contractId: data.contractId || genId(), contractCode: data.contractCode || genId(), createdAt: data.createdAt || now, updatedAt: now, updatedBy: "admin@mesa.it" });
  };

  const eb = (k: string) => errors[k] ? "border-red-400" : "border-gray-200";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
          <div>
            <div className="text-white font-bold">{isNew ? "Nuovo Contratto" : "Modifica Contratto"}</div>
            <div className="text-blue-200 text-xs">{data.contractCode || "—"} · {data.description || "—"}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAI(true)} className="bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
              🤖 PDF Import
            </button>
            {liability0 > 0 && (
              <div className="bg-white/10 rounded-xl px-3 py-1.5 text-white text-xs">
                <span className="opacity-70">L0: </span><strong>€{fmt(liability0, 0)}</strong>
                <span className="opacity-70 ml-2">ROU0: </span><strong>€{fmt(rou0, 0)}</strong>
              </div>
            )}
            <button onClick={onCancel} className="text-white/70 hover:text-white text-2xl">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 border-r bg-gray-50 flex-shrink-0 overflow-y-auto">
            {FSECTIONS.map(s => {
              const hasErr = (SECTION_ERR_KEYS[s.id] || []).some(k => errors[k]);
              return (
                <button key={s.id} onClick={() => setSec(s.id)}
                  className={`w-full text-left px-4 py-3 text-xs font-medium flex items-center gap-2 border-b border-gray-100 transition-colors ${sec === s.id ? "bg-blue-50 text-blue-700 border-l-2 border-l-blue-600" : "text-gray-600 hover:bg-gray-100"}`}>
                  {s.icon} {s.label}
                  {hasErr && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {sec === "identification" && (
              <>
                <SecTitle icon="🏷️" title="Identificazione" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Codice Contratto" required error={errors.contractCode}><Input value={data.contractCode} onChange={v => setF("contractCode", v)} placeholder="LEA-2024-001" cls={eb("contractCode")} /></Field>
                  <Field label="Società"><Input value={data.companyId} disabled /></Field>
                </div>
                <Field label="Descrizione" required error={errors.description}><Input value={data.description} onChange={v => setF("description", v)} cls={eb("description")} /></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Locatore" required error={errors.lessorId}><Sel value={data.lessorId} onChange={v => setF("lessorId", v)} options={MOCK_LESSORS.map(l => ({ value: l.id, label: l.name }))} /></Field>
                  <Field label="Valuta Contratto"><Sel value={data.leaseCurrency} onChange={v => setF("leaseCurrency", v)} options={[...CURRENCIES]} /></Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Data Inizio" required error={errors.commencementDate}><Input type="date" value={data.commencementDate} onChange={v => setF("commencementDate", v)} cls={eb("commencementDate")} /></Field>
                  <Field label="Data Fine" required error={errors.endDate}><Input type="date" value={data.endDate} onChange={v => setF("endDate", v)} cls={eb("endDate")} /></Field>
                  <Field label="Stato"><Sel value={data.status} onChange={v => setF("status", v)} options={[...STATUSES]} /></Field>
                </div>
                {lt > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 flex gap-6 text-sm">
                    <div><span className="text-blue-400 text-xs">Durata base</span><br /><strong className="text-blue-700">{lt} mesi</strong></div>
                    <div><span className="text-blue-400 text-xs">Durata effettiva IFRS16</span><br /><strong className="text-blue-700">{et} mesi</strong></div>
                    <div><span className="text-blue-400 text-xs">Periodicità</span><br /><strong className="text-blue-700">{freq}</strong></div>
                  </div>
                )}
                <Field label="Note"><textarea value={data.notes || ""} onChange={e => setF("notes", e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" /></Field>
              </>
            )}

            {sec === "contractual" && (
              <>
                <SecTitle icon="📋" title="Informazioni Contrattuali" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Categoria" required error={errors.leaseCategory}><Sel value={data.leaseCategory} onChange={v => setF("leaseCategory", v)} options={LEASE_CATEGORIES.map(c => ({ value: c, label: (CAT_ICONS[c] || "📦") + " " + c }))} /></Field>
                  <Field label="Vita Utile (mesi)" error={errors.usefulLifeMonths}><Input type="number" value={data.usefulLifeMonths} onChange={v => setF("usefulLifeMonths", v)} placeholder="es. 120" cls={eb("usefulLifeMonths")} /></Field>
                </div>
                <Field label="Descrizione Asset"><textarea value={data.assetDescription || ""} onChange={e => setF("assetDescription", e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" /></Field>
                <Field label="Canone Base Mensile (EUR)" required error={errors.basePaymentAmount}><Input type="number" value={data.basePaymentAmount} onChange={v => setF("basePaymentAmount", v)} cls={eb("basePaymentAmount")} /></Field>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <Toggle value={data.ownershipTransferLikely} onChange={v => setF("ownershipTransferLikely", v)} label="Trasferimento proprietà a fine leasing" />
                  <Toggle value={data.purchaseOption} onChange={v => setF("purchaseOption", v)} label="Opzione di acquisto" />
                  <Toggle value={data.terminationOption} onChange={v => setF("terminationOption", v)} label="Opzione di recesso" />
                  <Toggle value={data.renewalOption} onChange={v => setF("renewalOption", v)} label="Opzione di rinnovo" />
                </div>
              </>
            )}

            {sec === "options" && (
              <>
                <SecTitle icon="🔀" title="Dettaglio Opzioni" sub="par. 18-21 IFRS16" />
                {data.purchaseOption && (
                  <div className="border border-blue-100 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-blue-600">Opzione Acquisto</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prezzo (EUR)" error={errors.purchaseOptionPrice}><Input type="number" value={data.purchaseOptionPrice} onChange={v => setF("purchaseOptionPrice", v)} cls={eb("purchaseOptionPrice")} /></Field>
                      <Field label="Data Esercizio"><Input type="date" value={data.purchaseOptionDate} onChange={v => setF("purchaseOptionDate", v)} /></Field>
                    </div>
                    <Toggle value={data.purchaseOptionReasonablyCertain} onChange={v => setF("purchaseOptionReasonablyCertain", v)} label="Ragionevolmente certo (par. 27d)" />
                  </div>
                )}
                {data.terminationOption && (
                  <div className="border border-red-100 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-red-600">Opzione Recesso</div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Data Esercizio" error={errors.terminationOptionDate}><Input type="date" value={data.terminationOptionDate} onChange={v => setF("terminationOptionDate", v)} cls={eb("terminationOptionDate")} /></Field>
                      <Field label="Penale (EUR)"><Input type="number" value={data.terminationOptionPenalty} onChange={v => setF("terminationOptionPenalty", v)} /></Field>
                    </div>
                    <Toggle value={data.terminationOptionReasonablyCertain} onChange={v => setF("terminationOptionReasonablyCertain", v)} label="Esercizio ragionevolmente certo" />
                  </div>
                )}
                {data.renewalOption && (
                  <div className="border border-emerald-100 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-bold text-emerald-600">Opzione Rinnovo</div>
                    <Field label="Mesi di Rinnovo" error={errors.renewalOptionMonths}><Input type="number" value={data.renewalOptionMonths} onChange={v => setF("renewalOptionMonths", v)} placeholder="24" cls={eb("renewalOptionMonths")} /></Field>
                    <Toggle value={data.renewalOptionReasonablyCertain} onChange={v => setF("renewalOptionReasonablyCertain", v)} label="Ragionevolmente certo (par. 19a)" />
                    {data.renewalOptionReasonablyCertain && <div className="bg-emerald-50 text-emerald-700 text-xs p-2 rounded-lg">Durata effettiva IFRS16: <strong>{et} mesi</strong></div>}
                  </div>
                )}
              </>
            )}

            {sec === "policy" && (
              <>
                <SecTitle icon="📐" title="Policy IFRS16" />
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <Toggle value={data.exemptShortTerm} onChange={v => setF("exemptShortTerm", v)} label="Esenzione Short-term (<=12 mesi) — par. 5a" />
                  <Toggle value={data.exemptLowValue} onChange={v => setF("exemptLowValue", v)} label="Esenzione Low-value — par. 5b" />
                  <Toggle value={data.separateNonLeaseComponents} onChange={v => setF("separateNonLeaseComponents", v)} label="Separare componenti non-lease (par. 12)" />
                </div>
                <Field label="Periodicità Contabilizzazione"><Sel value={data.postingFrequency} onChange={v => setF("postingFrequency", v)} options={[...POSTING_FREQ]} /></Field>
              </>
            )}

            {sec === "financial" && (
              <>
                <SecTitle icon="💰" title="Parametri Finanziari" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tasso Annuo (%)" required={!isExempt} error={errors.discountRateAnnual}><Input type="number" value={data.discountRateAnnual} onChange={v => setF("discountRateAnnual", v)} placeholder="3.50" disabled={isExempt} cls={eb("discountRateAnnual")} /></Field>
                  <Field label="Origine Tasso"><Sel value={data.discountRateSource} onChange={v => setF("discountRateSource", v)} options={[...RATE_SOURCE]} disabled={isExempt} /></Field>
                  <Field label="Convenzione Giorni"><Sel value={data.dayCountBasis} onChange={v => setF("dayCountBasis", v)} options={[...DAY_COUNT]} /></Field>
                  <Field label="Timing Pagamento"><Sel value={data.paymentTiming} onChange={v => setF("paymentTiming", v)} options={[...PAYMENT_TIMING]} /></Field>
                  <Field label="IDC (EUR)" hint="Initial Direct Costs — par. 24c"><Input type="number" value={data.initialDirectCosts} onChange={v => setF("initialDirectCosts", v)} disabled={isExempt} /></Field>
                  <Field label="Pagamenti Anticipati (EUR)"><Input type="number" value={data.prepaidAmount} onChange={v => setF("prepaidAmount", v)} disabled={isExempt} /></Field>
                  <Field label="Incentivi (EUR)"><Input type="number" value={data.leaseIncentives} onChange={v => setF("leaseIncentives", v)} disabled={isExempt} /></Field>
                  <Field label="Provision Smantellamento (EUR)"><Input type="number" value={data.restorationProvision} onChange={v => setF("restorationProvision", v)} disabled={isExempt} /></Field>
                </div>
                {!isExempt && liability0 > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl p-4">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-3">Preview</div>
                    <div className="grid grid-cols-4 gap-3">
                      {([
                        ["Durata eff.", "blue", et + " mesi"],
                        ["Liability0", "rose", "€" + fmt(liability0, 0)],
                        ["ROU0", "emerald", "€" + fmt(rou0, 0)],
                        ["Amm./periodo", "violet", "€" + fmt(rou0 / Math.ceil(calcAmortTerm(data, et) / freqMonths), 0)],
                      ] as [string, string, string][]).map(([l, c, v]) => (
                        <div key={l} className="bg-white rounded-xl p-2.5 text-center">
                          <div className={`text-[10px] text-${c}-400 font-semibold`}>{l}</div>
                          <div className={`text-sm font-bold text-${c}-700`}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {sec === "fx" && (
              <>
                <SecTitle icon="💱" title="Valuta & FX" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valuta Contratto"><Input value={data.leaseCurrency} disabled /></Field>
                  <Field label="Valuta Locale"><Sel value={data.companyLocalCurrency} onChange={v => setF("companyLocalCurrency", v)} options={[...CURRENCIES]} /></Field>
                </div>
                {data.leaseCurrency !== data.companyLocalCurrency && (
                  <Field label="FX Rate iniziale"><Input type="number" value={data.fxRate} onChange={v => setF("fxRate", v)} placeholder="1.08" /></Field>
                )}
                {data.leaseCurrency === data.companyLocalCurrency && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-700">
                    Valuta locale — nessuna traduzione FX necessaria.
                  </div>
                )}
              </>
            )}

            {sec === "gl" && (
              <>
                <SecTitle icon="📒" title="Mapping Contabile GL" />
                <div className="grid grid-cols-2 gap-4">
                  {GL_FIELDS.map(([k, l]) => (
                    <Field key={k} label={l}><Input value={(data as any)[k]} onChange={(v: string) => setF(k, v)} /></Field>
                  ))}
                </div>
                <div className="mt-3">
                  <Toggle value={data.splitCurrentNonCurrent} onChange={v => setF("splitCurrentNonCurrent", v)} label="Split Liability Corrente / Non Corrente" />
                </div>
              </>
            )}

            {sec === "controlling" && (
              <>
                <SecTitle icon="🎯" title="Controlling" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Centro di Costo"><Sel value={data.costCenterId} onChange={v => setF("costCenterId", v)} options={MOCK_CCS} /></Field>
                  <Field label="Business Unit"><Sel value={data.businessUnit} onChange={v => setF("businessUnit", v)} options={MOCK_BUS} /></Field>
                  <Field label="Codice Progetto"><Input value={data.projectCode} onChange={v => setF("projectCode", v)} placeholder="PRJ-2024-001" /></Field>
                </div>
              </>
            )}

            {sec === "workflow" && (
              <>
                <SecTitle icon="✅" title="Workflow & Approvazione" />
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <Field label="Creato da"><Input value={data.createdBy} disabled /></Field>
                  <Field label="Data Creazione"><Input value={data.createdAt ? new Date(data.createdAt).toLocaleDateString("it-IT") : ""} disabled /></Field>
                  <Field label="Approvato da"><Input value={data.approvedBy} onChange={v => setF("approvedBy", v)} /></Field>
                </div>
                <Field label="Stato"><Sel value={data.status} onChange={v => setF("status", v)} options={[...STATUSES]} /></Field>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <div className="text-xs text-red-500">
            {Object.keys(errors).length > 0 && "⚠️ " + Object.keys(errors).length + " errore/i — controlla i campi"}
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">Annulla</button>
            <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
              {isNew ? "Crea Contratto" : "Salva Modifiche"}
            </button>
          </div>
        </div>
      </div>
      {showAI && <AIImportModal onImport={handleAIImport} onCancel={() => setShowAI(false)} />}
    </div>
  );
}
