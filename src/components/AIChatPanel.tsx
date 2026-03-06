import { useState, useEffect, useRef } from "react";
import { Contract } from "../types";
import { askAIAssistant } from "../utils/ai";

const HAS_API_KEY = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

interface AIChatPanelProps {
  contract: Contract | undefined;
  onClose: () => void;
}

const SUGGESTIONS = [
  "Spiegami il calcolo del ROU Asset",
  "Quando si applica l'esenzione short-term?",
  "Come gestire una modifica del contratto?",
  "Qual è il trattamento dell'opzione di acquisto?",
];

export function AIChatPanel({ contract, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Ciao! Sono MESA AI, il tuo assistente IFRS16. Posso aiutarti con calcoli, interpretazioni normative e trattamento contabile. Cosa vuoi sapere?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(""); setLoading(true);
    try {
      const apiMsgs = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await askAIAssistant(apiMsgs, contract as any);
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore di comunicazione con l'AI.";
      setMessages(p => [...p, { role: "assistant", content: `⚠️ ${msg}` }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col" style={{ height: "520px" }}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🤖</div>
          <div>
            <div className="text-white font-bold text-sm">MESA AI</div>
            <div className="text-violet-200 text-[10px]">Assistente IFRS16</div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-xl">×</button>
      </div>
      {!HAS_API_KEY && (
        <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[10px] text-amber-700 leading-relaxed">
          <strong>⚠️ API key non configurata.</strong><br />
          Crea il file <code className="bg-amber-100 px-1 rounded">.env.local</code> con:<br />
          <code className="bg-amber-100 px-1 rounded">VITE_ANTHROPIC_API_KEY=sk-ant-...</code><br />
          poi riavvia il server.
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-500 animate-pulse">AI sta elaborando...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => setInput(s)} className="bg-violet-50 text-violet-700 border border-violet-200 rounded-lg px-2 py-1 text-[10px] hover:bg-violet-100">
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Chiedi all'AI..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-violet-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-violet-700"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
