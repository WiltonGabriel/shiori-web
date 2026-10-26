import React from "react";
import styles from "./ToastContainer.module.css";
import { useToastStore, type ToastItem } from "../../../store/toastStore";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="region" aria-label="Notificações e Avisos">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return <AlertCircle size={20} />;
      case "success":
        return <CheckCircle2 size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "info":
        return <Info size={20} />;
    }
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert">
      <div className={styles.iconWrapper}>{getIcon()}</div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.title}>{toast.title}</span>
          {typeof toast.status === "number" && toast.status >= 100 && toast.status <= 599 && (
            <span className={styles.statusBadge}>HTTP {toast.status}</span>
          )}
        </div>

        {toast.detail && <div className={styles.detail}>{toast.detail}</div>}

        {toast.validationErrors && Object.keys(toast.validationErrors).length > 0 && (
          <ul className={styles.validationList}>
            {Object.entries(toast.validationErrors).map(([field, msg]) => (
              <li key={field} className={styles.validationItem}>
                <strong>{field}:</strong> {msg}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={styles.closeBtn}
        onClick={onDismiss}
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>

      {toast.durationMs > 0 && (
        <div
          className={styles.progressBar}
          style={{
            animationDuration: `${toast.durationMs}ms`,
            color:
              toast.type === "error"
                ? "var(--accent-rose)"
                : toast.type === "success"
                ? "var(--accent-emerald)"
                : toast.type === "warning"
                ? "var(--accent-amber)"
                : "var(--brand-primary)",
          }}
        />
      )}
    </div>
  );
};
