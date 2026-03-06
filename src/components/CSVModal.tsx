import { CSVPreview } from "../types";

interface CSVModalProps extends CSVPreview {
  onClose: () => void;
}

export function CSVModal({ title, filename, content, onClose }: CSVModalProps) {
  const lines = content.split("\n").slice(0, 10);
  const copyAll = () => { try { navigator.clipboard.writeText(content); } catch (e) {} };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 bg-gray-800 rounded-t-2xl flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-sm">{title}</div>
            <div className="text-gray-400 text-xs">{filename}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-xl p-4 overflow-auto">
            {lines.join("\n")}{content.split("\n").length > 10 && "\n... (altri record)"}
          </pre>
        </div>
        <div className="border-t px-6 py-4 flex justify-between bg-gray-50 rounded-b-2xl">
          <button onClick={copyAll} className="px-4 py-2 rounded-xl bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800">
            Copia CSV
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
