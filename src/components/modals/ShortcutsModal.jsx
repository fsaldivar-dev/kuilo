import { X } from "lucide-react";

const isMac = navigator.platform.includes("Mac");
const mod = isMac ? "⌘" : "Ctrl";

const SHORTCUTS = [
  { section: "General", items: [
    { keys: `${mod}+K`, desc: "Command palette" },
    { keys: `${mod}+S`, desc: "Guardar (auto)" },
    { keys: `${mod}+Z`, desc: "Deshacer" },
    { keys: `${mod}+Shift+Z`, desc: "Rehacer" },
    { keys: `${mod}+?`, desc: "Atajos de teclado" },
  ]},
  { section: "Editor", items: [
    { keys: `${mod}+B`, desc: "Negrita" },
    { keys: `${mod}+I`, desc: "Cursiva" },
    { keys: `${mod}+U`, desc: "Subrayado" },
    { keys: `${mod}+E`, desc: "Código inline" },
    { keys: `${mod}+Shift+X`, desc: "Tachado" },
    { keys: `${mod}+Shift+H`, desc: "Resaltado" },
  ]},
  { section: "Bloques", items: [
    { keys: "/", desc: "Slash commands (insertar bloque)" },
    { keys: "@", desc: "Mencionar página (wiki link)" },
    { keys: `${mod}+Shift+1`, desc: "Heading 1" },
    { keys: `${mod}+Shift+2`, desc: "Heading 2" },
    { keys: `${mod}+Shift+7`, desc: "Lista ordenada" },
    { keys: `${mod}+Shift+8`, desc: "Lista con viñetas" },
    { keys: `${mod}+Shift+9`, desc: "Cita (blockquote)" },
  ]},
  { section: "Navegación", items: [
    { keys: `${mod}+W`, desc: "Cerrar tab activo" },
    { keys: `${mod}+Tab`, desc: "Siguiente tab" },
    { keys: `${mod}+Shift+Tab`, desc: "Tab anterior" },
  ]},
];

export function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="connectors-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h3>Atajos de teclado</h3>
          <button className="history-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="shortcuts-body">
          {SHORTCUTS.map((group) => (
            <div key={group.section} className="shortcuts-group">
              <h4>{group.section}</h4>
              {group.items.map((item) => (
                <div key={item.keys} className="shortcut-row">
                  <span className="shortcut-desc">{item.desc}</span>
                  <kbd className="shortcut-keys">{item.keys}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
