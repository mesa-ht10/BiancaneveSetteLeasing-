export const fmt = (v: number | null | undefined, d = 2): string =>
  v != null ? new Intl.NumberFormat("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v) : "—";

export const fmtDate = (d: string | Date | undefined | null): string =>
  d ? new Date(d as string).toLocaleDateString("it-IT") : "—";

export const genId = (): string =>
  `LEA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

export const n = (v: string | number | undefined | null): number =>
  parseFloat(String(v || 0)) || 0;

export const monthsBetween = (a: string | Date, b: string | Date): number => {
  if (!a || !b) return 0;
  const d1 = new Date(a as string);
  const d2 = new Date(b as string);
  return Math.max(0, (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth());
};

export const addMonths = (date: string | Date, n: number): Date => {
  const d = new Date(date as string);
  d.setMonth(d.getMonth() + n);
  return d;
};
