import { useState } from "react";

const api = window.notesApi;

export function useBackup(setSaveState) {
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupRemoteUrl, setBackupRemoteUrl] = useState("");
  const [backupToken, setBackupToken] = useState("");

  const refreshBackupStatus = async () => {
    if (!api?.backupStatus) return;
    try {
      const status = await api.backupStatus();
      setBackupStatus(status);
    } catch {}
  };

  const doBackupCommit = async () => {
    if (!api?.backupCommit) return;
    setSaveState("Haciendo backup…");
    await api.backupCommit({ message: `Manual backup ${new Date().toLocaleString("es-MX")}` });
    await refreshBackupStatus();
    setSaveState("Backup guardado");
  };

  const doBackupPush = async () => {
    if (!api?.backupPush || !backupRemoteUrl || !backupToken) return;
    setSaveState("Subiendo a remoto…");
    try {
      await api.backupPush({ url: backupRemoteUrl, token: backupToken });
      await refreshBackupStatus();
      setSaveState("Push completado");
    } catch (err) {
      setSaveState(`Error: ${err.message}`);
    }
  };

  return {
    backupStatus,
    backupRemoteUrl,
    backupToken,
    setBackupRemoteUrl,
    setBackupToken,
    refreshBackupStatus,
    doBackupCommit,
    doBackupPush,
  };
}
