import { FileText, X, Copy, Star, StarOff } from "lucide-react";

export function TabBar({ tabs, activeTabId, onSwitch, onClose, onCloseOthers, favorites, onToggleFavorite }) {
  if (!tabs.length) return null;

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? "active" : ""}`}
          onClick={() => onSwitch(tab.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onCloseOthers(tab.id);
          }}
        >
          {favorites?.has(tab.id) && <Star size={10} className="tab-star" />}
          <FileText size={11} />
          <span className="tab-title">{tab.title}</span>
          <button
            className="tab-close"
            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}
