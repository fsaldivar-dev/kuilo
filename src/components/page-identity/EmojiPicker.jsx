/**
 * EmojiPicker — Sprint 2.1
 * Popover ligero sin dependencias externas.
 * El usuario puede hacer click en el emoji de la página para cambiarlo.
 */

import { useState, useRef, useEffect } from "react";
import "./EmojiPicker.scss";

const COMMON_EMOJIS = [
  "📝","📄","📃","📋","📌","📍","🗒","🗓","📅","📆",
  "🏠","🏗","🏢","🏛","🏟","🏙","🌍","🌐","🗺",
  "🚀","⚡","🔥","💡","🎯","🎨","🎭","🎬","🎮","🎲",
  "📊","📈","📉","💼","🔧","🔨","⚙️","🛠","🔬","🔭",
  "📚","📖","✏️","🖊","🖋","📝","📓","📔","📒","📕",
  "💬","💭","🗣","👋","👍","❤️","⭐","🌟","✨","🎉",
  "🌙","☀️","🌈","❄️","🌊","🍀","🌸","🌺","🌻","🍁",
  "🐶","🐱","🐻","🦊","🐺","🦁","🐯","🐨","🐼","🦄",
];

export function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!popoverRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus al abrir
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = search
    ? COMMON_EMOJIS.filter(() => true) // con búsqueda real necesitaríamos metadatos
    : COMMON_EMOJIS;

  const handleSelect = (emoji) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  const handleRemove = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <div className="emoji-picker-root" ref={popoverRef}>
      <button
        className={`emoji-trigger ${value ? "has-emoji" : "empty"}`}
        onClick={() => setOpen((v) => !v)}
        title="Cambiar emoji de la página"
        aria-label="Cambiar emoji"
      >
        {value || <span className="emoji-placeholder">😊</span>}
      </button>

      {open && (
        <div className="emoji-popover">
          <input
            ref={inputRef}
            className="emoji-search"
            placeholder="Buscar emoji…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="emoji-grid">
            {filtered.map((emoji) => (
              <button
                key={emoji}
                className="emoji-option"
                onClick={() => handleSelect(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
          {value && (
            <button className="emoji-remove" onClick={handleRemove}>
              Quitar emoji
            </button>
          )}
        </div>
      )}
    </div>
  );
}
