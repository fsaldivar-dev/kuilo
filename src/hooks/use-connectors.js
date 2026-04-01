import { useState } from "react";

const api = window.notesApi;

export function useConnectors(refreshBackupStatus) {
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [mcpInfo, setMcpInfo] = useState(null);

  const openConnectors = async () => {
    setConnectorsOpen(true);
    if (api?.getMcpInfo) {
      const info = await api.getMcpInfo();
      setMcpInfo(info);
    }
    await refreshBackupStatus();
  };

  const connectTarget = async (target) => {
    if (!api?.configureAiConnector) return;
    await api.configureAiConnector({ target });
    const info = await api.getMcpInfo();
    setMcpInfo(info);
  };

  const disconnectTarget = async (target) => {
    if (!api?.disconnectAiConnector) return;
    await api.disconnectAiConnector({ target });
    const info = await api.getMcpInfo();
    setMcpInfo(info);
  };

  return {
    connectorsOpen,
    setConnectorsOpen,
    mcpInfo,
    openConnectors,
    connectTarget,
    disconnectTarget,
  };
}
