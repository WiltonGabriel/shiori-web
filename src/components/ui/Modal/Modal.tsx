import React, { useEffect } from "react";
import styles from "./Modal.module.css";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closable = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closable) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose, closable]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (closable && e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {closable && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          )}
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};
