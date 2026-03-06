interface ExportTabProps {
  handleExportSchedule: () => void;
  handleExportJE: () => void;
  handleExportAll: () => void;
  selectedContractExists: boolean;
}

const EXPORT_ITEMS = [
  {
    key: "schedule",
    title: "Piano Ammortamento",
    sub: "Schedule completo del contratto selezionato",
    needsContract: true,
  },
  {
    key: "je",
    title: "Journal Entries",
    sub: "Tutte le scritture contabili del contratto selezionato",
    needsContract: true,
  },
  {
    key: "all",
    title: "Riepilogo Tutti i Contratti",
    sub: "Overview di tutti i contratti con dati IFRS16",
    needsContract: false,
  },
];

export function ExportTab({ handleExportSchedule, handleExportJE, handleExportAll, selectedContractExists }: ExportTabProps) {
  const handlers: Record<string, () => void> = {
    schedule: handleExportSchedule,
    je: handleExportJE,
    all: handleExportAll,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="text-sm font-bold text-gray-700 mb-4">Export Dati IFRS16</div>
        <div className="space-y-3">
          {EXPORT_ITEMS.map(({ key, title, sub, needsContract }) => (
            <button
              key={key}
              onClick={handlers[key]}
              disabled={needsContract && !selectedContractExists}
              className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div>
                <div className="font-semibold text-gray-700 text-sm">{title}</div>
                <div className="text-xs text-gray-400">{sub}</div>
              </div>
              <div className="ml-auto text-gray-400 text-sm">→</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
