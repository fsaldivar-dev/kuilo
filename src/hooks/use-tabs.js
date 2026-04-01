import { useState, useCallback } from "react";

/**
 * Manages open document tabs.
 * Tabs persist the list of open docs; the active tab is the one being edited.
 */
export function useTabs() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  const openTab = useCallback((doc) => {
    const id = `${doc.packageName}/${doc.pagePath}`;
    setTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, ...doc }];
    });
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      // If closing the active tab, switch to the nearest one
      setActiveTabId((currentId) => {
        if (currentId !== id) return currentId;
        const idx = prev.findIndex((t) => t.id === id);
        const neighbor = next[Math.min(idx, next.length - 1)];
        return neighbor?.id || null;
      });
      return next;
    });
  }, []);

  const closeOtherTabs = useCallback((keepId) => {
    setTabs((prev) => prev.filter((t) => t.id === keepId));
    setActiveTabId(keepId);
  }, []);

  const switchTab = useCallback((id) => {
    setActiveTabId(id);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  return {
    tabs,
    activeTab,
    activeTabId,
    openTab,
    closeTab,
    closeOtherTabs,
    switchTab,
  };
}
