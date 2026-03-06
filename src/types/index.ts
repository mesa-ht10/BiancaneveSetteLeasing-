export interface Modification {
  id: string;
  effectiveDate: string;
  type: string;
  newPaymentAmount: string;
  newDiscountRate: string;
  reason: string;
  remeasuredLiability: number;
  prevLiability: number;
  applied: boolean;
}

export interface Contract {
  contractId: string;
  companyId: string;
  contractCode: string;
  description: string;
  lessorId: string;
  leaseCurrency: string;
  commencementDate: string;
  endDate: string;
  status: string;
  leaseCategory: string;
  assetDescription: string;
  ownershipTransferLikely: boolean;
  usefulLifeMonths: string;
  purchaseOption: boolean;
  terminationOption: boolean;
  renewalOption: boolean;
  purchaseOptionPrice: string;
  purchaseOptionDate: string;
  purchaseOptionReasonablyCertain: boolean;
  terminationOptionDate: string;
  terminationOptionPenalty: string;
  terminationOptionReasonablyCertain: boolean;
  renewalOptionMonths: string;
  renewalOptionReasonablyCertain: boolean;
  exemptShortTerm: boolean;
  exemptLowValue: boolean;
  separateNonLeaseComponents: boolean;
  postingFrequency: string;
  discountRateAnnual: string;
  dayCountBasis: string;
  paymentTiming: string;
  basePaymentAmount: string;
  initialDirectCosts: string;
  prepaidAmount: string;
  leaseIncentives: string;
  restorationProvision: string;
  discountRateSource: string;
  companyLocalCurrency: string;
  fxTranslationMethod: string;
  fxRate: string;
  fxRates: number[] | null;
  accROU: string;
  accLeaseLiability: string;
  accInterestExp: string;
  accDepExp: string;
  accServiceExp: string;
  accImpairmentLoss: string;
  accImpairmentReversal: string;
  accIFRS16Clearing: string;
  accFxDiff: string;
  accLeaseExpense: string;
  accIncentiveLiability: string;
  accRestorationProvision: string;
  splitCurrentNonCurrent: boolean;
  accLeaseLiabilityCurrent: string;
  accLeaseLiabilityNonCurrent: string;
  costCenterId: string;
  businessUnit: string;
  projectCode: string;
  approvedBy: string;
  approvedAt: string;
  submittedBy: string;
  submittedAt: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  notes: string;
  modifications: Modification[];
}

export interface ScheduleRow {
  period: number;
  date: Date;
  freqMonths: number;
  openingLiab: number;
  interest: number;
  principal: number;
  payment: number;
  closingLiab: number;
  rouGross: number;
  rouAccAmort: number;
  rouNet: number;
  depreciation: number;
  fxDiff: number;
  isFX: boolean;
  modApplied: string | null;
  currentLiab?: number;
  nonCurrentLiab?: number;
}

export interface ExemptRow {
  period: number;
  date: Date;
  payment: number;
  isExempt: boolean;
}

export interface Schedule {
  isExempt?: boolean;
  rows: ScheduleRow[] | ExemptRow[];
  leaseTermMonths: number;
  freqMonths: number;
  totalExpense?: number;
  liability0?: number;
  rou0?: number;
  rouAmortPerPeriod?: number;
  numPeriods?: number;
  isFX?: boolean;
  annualRate?: number;
  periodicRate?: number;
}

export interface JELine {
  account: string;
  desc: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  date: string | Date;
  type: string;
  period: number | string;
  lines: JELine[];
}

export interface CSVPreview {
  title: string;
  filename: string;
  content: string;
}

export interface FormState {
  contract: Contract;
  isNew: boolean;
}
