import React, { useState, useEffect, useRef } from "react";
import styles from "./AdvancedSearchFilter.module.css";
import { TriStateChip } from "../../../components/ui/TriStateChip/TriStateChip";
import { Input } from "../../../components/ui/Input/Input";
import type { TipoObra, StatusPublicacao, TriState, SortOption } from "../../../types/work.types";
import { TIPO_OBRA_LABELS, TODOS_FORMATOS } from "../../../types/work.types";
import { TagService } from "../../../services/tag.service";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import type { FilterState } from "./types";

export type { FilterState };

interface AdvancedSearchFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const ALL_TYPES: TipoObra[] = TODOS_FORMATOS;

const ALL_STATUSES: { value: StatusPublicacao; label: string }[] = [
  { value: "EM_LANCAMENTO", label: "Em Lançamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "EM_HIATO", label: "Em Hiato" },
  { value: "CANCELADO", label: "Cancelado" },
];

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
  "Terror",
  "Isekai",
  "Slice of Life",
];

const SUGGESTED_TAGS = [
  "Protagonista Forte",
  "Reencarnação",
  "Magia",
  "Cultivação",
  "Dungeon",
  "Sistema",
  "Vilão",
  "Romance Lento",
  "Superpoderes",
  "Monstros",
];

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const tagSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCount =
    filters.selectedTypes.length +
    filters.selectedStatuses.length +
    (filters.minChapters !== "" ? 1 : 0) +
    (filters.maxChapters !== "" ? 1 : 0) +
    (filters.minRating !== "" ? 1 : 0) +
    (filters.maxRating !== "" ? 1 : 0) +
    Object.values(filters.genresState).filter((s) => s !== 0).length +
    Object.values(filters.tagsState).filter((s) => s !== 0).length;

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

  const handleTagChange = (tag: string, nextState: TriState) => {
    const updated = { ...filters.tagsState, [tag]: nextState };
    if (nextState === 0) delete updated[tag];
    onChange({ ...filters, tagsState: updated });
  };

  const handleAddTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    handleTagChange(trimmed, 1);
    setTagInput("");
    setTagSuggestions([]);
  };

  useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([]);
      return;
    }
    if (tagSearchTimeoutRef.current) {
      clearTimeout(tagSearchTimeoutRef.current);
    }
    tagSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await TagService.searchTags(tagInput.trim());
        setTagSuggestions(results.map((t) => t.nome));
      } catch {
        setTagSuggestions([]);
      }
    }, 250);

    return () => {
      if (tagSearchTimeoutRef.current) clearTimeout(tagSearchTimeoutRef.current);
    };
  }, [tagInput]);

  return (
    <div className={styles.container}>
      <div className={styles.searchBarRow}>
        <div className={styles.searchInputWrapper}>
          <Input
            placeholder="Buscar por título, autor ou gênero..."
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
          <span>Series Finder</span>
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
                    {TIPO_OBRA_LABELS[type] || type}
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

          {/* Intervalos Numéricos: Capítulos e Avaliação */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Intervalos Numéricos</span>
              <span className={styles.helperText}>Capítulos lançados e nota média</span>
            </div>
            <div className={styles.rangeInputsRow}>
              <div className={styles.rangeInputGroup}>
                <span>Capítulos:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Mín"
                  className={styles.numberInput}
                  value={filters.minChapters}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      minChapters: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                />
                <span>até</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Máx"
                  className={styles.numberInput}
                  value={filters.maxChapters}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      maxChapters: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0),
                    })
                  }
                />
              </div>

              <div className={styles.rangeInputGroup}>
                <span>Nota:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="Mín (0-10)"
                  className={styles.numberInput}
                  value={filters.minRating}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      minRating: e.target.value === "" ? "" : Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)),
                    })
                  }
                />
                <span>até</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="Máx (0-10)"
                  className={styles.numberInput}
                  value={filters.maxRating}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      maxRating: e.target.value === "" ? "" : Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)),
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Gêneros com Lógica AND / OR e Tri-state */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className={styles.sectionLabel}>Gêneros</span>
                <div className={styles.modeToggleRow}>
                  <button
                    type="button"
                    className={`${styles.modeToggleBtn} ${filters.generosModo === "AND" ? styles.modeToggleBtnActive : ""}`}
                    onClick={() => onChange({ ...filters, generosModo: "AND" })}
                    title="Exigir TODOS os gêneros incluídos"
                  >
                    E (Todos)
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeToggleBtn} ${filters.generosModo === "OR" ? styles.modeToggleBtnActive : ""}`}
                    onClick={() => onChange({ ...filters, generosModo: "OR" })}
                    title="Aceitar QUALQUER UM dos gêneros incluídos"
                  >
                    OU (Qualquer)
                  </button>
                </div>
              </div>
              <span className={styles.helperText}>1x = Incluir (+), 2x = Excluir (-), 3x = Neutro</span>
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

          {/* Tags da Comunidade com Lógica AND / OR e Autocomplete */}
          <div className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className={styles.sectionLabel}>Tags da Comunidade</span>
                <div className={styles.modeToggleRow}>
                  <button
                    type="button"
                    className={`${styles.modeToggleBtn} ${filters.tagsModo === "AND" ? styles.modeToggleBtnActive : ""}`}
                    onClick={() => onChange({ ...filters, tagsModo: "AND" })}
                    title="Exigir TODAS as tags incluídas"
                  >
                    E (Todas)
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeToggleBtn} ${filters.tagsModo === "OR" ? styles.modeToggleBtnActive : ""}`}
                    onClick={() => onChange({ ...filters, tagsModo: "OR" })}
                    title="Aceitar QUALQUER UMA das tags incluídas"
                  >
                    OU (Qualquer)
                  </button>
                </div>
              </div>
              <span className={styles.helperText}>Filtre por tropos e tags comunitárias</span>
            </div>

            {/* Input para buscar e adicionar tags dinâmicas */}
            <div style={{ position: "relative", maxWidth: 360 }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Pesquisar tag da comunidade..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tagInput.trim()) handleAddTag(tagInput.trim());
                    }
                  }}
                  className={styles.numberInput}
                  style={{ width: "100%", padding: "0.45rem 0.75rem" }}
                />
                <button
                  type="button"
                  className={styles.typeBtn}
                  onClick={() => handleAddTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  <Plus size={14} />
                  <span>Adicionar</span>
                </button>
              </div>

              {tagSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md)",
                    marginTop: "0.25rem",
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {tagSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      style={{
                        width: "100%",
                        padding: "0.5rem 0.75rem",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-primary)",
                        fontSize: "var(--text-xs)",
                        cursor: "pointer",
                      }}
                      onMouseDown={() => handleAddTag(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chips de Tags Sugeridas + Tags já selecionadas */}
            <div className={styles.chipGroup} style={{ marginTop: "0.5rem" }}>
              {Array.from(
                new Set([...SUGGESTED_TAGS, ...Object.keys(filters.tagsState)])
              ).map((tag) => (
                <TriStateChip
                  key={tag}
                  label={tag}
                  state={filters.tagsState[tag] || 0}
                  onChange={(s: TriState) => handleTagChange(tag, s)}
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
              Tipo: {TIPO_OBRA_LABELS[t] || t}
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

          {filters.minChapters !== "" && (
            <span className={styles.activeTag}>
              Capítulos &gt;= {filters.minChapters}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => onChange({ ...filters, minChapters: "" })}
                title="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.maxChapters !== "" && (
            <span className={styles.activeTag}>
              Capítulos &lt;= {filters.maxChapters}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => onChange({ ...filters, maxChapters: "" })}
                title="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.minRating !== "" && (
            <span className={styles.activeTag}>
              Nota &gt;= {filters.minRating}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => onChange({ ...filters, minRating: "" })}
                title="Remover filtro"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {filters.maxRating !== "" && (
            <span className={styles.activeTag}>
              Nota &lt;= {filters.maxRating}
              <button
                type="button"
                className={styles.tagRemoveBtn}
                onClick={() => onChange({ ...filters, maxRating: "" })}
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
                  color: isInclude ? "#38BDF8" : "#FB7185",
                  borderColor: isInclude ? "rgba(56, 189, 248, 0.4)" : "rgba(251, 113, 133, 0.4)",
                }}
              >
                Tag: {isInclude ? "+" : "-"} {tag}
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
