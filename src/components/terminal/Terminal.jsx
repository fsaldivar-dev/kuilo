import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { ChevronDown, ChevronUp, X, TerminalSquare } from "lucide-react";
import "xterm/css/xterm.css";

const api = window.notesApi;

const THEME_DARK = {
  background: "#1c1c1e",
  foreground: "#f2f2f7",
  cursor: "#f2f2f7",
  cursorAccent: "#1c1c1e",
  selectionBackground: "rgba(255,255,255,0.15)",
  black: "#1c1c1e",
  red: "#ff3b30",
  green: "#34c759",
  yellow: "#ff9f0a",
  blue: "#0a84ff",
  magenta: "#bf5af2",
  cyan: "#64d2ff",
  white: "#f2f2f7",
  brightBlack: "#636366",
  brightRed: "#ff6961",
  brightGreen: "#4cd964",
  brightYellow: "#ffd60a",
  brightBlue: "#64d2ff",
  brightMagenta: "#da8fff",
  brightCyan: "#5ac8fa",
  brightWhite: "#ffffff",
};

export function TerminalPanel({ open, onClose, onToggleSize }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [alive, setAlive] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current || xtermRef.current) return;

    const term = new XTerm({
      theme: THEME_DARK,
      fontFamily: '"SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    xtermRef.current = term;
    fitRef.current = fit;

    // Connect to PTY
    api?.terminalCreate?.().then(() => {
      setAlive(true);

      api.onTerminalData((data) => {
        term.write(data);
      });

      api.onTerminalExit(() => {
        term.write("\r\n[Process exited]\r\n");
        setAlive(false);
      });

      // Send user input to PTY
      term.onData((data) => {
        api.terminalWrite({ data });
      });

      // Handle resize
      term.onResize(({ cols, rows }) => {
        api.terminalResize({ cols, rows });
      });

      fit.fit();
    });

    // Window resize
    const handleResize = () => { fitRef.current?.fit(); };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  // Refit when minimized state changes
  useEffect(() => {
    if (!minimized && open) {
      setTimeout(() => fitRef.current?.fit(), 100);
    }
  }, [minimized, open]);

  if (!open) return null;

  return (
    <div className={`terminal-panel ${minimized ? "terminal-minimized" : ""}`}>
      <div className="terminal-header">
        <TerminalSquare size={13} />
        <span className="terminal-title">Terminal</span>
        <span className={`terminal-status ${alive ? "alive" : ""}`}>
          {alive ? "●" : "○"}
        </span>
        <div className="terminal-actions">
          <button className="terminal-btn" onClick={() => setMinimized((m) => !m)} title={minimized ? "Expandir" : "Minimizar"}>
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button className="terminal-btn" onClick={() => { api?.terminalKill?.(); onClose(); }} title="Cerrar terminal">
            <X size={13} />
          </button>
        </div>
      </div>
      <div className="terminal-body" ref={containerRef} style={{ display: minimized ? "none" : "block" }} />
    </div>
  );
}
