interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function Toggle({ value, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full relative transition-colors ${value ? "bg-blue-500" : "bg-gray-200"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? "left-5" : "left-0.5"}`} />
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </label>
  );
}
