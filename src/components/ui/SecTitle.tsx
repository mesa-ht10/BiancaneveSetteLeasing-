interface SecTitleProps {
  icon: string;
  title: string;
  sub?: string;
}

export function SecTitle({ icon, title, sub }: SecTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="font-bold text-gray-700 text-sm">{title}</div>
        {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
      </div>
    </div>
  );
}
