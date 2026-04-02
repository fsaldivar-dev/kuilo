import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { ChevronDown, ChevronUp, X, TerminalSquare } from "lucide-react";
import "xterm/css/xterm.css";

const api = window.notesApi;

const MODES = [
  { id: "gemini", label: "Gemini CLI", icon: "✦" },
  { id: "claude", label: "Claude CLI", icon: "◇" },
  { id: "shell", label: "Terminal (bash/zsh)", icon: ">" },
];

const THEME_DARK = {
  background: "#1c1c1e",
  foreground: "#f2f2f7",
  cursor: "#f2f2f7",
  cursorAccent: "#1c1c1e",
  selectionBackground: "rgba(255,255,255,0.15)",
  black: "#1c1c1e", red: "#ff3b30", green: "#34c759", yellow: "#ff9f0a",
  blue: "#0a84ff", magenta: "#bf5af2", cyan: "#64d2ff", white: "#f2f2f7",
  brightBlack: "#636366", brightRed: "#ff6961", brightGreen: "#4cd964",
  brightYellow: "#ffd60a", brightBlue: "#64d2ff", brightMagenta: "#da8fff",
  brightCyan: "#5ac8fa", brightWhite: "#ffffff",
};

export function TerminalPanel({ open, onClose, activeDoc }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [alive, setAlive] = useState(false);
  const [mode, setMode] = useState(null); // null = show picker
  const initialized = useRef(false);

  const startTerminal = (selectedMode) => {
    if (!containerRef.current || !api?.terminalCreate) return;
    if (initialized.current) return;
    initialized.current = true;
    setMode(selectedMode);

    const term = new XTerm({
      theme: THEME_DARK,
      fontFamily: '"SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);

    requestAnimationFrame(() => {
      term.open(containerRef.current);
      fit.fit();
      xtermRef.current = term;
      fitRef.current = fit;

      api.onTerminalData((data) => term.write(data));
      api.onTerminalExit(() => {
        term.write("\r\n\x1b[90m[Proceso terminado]\x1b[0m\r\n");
        setAlive(false);
      });
      term.onData((data) => api.terminalWrite({ data }));
      term.onResize(({ cols, rows }) => api.terminalResize({ cols, rows }));

      // Build initial prompt with active doc context
      let prompt = null;
      if (activeDoc && selectedMode !== "shell") {
        prompt = `Estoy trabajando en el documento "${activeDoc.title}" del paquete "${activeDoc.packageName}". Ayúdame con este documento. Usa las herramientas MCP de kuilo-vault para leer el contenido.`;
      }

      api.terminalCreate({ mode: selectedMode, prompt }).then(() => setAlive(true));
    });

    const handleResize = () => fitRef.current?.fit();
    window.addEventListener("resize", handleResize);
  };

  useEffect(() => {
    if (!minimized && open && fitRef.current) {
      setTimeout(() => fitRef.current.fit(), 50);
    }
  }, [minimized, open]);

  const handleClose = () => {
    api?.terminalKill?.();
    initialized.current = false;
    xtermRef.current?.dispose();
    xtermRef.current = null;
    fitRef.current = null;
    setAlive(false);
    setMode(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={`terminal-panel ${minimized ? "terminal-minimized" : ""}`}>
      <div className="terminal-header">
        <TerminalSquare size={13} />
        <span className="terminal-title">{mode ? MODES.find((m) => m.id === mode)?.label : "Terminal"}</span>
        {alive && <span className="terminal-status alive">●</span>}
        <div className="terminal-actions">
          <button className="terminal-btn" onClick={() => setMinimized((m) => !m)}>
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button className="terminal-btn" onClick={handleClose}>
            <X size={13} />
          </button>
        </div>
      </div>

      {!mode && !minimized && (
        <div className="terminal-picker">
          <p className="terminal-picker-hint">Elige cómo abrir la terminal:</p>
          {MODES.map((m) => (
            <button key={m.id} className="terminal-mode-btn" onClick={() => startTerminal(m.id)}>
              <span className="terminal-mode-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
          {activeDoc && (
            <p className="terminal-picker-context">
              Contexto: <strong>{activeDoc.title}</strong> ({activeDoc.packageName})
            </p>
          )}
        </div>
      )}

      <div
        className="terminal-body"
        ref={containerRef}
        style={{ display: (!mode || minimized) ? "none" : "block" }}
      />
    </div>
  );
}
