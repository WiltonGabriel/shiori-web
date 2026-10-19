import React, { useState } from "react";
import styles from "./AdvancedSearchFilter.module.css";
import { TriStateChip } from "../../../components/ui/TriStateChip/TriStateChip";
import { Input } from "../../../components/ui/Input/Input";
import type { TipoObra, StatusPublicacao, TriState, SortOption } from "../../../types/work.types";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface FilterState {
  searchQuery: string;
  selectedTypes: TipoObra[];
  selectedStatuses: StatusPublicacao[];
  minChapters: number;
  genresState: Record<string, TriState>;
  sortBy: SortOption;
}

interface AdvancedSearchFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const ALL_TYPES: TipoObra[] = ["MANGA", "NOVEL", "MANHWA", "MANHUA", "COMIC", "LIVRO"];

const ALL_STATUSES: { value: StatusPublicacao; label: string }[] = [
  { value: "EM_LANCAMENTO", label: "Em Lançamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "EM_HIATO", label: "Em Hiato" },
  { value: "CANCELADO", label: "Cancelado" },
];

const CHAPTER_STEPS = [0, 20, 50, 100, 200, 500];

const COMMON_GENRES = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Romance",
  "Ficção Científica",
  "Sobrenatural",
  "Mistério",
  "Psicológico",
  "Vida Escolar",
  "Seinen",
  "Shounen",
  "Shoujo",
];

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeCount =
    filters.selectedTypes.length +
    filters.selectedStatuses.length +
    (filters.minChapters > 0 ? 1 : 0) +
    Object.values(filters.genresState).filter((s) => s !== 0).length;

  const handleTypeToggle = (type: TipoObra) => {
    const isSelected = filters.selectedTypes.includes(type);
    const updated = isSelected
      ? filters.selectedTypes.filter((t) => t !== type)
      : [...filters.selectedTypes, type];
    onChange({ ...filters, selectedTypes: updated });
  };

  const handleStatusToggle = (status: StatusPublicacao) => {
    const isSelected = filters.selectedStatuses.includes(status);
    const updated = isSelected
      ? filters.selectedStatuses.filter((s) => s !== status)
      : [...filters.selectedStatuses, status];
    onChange({ ...filters, selectedStatuses: updated });
  };

  const handleGenreChange = (genre: string, nextState: TriState) => {
    const updated = { ...filters.genresState, [genre]: nextState };
    if (nextState === 0) delete updated[genre];
    onChange({ ...filters, genresState: updated });
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchBarRow}>
        <div className={styles.searchInputWrapper}>
          <Input
            placeholder="Buscar por título em português, inglês ou original..."
            leadingIcon={<Search size={16} />}
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          />
        </div>

        <select
          className={styles.sortSelect}
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SortOption })}
          title="Ordenar resultados"
        >
          <option value="NOTA_DESC">Maior Avaliação</option>
          <option value="CAPITULOS_DESC">Mais Capítulos</option>
          <option value="TITULO_ASC">Título (A-Z)</option>
          <option value="RECENTES">Recentes</option>
        </select>

        <button
          type="button"
          className={`${styles.filterToggleBtn} ${isExpanded ? styles.filterToggleActive : ""}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SlidersHorizontal size={16} />
          <span>Filtros</span>
          {activeCount > 0 && <span className={styles.activeCountBadge}>{activeCount}</span>}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.panel}>
          {/* Formato Literário */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Formato Literário (Tipo)</span>
              <span className={styles.helperText}>Múltipla seleção</span>
            </div>
            <div className={styles.chipGroup}>
              {ALL_TYPES.map((type) => {
                const isSelected = filters.selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.typeBtn} ${isSelected ? styles.typeBtnActive : ""}`}
                    onClick={() => handleTypeToggle(type)}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status de Publicação */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Status de Publicação</span>
              <span className={styles.helperText}>Múltipla seleção</span>
            </div>
            <div className={styles.chipGroup}>
              {ALL_STATUSES.map((item) => {
                const isSelected = filters.selectedStatuses.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    className={`${styles.typeBtn} ${isSelected ? styles.typeBtnActive : ""}`}
                    onClick={() => handleStatusToggle(item.value)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mínimo de Capítulos */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Capítulos Lançados (Mínimo)</span>
              <span className={styles.helperText}>Extensão da leitura</span>
            </div>
            <div className={styles.chipGroup}>
              {CHAPTER_STEPS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.typeBtn} ${filters.minChapters === ch ? styles.typeBtnActive : ""}`}
                  onClick={() => onChange({ ...filters, minChapters: ch })}
                >
                  {ch === 0 ? "Todos" : `${ch}+ cap.`}
                </button>
              ))}
            </div>
          </div>

          {/* Gêneros Principais */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Gêneros Principais</span>
              <span className={styles.helperText}>Clique 1x para Incluir (+), 2x para Excluir (-)</span>
            </div>
            <div className={styles.chipGroup}>
              {COMMON_GENRES.map((genre) => (
                <TriStateChip
                  key={genre}
                  label={genre}
                  state={filters.genresState[genre] || 0}
                  onChange={(s: TriState) => handleGenreChange(genre, s)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros Ativos */}
      {activeCount > 0 && (
        <div className={styles.activeBar}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 600 }}>
            Ativos:
          </span>

          {filters.selectedTypes.map((t) => (
            <span key={t} className={styles.activeTag}>
              Tipo: {t}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => handleTypeToggle(t)}
                title="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {filters.selectedStatuses.map((s) => (
            <span key={s} className={styles.activeTag}>
              Status: {s}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => handleStatusToggle(s)}
                title="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {filters.minChapters > 0 && (
            <span className={styles.activeTag}>
              {filters.minChapters}+ Capítulos
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => onChange({ ...filters, minChapters: 0 })}
                title="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {Object.entries(filters.genresState).map(([genre, state]) => {
            if (state === 0) return null;
            const isInclude = state === 1;
            return (
              <span
                key={genre}
                className={styles.activeTag}
                style={{
                  color: isInclude ? "#34D399" : "#FDA4AF",
                  borderColor: isInclude ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
                }}
              >
                {isInclude ? "+" : "-"} {genre}
                <button
                  type="button"
                  className={styles.tagRemoveBtn}
                  onClick={() => handleGenreChange(genre, 0)}
                  title="Remover filtro"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}

          <button type="button" className={styles.clearAllBtn} onClick={onReset}>
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  );
};
