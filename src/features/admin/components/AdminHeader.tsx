import React from "react";
import { Link } from "react-router-dom";
import styles from "./AdminHeader.module.css";
import { HorizontalScroller } from "../../../components/ui/HorizontalScroller/HorizontalScroller";
import { Button } from "../../../components/ui/Button/Button";
import {
  Layers,
  FileQuestion,
  AlertOctagon,
  Users,
  Tags,
  Server,
  ToggleLeft,
  Megaphone,
  History,
  GitMerge,
  RotateCcw,
  Compass,
  ShieldAlert,
} from "lucide-react";

export type AdminTab =
  | "DASHBOARD"
  | "SUGESTOES"
  | "DENUNCIAS"
  | "USUARIOS"
  | "GENEROS"
  | "INTEGRACOES"
  | "FLAGS"
  | "BROADCASTS"
  | "AUDITORIA"
  | "MESCLAR";

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  counts: {
    sugestoes: number;
    denuncias: number;
    broadcasts: number;
    integracoes: number;
    flags: number;
  };
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  setActiveTab,
  counts,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className={styles.headerWrapper}>
      {/* Barra de Comando Superior */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <div className={styles.badgeRow}>
            <span className={styles.sysBadge}>GOVERNANÇA DA INSTÂNCIA // SHIORI</span>
            <span className={styles.roleBadge}>ROLE_ADMIN</span>
          </div>
          <h1 className={styles.title}>
            <ShieldAlert size={26} style={{ color: "var(--accent-rose)" }} />
            <span>Painel de Administração</span>
          </h1>
          <p className={styles.subtitle}>
            Supervisão geral, governança de integrações, moderação de membros, curadoria de vocabulário, comunicados de sistema e auditoria.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to="/minha-estante">
            <Button variant="secondary" size="sm" title="Retornar à estante pessoal">
              <Compass size={14} />
              <span>Voltar à Minha Estante</span>
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            isLoading={isRefreshing}
            title="Sincronizar métricas e filas com o servidor"
          >
            <RotateCcw size={14} />
            <span>Atualizar Painel</span>
          </Button>
        </div>
      </div>

      {/* Navegação das 9 Abas de Governança com Rolagem Horizontal Suave */}
      <div className={styles.tabsContainer}>
        <HorizontalScroller
          step={220}
          showArrows={true}
          showFade={true}
          ariaLabel="Navegação das abas do painel administrativo"
          className={styles.adminTabsScroller}
          contentClassName={styles.adminTabs}
        >
          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "DASHBOARD" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("DASHBOARD")}
          >
            <Layers size={14} />
            <span>Métricas Gerais</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "SUGESTOES" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("SUGESTOES")}
          >
            <FileQuestion size={14} />
            <span>Sugestões</span>
            {counts.sugestoes > 0 && <span className={styles.badgeCount}>{counts.sugestoes}</span>}
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "DENUNCIAS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("DENUNCIAS")}
          >
            <AlertOctagon size={14} />
            <span>Denúncias</span>
            {counts.denuncias > 0 && <span className={styles.badgeCountAlert}>{counts.denuncias}</span>}
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "USUARIOS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("USUARIOS")}
          >
            <Users size={14} />
            <span>Usuários & Strikes</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "GENEROS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("GENEROS")}
          >
            <Tags size={14} />
            <span>Gêneros Oficiais</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "INTEGRACOES" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("INTEGRACOES")}
          >
            <Server size={14} />
            <span>Integrações ({counts.integracoes})</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "FLAGS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("FLAGS")}
          >
            <ToggleLeft size={14} />
            <span>Feature Flags ({counts.flags})</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "BROADCASTS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("BROADCASTS")}
          >
            <Megaphone size={14} />
            <span>Comunicados</span>
            {counts.broadcasts > 0 && <span className={styles.badgeCount}>{counts.broadcasts}</span>}
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "AUDITORIA" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("AUDITORIA")}
          >
            <History size={14} />
            <span>Log de Auditoria</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "MESCLAR" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("MESCLAR")}
          >
            <GitMerge size={14} />
            <span>Mesclar Obras</span>
          </button>
        </HorizontalScroller>
      </div>
    </header>
  );
};
