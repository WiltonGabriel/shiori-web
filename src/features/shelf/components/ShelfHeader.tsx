import React from "react";
import { Link } from "react-router-dom";
import styles from "../ShelfPage.module.css";
import { HorizontalScroller } from "../../../components/ui/HorizontalScroller/HorizontalScroller";
import { Button } from "../../../components/ui/Button/Button";
import {
  Download,
  Upload,
  Compass,
  LayoutGrid,
  List,
  Plus,
  Search,
  Calendar,
  Tag,
  ArrowUpDown,
  Filter,
  X,
} from "lucide-react";
import {
  STATUS_TABS,
  type FilterTab,
  type ReadingDateFilter,
  type ShelfSortOption,
} from "../hooks/useShelf";
import { TODOS_FORMATOS, TIPO_OBRA_LABELS } from "../../../types/work.types";

interface ShelfHeaderProps {
  activeTab: FilterTab;
  setActiveTab: (tab: FilterTab) => void;
  tabCounts: Record<FilterTab, number>;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPortabilityModal?: (initialTab: "EXPORT" | "IMPORT") => void;
  onAddManual?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (c: string) => void;
  selectedGenreOrTag?: string;
  onGenreOrTagChange?: (g: string) => void;
  dateFilter?: ReadingDateFilter;
  onDateFilterChange?: (d: ReadingDateFilter) => void;
  specificDate?: string;
  onSpecificDateChange?: (d: string) => void;
  sortBy?: ShelfSortOption;
  onSortByChange?: (s: ShelfSortOption) => void;
  availableGenresAndTags?: string[];
}

export const ShelfHeader: React.FC<ShelfHeaderProps> = ({
  activeTab,
  setActiveTab,
  tabCounts,
  viewMode,
  setViewMode,
  onExport,
  onImport,
  onOpenPortabilityModal,
  onAddManual,
  searchQuery = "",
  onSearchQueryChange,
  selectedCategory = "ALL",
  onCategoryChange,
  selectedGenreOrTag = "ALL",
  onGenreOrTagChange,
  dateFilter = "ALL",
  onDateFilterChange,
  specificDate = "",
  onSpecificDateChange,
  sortBy = "LAST_READ",
  onSortByChange,
  availableGenresAndTags = [],
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== "ALL" ||
    selectedGenreOrTag !== "ALL" ||
    dateFilter !== "ALL";

  const handleClearFilters = () => {
    onSearchQueryChange?.("");
    onCategoryChange?.("ALL");
    onGenreOrTagChange?.("ALL");
    onDateFilterChange?.("ALL");
    onSpecificDateChange?.("");
  };

  return (
    <div className={styles.header}>
      <div className={styles.titleArea}>
        <div>
          <h1 className={styles.title}>Minha Estante</h1>
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
            onClick={() =>
              onOpenPortabilityModal ? onOpenPortabilityModal("EXPORT") : onExport()
            }
            title="Abrir pop-up para exportar estante em série ou uma obra individual (.json)"
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
            onClick={() =>
              onOpenPortabilityModal
                ? onOpenPortabilityModal("IMPORT")
                : fileInputRef.current?.click()
            }
            title="Abrir pop-up para importar 1 ou múltiplos backups .json"
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

      {/* Barra Completa de Busca, Filtros (Categoria, Gênero/Tag, Data Lida) e Ordenação */}
      {onSearchQueryChange && (
        <div className={styles.filterBar}>
          <div className={`${styles.filterField} ${styles.filterSearch}`}>
            <Search size={15} className={styles.filterIcon} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Buscar por título, tag ou onde parou..."
              aria-label="Buscar na minha estante"
              className={`${styles.filterControl} ${styles.filterControlWithIcon}`}
            />
          </div>

          <div className={styles.filterField}>
            <Filter size={14} className={styles.filterIcon} aria-hidden="true" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange?.(e.target.value)}
              aria-label="Filtrar por categoria"
              className={`${styles.filterControl} ${styles.filterControlWithIcon}`}
            >
              <option value="ALL">Todas as Categorias</option>
              {TODOS_FORMATOS.map((f) => (
                <option key={f} value={f}>
                  {TIPO_OBRA_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <Tag size={14} className={styles.filterIcon} aria-hidden="true" />
            <select
              value={selectedGenreOrTag}
              onChange={(e) => onGenreOrTagChange?.(e.target.value)}
              aria-label="Filtrar por gênero ou tag"
              className={`${styles.filterControl} ${styles.filterControlWithIcon}`}
            >
              <option value="ALL">Todos os Gêneros &amp; Tags</option>
              {availableGenresAndTags.map((gt) => (
                <option key={gt} value={gt}>
                  {gt}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <Calendar size={14} className={styles.filterIcon} aria-hidden="true" />
            <select
              value={dateFilter}
              onChange={(e) => onDateFilterChange?.(e.target.value as ReadingDateFilter)}
              aria-label="Filtrar por data de leitura"
              className={`${styles.filterControl} ${styles.filterControlWithIcon}`}
            >
              <option value="ALL">Qualquer Data Lida</option>
              <option value="TODAY">Lido Hoje</option>
              <option value="LAST_7_DAYS">Últimos 7 Dias</option>
              <option value="THIS_MONTH">Lido Este Mês</option>
              <option value="THIS_YEAR">Lido Este Ano</option>
              <option value="SPECIFIC_DATE">Data Específica...</option>
            </select>
          </div>

          <div className={styles.filterField}>
            <ArrowUpDown size={14} className={styles.filterIcon} aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange?.(e.target.value as ShelfSortOption)}
              aria-label="Ordenar estante"
              className={`${styles.filterControl} ${styles.filterControlWithIcon}`}
            >
              <option value="LAST_READ">Ordenar: Última Leitura</option>
              <option value="RATING_DESC">Ordenar: Maior Nota</option>
              <option value="PROGRESS_DESC">Ordenar: Maior Progresso</option>
              <option value="TITLE_ASC">Ordenar: Nome (A-Z)</option>
            </select>
          </div>

          {dateFilter === "SPECIFIC_DATE" && (
            <div className={`${styles.filterField} ${styles.filterDateRow}`}>
              <label htmlFor="shelf-specific-date" className={styles.filterDateLabel}>
                Data exata da leitura:
              </label>
              <input
                id="shelf-specific-date"
                type="date"
                value={specificDate}
                onChange={(e) => onSpecificDateChange?.(e.target.value)}
                className={styles.filterControl}
              />
            </div>
          )}

          {hasActiveFilters && (
            <div className={styles.filterClearRow}>
              <button type="button" onClick={handleClearFilters} className={styles.filterClearBtn}>
                <X size={13} /> Limpar filtros ativos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
