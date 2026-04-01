import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Settings, Loader, ExternalLink } from "lucide-react";

const api = window.notesApi;

const PROVIDERS = [
  { id: "gemini", label: "Gemini Flash (Google)", placeholder: "AIza...", keyUrl: "https://aistudio.google.com/apikey", keyLabel: "Obtener API key gratis →" },
  { id: "anthropic", label: "Claude Haiku (Anthropic)", placeholder: "sk-ant-...", keyUrl: "https://console.anthropic.com/settings/keys", keyLabel: "Crear API key →" },
  { id: "openai", label: "GPT-4o mini (OpenAI)", placeholder: "sk-...", keyUrl: "https://platform.openai.com/api-keys", keyLabel: "Crear API key →" },
];

const STORAGE_KEY = "kuilo-ai-config";

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function AiChat({ open, onClose, vaultContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(loadConfig);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const provider = config.provider || "gemini";
  const apiKey = config.apiKey || "";

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) { setShowSettings(true); return; }

    const userMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const result = await api?.aiChat?.({
      messages: nextMessages.slice(-10), // last 10 messages for context window
      provider,
      apiKey,
      vaultContext,
    });

    if (result?.content) {
      setMessages([...nextMessages, { role: "assistant", content: result.content }]);
    } else {
      setMessages([...nextMessages, { role: "assistant", content: `Error: ${result?.error || "Sin respuesta"}` }]);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <Bot size={15} />
        <span>Kuilo AI</span>
        <div className="ai-chat-header-actions">
          <button className="ai-chat-settings-btn" onClick={() => setShowSettings((c) => !c)} title="Configurar API key">
            <Settings size={13} />
          </button>
          <button className="ai-chat-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="ai-chat-config">
          <label className="ai-chat-label">Provider</label>
          <select
            className="ai-chat-select"
            value={provider}
            onChange={(e) => { const c = { ...config, provider: e.target.value }; setConfig(c); saveConfig(c); }}
          >
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <label className="ai-chat-label">API Key</label>
          <input
            className="ai-chat-key-input"
            type="password"
            placeholder={PROVIDERS.find((p) => p.id === provider)?.placeholder}
            value={apiKey}
            onChange={(e) => { const c = { ...config, apiKey: e.target.value }; setConfig(c); saveConfig(c); }}
          />
          {(() => {
            const prov = PROVIDERS.find((p) => p.id === provider);
            return prov?.keyUrl && (
              <a className="ai-chat-key-link" href={prov.keyUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={11} /> {prov.keyLabel}
              </a>
            );
          })()}
          <p className="ai-chat-hint">
            La key se guarda localmente. Nunca se envía a Kuilo — solo al provider que elijas.
          </p>
        </div>
      )}

      <div className="ai-chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="ai-chat-empty">
            <Bot size={24} />
            <p>Pregunta sobre tu vault, pide ayuda con un doc, o consulta las metodologías.</p>
            <div className="ai-chat-suggestions">
              <button onClick={() => setInput("¿Qué me falta documentar?")}>¿Qué me falta?</button>
              <button onClick={() => setInput("¿Cómo escribo un PRD?")}>¿Cómo escribo un PRD?</button>
              <button onClick={() => setInput("¿Por dónde empiezo?")}>¿Por dónde empiezo?</button>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-chat-msg ai-chat-msg-${msg.role}`}>
            <div className="ai-chat-msg-icon">
              {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className="ai-chat-msg-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-chat-msg ai-chat-msg-assistant">
            <div className="ai-chat-msg-icon"><Bot size={12} /></div>
            <div className="ai-chat-msg-content"><Loader size={14} className="ai-chat-spinner" /></div>
          </div>
        )}
      </div>

      <div className="ai-chat-input-row">
        <input
          ref={inputRef}
          type="text"
          className="ai-chat-input"
          placeholder={apiKey ? "Pregunta algo..." : "Configura tu API key →"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          disabled={loading}
        />
        <button className="ai-chat-send" onClick={send} disabled={loading || !input.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
