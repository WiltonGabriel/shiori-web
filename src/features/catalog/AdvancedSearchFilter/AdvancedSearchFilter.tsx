import React, { useState } from "react";
import styles from "./AdvancedSearchFilter.module.css";
import { Input } from "../../../components/ui/Input/Input";
import { TriStateChip } from "../../../components/ui/TriStateChip/TriStateChip";
import {
  type SearchFiltersState,
  type TriState,
  type SortOption,
  COMMON_GENRES,
  COMMON_TAGS,
} from "../../../types/filter.types";
import type { TipoObra } from "../../../types/work.types";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface AdvancedSearchFilterProps {
  filters: SearchFiltersState;
  onChange: (nextFilters: SearchFiltersState) => void;
  onReset: () => void;
}

const ALL_TYPES: TipoObra[] = ["MANGA", "NOVEL", "MANHWA", "MANHUA", "COMIC", "LIVRO"];
const CHAPTER_STEPS = [0, 10, 50, 100, 300, 500];

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calcula total de filtros ativos além da busca
  const activeCount =
    filters.selectedTypes.length +
    Object.values(filters.genresState).filter((s) => s !== 0).length +
    Object.values(filters.tagsState).filter((s) => s !== 0).length +
    (filters.minChapters > 0 ? 1 : 0);

  const handleTypeToggle = (type: TipoObra) => {
    const exists = filters.selectedTypes.includes(type);
    const nextTypes = exists
      ? filters.selectedTypes.filter((t) => t !== type)
      : [...filters.selectedTypes, type];
    onChange({ ...filters, selectedTypes: nextTypes });
  };

  const handleGenreChange = (genre: string, nextState: TriState) => {
    const updated = { ...filters.genresState, [genre]: nextState };
    if (nextState === 0) delete updated[genre];
    onChange({ ...filters, genresState: updated });
  };

  const handleTagChange = (tag: string, nextState: TriState) => {
    const updated = { ...filters.tagsState, [tag]: nextState };
    if (nextState === 0) delete updated[tag];
    onChange({ ...filters, tagsState: updated });
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
        </select>

        <button
          type="button"
          className={`${styles.filterToggleBtn} ${isExpanded ? styles.filterToggleActive : ""}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SlidersHorizontal size={16} />
          <span>Filtros Avançados</span>
          {activeCount > 0 && <span className={styles.activeCountBadge}>{activeCount}</span>}
        </button>
      </div>

      {/* Painel Avançado NovelUpdates */}
      {isExpanded && (
        <div className={styles.panel}>
          {/* Formato / Tipo */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Formato Literário</span>
              <span className={styles.helperText}>Selecione um ou mais formatos</span>
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

          {/* Mínimo de Capítulos */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Capítulos Lançados (Mínimo)</span>
              <span className={styles.helperText}>Filtre obras por extensão da leitura</span>
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

          {/* Gêneros (Tri-State: Neutro, +Incluir, -Excluir) */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Gêneros (Estilo NovelUpdates)</span>
              <span className={styles.helperText}>Clique 1x para Incluir (+), 2x para Excluir (-)</span>
            </div>
            <div className={styles.chipGroup}>
              {COMMON_GENRES.map((genre) => (
                <TriStateChip
                  key={genre}
                  label={genre}
                  state={filters.genresState[genre] || 0}
                  onChange={(s) => handleGenreChange(genre, s)}
                />
              ))}
            </div>
          </div>

          {/* Tags Temáticas */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Tags Temáticas</span>
              <span className={styles.helperText}>Elementos de enredo e arquétipos</span>
            </div>
            <div className={styles.chipGroup}>
              {COMMON_TAGS.map((tag) => (
                <TriStateChip
                  key={tag}
                  label={tag}
                  state={filters.tagsState[tag] || 0}
                  onChange={(s) => handleTagChange(tag, s)}
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

          {Object.entries(filters.tagsState).map(([tag, state]) => {
            if (state === 0) return null;
            const isInclude = state === 1;
            return (
              <span
                key={tag}
                className={styles.activeTag}
                style={{
                  color: isInclude ? "#34D399" : "#FDA4AF",
                  borderColor: isInclude ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
                }}
              >
                {isInclude ? "+" : "-"} {tag}
                <button
                  type="button"
                  className={styles.tagRemoveBtn}
                  onClick={() => handleTagChange(tag, 0)}
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
