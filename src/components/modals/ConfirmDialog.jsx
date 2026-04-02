import { useRef } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { AlertTriangle } from "lucide-react";

/**
 * Reusable confirmation dialog that replaces window.confirm().
 *
 * @param {Object} props
 * @param {boolean} props.open - whether the dialog is visible
 * @param {string} props.title - dialog heading
 * @param {string} props.message - body text
 * @param {string} [props.confirmLabel="Confirmar"] - confirm button text
 * @param {string} [props.cancelLabel="Cancelar"] - cancel button text
 * @param {"danger"|"default"} [props.variant="default"] - visual style
 * @param {() => void} props.onConfirm - called when user confirms
 * @param {() => void} props.onCancel - called when user cancels
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  if (!open) return null;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="connectors-overlay" onClick={onCancel} onKeyDown={handleKeyDown}>
      <div
        className={`confirm-dialog ${variant === "danger" ? "confirm-danger" : ""}`}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {variant === "danger" && (
          <div className="confirm-icon">
            <AlertTriangle size={24} />
          </div>
        )}
        <h3 id="confirm-title">{title}</h3>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="rename-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`rename-confirm ${variant === "danger" ? "confirm-btn-danger" : ""}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
