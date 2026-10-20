import React from "react";
import { Link } from "react-router-dom";
import styles from "../ShelfPage.module.css";
import { HorizontalScroller } from "../../../components/ui/HorizontalScroller/HorizontalScroller";
import { Button } from "../../../components/ui/Button/Button";
import { Download, Upload, Compass, LayoutGrid, List, Plus } from "lucide-react";
import { STATUS_TABS, type FilterTab } from "../hooks/useShelf";

interface ShelfHeaderProps {
  activeTab: FilterTab;
  setActiveTab: (tab: FilterTab) => void;
  tabCounts: Record<FilterTab, number>;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddManual?: () => void;
}

export const ShelfHeader: React.FC<ShelfHeaderProps> = ({
  activeTab,
  setActiveTab,
  tabCounts,
  viewMode,
  setViewMode,
  onExport,
  onImport,
  onAddManual,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={styles.header}>
      <div className={styles.titleArea}>
        <div>
          <h1 className={styles.title}>Meu Catálogo</h1>
          <p className={styles.subtitle}>
            Sua estante pessoal e diário de leitura. Acompanhe seu ritmo capítulo a capítulo, registre anotações e conclua ciclos.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {onAddManual && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddManual}
              title="Cadastrar obra manualmente na sua estante pessoal"
            >
              <Plus size={14} />
              <span>Adicionar Obra</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            title="Exportar estante pessoal completa com notas e links privados (.json)"
          >
            <Download size={14} />
            <span>Exportar (.json)</span>
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={onImport}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Restaurar estante pessoal a partir de um backup .json"
          >
            <Upload size={14} />
            <span>Importar (.json)</span>
          </Button>

          <Link to="/catalogo">
            <Button variant="secondary" size="sm">
              <Compass size={16} />
              <span>Explorar Catálogo Global</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Controles: Abas de Estado e Alternador Visual */}
      <div className={styles.controlsRow}>
        <div className={styles.tabsContainer}>
          <HorizontalScroller step={220} ariaLabel="Abas de filtro da estante" showFade>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.value)}
                role="tab"
                aria-selected={activeTab === tab.value}
              >
                <span>{tab.label}</span>
                <span className={styles.tabCount}>{tabCounts[tab.value]}</span>
              </button>
            ))}
          </HorizontalScroller>
        </div>

        <div className={styles.viewToggle} role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === "grid" ? styles.toggleBtnActive : ""}`}
            onClick={() => setViewMode("grid")}
            title="Visão em Grade"
            aria-label="Visão em Grade"
          >
            <LayoutGrid size={15} />
            <span>Grade</span>
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${viewMode === "list" ? styles.toggleBtnActive : ""}`}
            onClick={() => setViewMode("list")}
            title="Visão em Lista"
            aria-label="Visão em Lista"
          >
            <List size={15} />
            <span>Lista</span>
          </button>
        </div>
      </div>
    </div>
  );
};
