import { STATUS_COLORS } from "../../constants";

interface BadgeProps {
  s: string;
}

export function Badge({ s }: BadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[s] || "bg-gray-100"}`}>
      {s}
    </span>
  );
}
