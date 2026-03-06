import { Contract } from "../types";
import { n } from "./formatters";

export function validateContract(data: Contract): Record<string, string> {
  const e: Record<string, string> = {};
  if (!data.contractCode) e.contractCode = "Obbligatorio";
  if (!data.description) e.description = "Obbligatorio";
  if (!data.lessorId) e.lessorId = "Obbligatorio";
  if (!data.commencementDate) e.commencementDate = "Obbligatorio";
  if (!data.endDate) e.endDate = "Obbligatorio";
  if (data.commencementDate && data.endDate && data.commencementDate >= data.endDate)
    e.endDate = "Data fine deve essere successiva alla data inizio";
  if (!data.leaseCategory) e.leaseCategory = "Obbligatorio";
  if (!data.basePaymentAmount) e.basePaymentAmount = "Obbligatorio";
  if (data.purchaseOptionReasonablyCertain) {
    if (!data.purchaseOption) e.purchaseOption = "Attivare l'opzione di acquisto se ragionevolmente certa";
    if (!n(data.purchaseOptionPrice) || n(data.purchaseOptionPrice) <= 0) e.purchaseOptionPrice = "Prezzo obbligatorio e > 0";
  }
  if (data.terminationOptionReasonablyCertain) {
    if (!data.terminationOption) e.terminationOption = "Attivare l'opzione di recesso se ragionevolmente certa";
    if (!data.terminationOptionDate) e.terminationOptionDate = "Data recesso obbligatoria se ragionevolmente certa";
  }
  if (data.renewalOptionReasonablyCertain) {
    if (!data.renewalOption) e.renewalOption = "Attivare l'opzione di rinnovo se ragionevolmente certa";
    if (!n(data.renewalOptionMonths) || n(data.renewalOptionMonths) <= 0) e.renewalOptionMonths = "Mesi rinnovo obbligatori e > 0";
  }
  if (!data.exemptShortTerm && !data.exemptLowValue) {
    if (!data.discountRateAnnual) e.discountRateAnnual = "Obbligatorio per contratti IFRS16";
    else if (n(data.discountRateAnnual) < 0) e.discountRateAnnual = "Il tasso deve essere >= 0";
  }
  if (data.ownershipTransferLikely && (!n(data.usefulLifeMonths) || n(data.usefulLifeMonths) <= 0))
    e.usefulLifeMonths = "Vita utile obbligatoria e > 0 se trasferimento proprietà previsto";
  return e;
}
