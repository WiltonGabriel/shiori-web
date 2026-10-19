import React from "react";
import styles from "../ShelfPage.module.css";
import { Badge } from "../../../components/ui/Badge/Badge";
import type { StatusLeitura, Visibilidade } from "../../../types/catalog.types";
import { Eye, Shield, Lock, Bell } from "lucide-react";

export const StatusBadge: React.FC<{ status: StatusLeitura }> = ({ status }) => {
  switch (status) {
    case "LENDO":
      return <Badge variant="brand">Lendo</Badge>;
    case "TERMINOU":
      return <Badge variant="success">Terminou</Badge>;
    case "ENGAVETADO":
      return <Badge variant="warning">Engavetado</Badge>;
    case "PLANEJADO":
      return <Badge variant="neutral">Planejado</Badge>;
    case "DROPOU":
    case "ABDICOU":
      return <Badge variant="neutral">Abdicou</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const VisibilityBadge: React.FC<{ visibility: Visibilidade }> = ({ visibility }) => {
  switch (visibility) {
    case "PUBLICO":
      return (
        <span className={styles.visibilityBadge} title="Leitura visível publicamente no seu perfil">
          <Eye size={11} style={{ color: "var(--brand-light)" }} />
          <span>Público</span>
        </span>
      );
    case "PRIVADO":
      return (
        <span className={styles.visibilityBadge} title="Leitura estritamente privada">
          <Lock size={11} style={{ color: "var(--accent-rose)" }} />
          <span>Privado</span>
        </span>
      );
    case "RESTRITO":
    default:
      return (
        <span className={styles.visibilityBadge} title="Visível apenas para você e conexões mútuas">
          <Shield size={11} style={{ color: "#34D399" }} />
          <span>Restrito</span>
        </span>
      );
  }
};

export const UnlinkedBadge: React.FC = () => (
  <span className={styles.unlinkedBadge} title="Obra autônoma e desacoplada do Catálogo Global">
    <Shield size={10} />
    <span>Local</span>
  </span>
);

export const NewChaptersNotificationBadge: React.FC<{
  onUpdateMeta: () => void;
}> = ({ onUpdateMeta }) => (
  <button
    type="button"
    className={styles.newChaptersBadge}
    onClick={onUpdateMeta}
    title="O Catálogo Global possui novos capítulos lançados! Clique para atualizar a meta máxima da sua estante."
  >
    <Bell size={12} />
    <span>Novos capítulos no Hub! Atualizar</span>
  </button>
);
