import React from "react";
import styles from "./BroadcastBanner.module.css";
import { useBroadcastStore } from "../../../store/broadcastStore";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export const BroadcastBanner: React.FC = () => {
  const { broadcasts, dismissedIds, dismissBroadcast } = useBroadcastStore();

  const active = broadcasts.find((b) => !dismissedIds.includes(b.id));
  if (!active) return null;

  const styleClass =
    active.nivel === "URGENTE"
      ? styles.urgente
      : active.nivel === "AVISO"
      ? styles.aviso
      : styles.info;

  const IconComponent =
    active.nivel === "URGENTE"
      ? AlertCircle
      : active.nivel === "AVISO"
      ? AlertTriangle
      : Info;

  return (
    <aside className={`${styles.banner} ${styleClass}`} role="alert">
      <div className={styles.content}>
        <IconComponent size={16} />
        <span>
          <strong>{active.titulo}:</strong> {active.mensagem}
        </span>
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => dismissBroadcast(active.id)}
        aria-label="Dispensar aviso"
      >
        <X size={14} />
      </button>
    </aside>
  );
};
