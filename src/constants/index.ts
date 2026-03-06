export const LEASE_CATEGORIES = ["PROPERTY", "VEHICLE", "IT_EQUIPMENT", "MACHINERY", "FURNITURE", "OTHER"] as const;
export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY", "SEK"] as const;
export const STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "ACTIVE", "CLOSED", "TERMINATED"] as const;
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-indigo-100 text-indigo-700",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-amber-100 text-amber-700",
  TERMINATED: "bg-red-100 text-red-700",
};
export const POSTING_FREQ = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL"] as const;
export const FREQ_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6 };
export const DAY_COUNT = ["ACT/365", "ACT/360", "30/360"] as const;
export const PAYMENT_TIMING = ["ARREARS", "ADVANCE"] as const;
export const RATE_SOURCE = ["IBR", "IMPLICIT"] as const;
export const MOCK_LESSORS = [
  { id: "L001", name: "Immobiliare Rossi SpA" },
  { id: "L002", name: "AutoLease Italia Srl" },
  { id: "L003", name: "TechRent Srl" },
  { id: "L004", name: "PropCo SA" },
];
export const MOCK_CCS = ["CC-ADM", "CC-IT", "CC-SALES", "CC-OPS", "CC-FIN"];
export const MOCK_BUS = ["HQ", "NORTH", "SOUTH", "INTERNATIONAL"];
export const CAT_ICONS: Record<string, string> = {
  PROPERTY: "🏢",
  VEHICLE: "🚗",
  IT_EQUIPMENT: "🖥️",
  MACHINERY: "⚙️",
  FURNITURE: "🪑",
  OTHER: "📦",
};
export const NAV_TABS = ["Contratti", "Piano Ammortamento", "Journal Entries", "Financial Statements", "Modifiche", "Export", "IFRS18 Impact"];
export const STORAGE_KEY = "mesa_ifrs16_v4";
