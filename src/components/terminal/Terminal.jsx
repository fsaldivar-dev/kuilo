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

export function TerminalPanel({ open, onClose }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitRef = useRef(null);
  const [minimized, setMinimized] = useState(false);
  const [alive, setAlive] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!open || !containerRef.current || initialized.current) return;
    if (!api?.terminalCreate) return;

    initialized.current = true;

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

    // Wait a tick for container to be in DOM
    requestAnimationFrame(() => {
      term.open(containerRef.current);
      fit.fit();

      xtermRef.current = term;
      fitRef.current = fit;

      // Register data listener BEFORE creating PTY
      api.onTerminalData((data) => {
        term.write(data);
      });

      api.onTerminalExit(() => {
        term.write("\r\n\x1b[90m[Proceso terminado — presiona cualquier tecla para reiniciar]\x1b[0m\r\n");
        setAlive(false);
      });

      // User input → PTY
      term.onData((data) => {
        if (!alive) {
          // Restart if process exited
          api.terminalCreate().then(() => setAlive(true));
          return;
        }
        api.terminalWrite({ data });
      });

      // Resize → PTY
      term.onResize(({ cols, rows }) => {
        api.terminalResize({ cols, rows });
      });

      // Start PTY
      api.terminalCreate().then(() => {
        setAlive(true);
      });
    });

    const handleResize = () => fitRef.current?.fit();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  // Refit when un-minimized
  useEffect(() => {
    if (!minimized && open && fitRef.current) {
      setTimeout(() => fitRef.current.fit(), 50);
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
          <button className="terminal-btn" onClick={() => setMinimized((m) => !m)}>
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button className="terminal-btn" onClick={() => {
            api?.terminalKill?.();
            initialized.current = false;
            xtermRef.current?.dispose();
            xtermRef.current = null;
            fitRef.current = null;
            setAlive(false);
            onClose();
          }}>
            <X size={13} />
          </button>
        </div>
      </div>
      <div
        className="terminal-body"
        ref={containerRef}
        style={{ display: minimized ? "none" : "block" }}
      />
    </div>
  );
}
