import { useMemo, useState } from "react";
import { chat } from "../api/client";

const EMERGENCY = ["pain", "bleeding", "dizzy"];

export default function ChatUI({ trimester = 2 }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi — ask me about prenatal yoga safety, breathing, and trimester-friendly modifications." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [warn, setWarn] = useState(false);

  const emergency = useMemo(() => {
    const t = input.toLowerCase();
    return EMERGENCY.some((k) => t.includes(k));
  }, [input]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setWarn(emergency);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setTyping(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await chat({
        user_message: text,
        conversation_history: history,
        trimester,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.bot_response }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry — chat is unavailable right now." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-sage/15 bg-white">
      {warn && (
        <div className="rounded-t-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          If you have pain, bleeding, dizziness, or emergency symptoms, stop and seek medical care immediately.
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-sage text-white" : "bg-cream text-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {typing && <div className="text-sm text-slate-500">Assistant is typing…</div>}
      </div>
      <div className="border-t border-sage/10 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl border border-sage/20 px-3 py-2"
            placeholder="Ask a prenatal yoga question…"
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button type="button" className="rounded-xl bg-sage px-4 py-2 text-white" onClick={send}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
