import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

/**
 * Dropdown menu for @mention page selection.
 * Positioned near the cursor, navigable with arrow keys.
 */
export function PageMentionMenu({ items, command, clientRect }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => { setSelectedIndex(0); }, [items]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) command(items[selectedIndex]);
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [items, selectedIndex, command]);

  useEffect(() => {
    listRef.current?.children[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!items.length) return null;

  const rect = clientRect?.();
  const style = rect ? {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.bottom + 6}px`,
    zIndex: 9999,
  } : {};

  return (
    <div className="mention-menu" style={style} ref={listRef}>
      {items.map((item, i) => (
        <button
          key={item.pagePath || item.title}
          className={`mention-item ${i === selectedIndex ? "selected" : ""}`}
          onClick={() => command(item)}
          onMouseEnter={() => setSelectedIndex(i)}
        >
          <FileText size={13} />
          <span className="mention-item-text">
            <span className="mention-item-title">{item.title}</span>
            <span className="mention-item-pkg">{item.packageName}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
