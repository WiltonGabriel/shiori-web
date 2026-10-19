import React from "react";
import styles from "../ShelfPage.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { AlertTriangle, ExternalLink } from "lucide-react";

interface ShelfSafetyModalProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShelfSafetyModal: React.FC<ShelfSafetyModalProps> = ({
  url,
  isOpen,
  onClose,
}) => {
  if (!url) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aviso de Segurança: Link Externo"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--accent-amber)" }}>
          <AlertTriangle size={24} />
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
            Você está saindo do ecossistema do Shiori
          </span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          O Shiori não hospeda, escaneia ou armazena conteúdo pirata ou arquivos de mídia. Você será redirecionado para o link pessoal que cadastrou na sua estante:
        </p>

        <div className={styles.safetyUrlBox}>{url}</div>

        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.5 }}>
          Por precaução, utilize extensões de bloqueio de anúncios e verifique a confiabilidade do domínio de destino.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" onClick={onClose}>
            Voltar à Estante
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            style={{ textDecoration: "none" }}
          >
            <Button variant="primary">
              <ExternalLink size={14} />
              <span>Prosseguir com Segurança</span>
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};
