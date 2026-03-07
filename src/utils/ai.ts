const MODEL = "claude-sonnet-4-20250514";

async function callProxy(body: Record<string, unknown>): Promise<Response> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `HTTP ${response.status}`);
  }
  return response;
}

export async function analyzeLeasePDF(base64Data: string): Promise<Record<string, unknown>> {
  const systemPrompt = `Sei un esperto contabile IFRS16. Estrai dati dal contratto.
Rispondi SOLO con JSON valido, no testo extra, no backtick:
{"contractCode":"","description":"","lessorName":"","leaseCurrency":"EUR","commencementDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","leaseCategory":"PROPERTY|VEHICLE|IT_EQUIPMENT|MACHINERY|FURNITURE|OTHER","assetDescription":"","basePaymentAmount":"","paymentTiming":"ARREARS|ADVANCE","discountRateAnnual":"","discountRateSource":"IBR|IMPLICIT","initialDirectCosts":"","prepaidAmount":"","leaseIncentives":"","restorationProvision":"","usefulLifeMonths":"","purchaseOption":false,"purchaseOptionPrice":"","purchaseOptionDate":"","purchaseOptionReasonablyCertain":false,"terminationOption":false,"terminationOptionDate":"","terminationOptionPenalty":"","renewalOption":false,"renewalOptionMonths":"","ownershipTransferLikely":false,"exemptShortTerm":false,"exemptLowValue":false,"notes":"","confidence":"HIGH|MEDIUM|LOW","warnings":[]}`;
  const response = await callProxy({
    model: MODEL, max_tokens: 1000, system: systemPrompt,
    messages: [{ role: "user", content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } },
      { type: "text", text: "Analizza e restituisci JSON." },
    ] }],
  });
  const data = await response.json();
  const raw = (data as any).content?.find((b: any) => b.type === "text")?.text || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

export async function askAIAssistant(
  messages: { role: string; content: string }[],
  contractContext: Record<string, unknown> | null,
): Promise<string> {
  const system = `Sei MESA AI, assistente esperto IFRS16. Rispondi in italiano in modo conciso e professionale.
Dati contratto corrente: ${JSON.stringify(contractContext || {}, null, 2)}
Fornisci guidance su: calcoli IFRS16, normativa, trattamento contabile, disclosure.`;
  const response = await callProxy({ model: MODEL, max_tokens: 1000, system, messages });
  const data = await response.json();
  return (data as any).content?.find((b: any) => b.type === "text")?.text || "Errore nella risposta AI.";
}
