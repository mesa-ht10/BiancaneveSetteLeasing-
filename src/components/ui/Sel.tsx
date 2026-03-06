interface SelectOption {
  value: string;
  label: string;
}

interface SelProps {
  value: string | undefined;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  disabled?: boolean;
}

export function Sel({ value, onChange, options, disabled }: SelProps) {
  return (
    <select
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50"
    >
      <option value="">— seleziona —</option>
      {options.map(o => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}
