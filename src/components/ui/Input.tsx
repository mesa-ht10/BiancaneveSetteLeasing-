interface InputProps {
  value: string | number | undefined;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  cls?: string;
}

export function Input({ value, onChange, type = "text", placeholder, disabled, cls = "" }: InputProps) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-400 ${cls || "border-gray-200"}`}
    />
  );
}
