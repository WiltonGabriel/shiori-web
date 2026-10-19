import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./DeepSearchPage.module.css";
import { WorkService } from "../../../services/work.service";
import { CatalogService } from "../../../services/catalog.service";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "../../../store/toastStore";
import { TriStateChip } from "../../../components/ui/TriStateChip/TriStateChip";
import { Card } from "../../../components/ui/Card/Card";
import { Badge } from "../../../components/ui/Badge/Badge";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Spinner } from "../../../components/ui/Spinner/Spinner";
import type { ObraResponse, TipoObra, StatusPublicacao, TriState, LogicalOperator } from "../../../types/work.types";
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  Star,
  Plus,
  Check,
  ArrowLeft,
  X,
  BookOpen,
} from "lucide-react";

const ALL_FORMATS: { label: string; value: TipoObra }[] = [
  { label: "Light Novel", value: "NOVEL" },
  { label: "Web Novel", value: "NOVEL" },
  { label: "Romance Publicado", value: "NOVEL" },
  { label: "Mangá", value: "MANGA" },
  { label: "Manhwa", value: "MANHWA" },
  { label: "Manhua", value: "MANHUA" },
  { label: "Quadrinho (Comic)", value: "COMIC" },
  { label: "Livro", value: "LIVRO" },
];

const ALL_LANGUAGES = [
  "Japonês",
  "Coreano",
  "Chinês",
  "Inglês",
  "Português",
  "Tailandês",
  "Vietnamita",
  "Filipino",
  "Indonésio",
  "Khmer",
  "Malaio",
];

const ALL_STATUSES: { label: string; value: StatusPublicacao }[] = [
  { label: "Em Lançamento", value: "EM_LANCAMENTO" },
  { label: "Concluído", value: "CONCLUIDO" },
  { label: "Em Hiato", value: "EM_HIATO" },
  { label: "Cancelado", value: "CANCELADO" },
];

const FULL_GENRES = [
  "Ação",
  "Adulto",
  "Aventura",
  "Comédia",
  "Drama",
  "Ecchi",
  "Fantasia",
  "Troca de Gênero",
  "Harém",
  "Histórico",
  "Horror",
  "Josei",
  "Artes Marciais",
  "Maduro",
  "Mecha",
  "Mistério",
  "Psicológico",
  "Romance",
  "Vida Escolar",
  "Ficção Científica",
  "Seinen",
  "Shoujo",
  "Shoujo Ai",
  "Shounen",
  "Shounen Ai",
  "Um Recorte da Vida",
  "Erótico",
  "Esportes",
  "Sobrenatural",
  "Tragédia",
  "Wuxia",
  "Xianxia",
  "Xuanhuan",
  "Yaoi",
  "Yuri",
];

const POPULAR_TAGS = [
  "Reencarnação",
  "Sistema",
  "Protagonista Forte",
  "Viagem no Tempo",
  "Isekai",
  "Magia",
  "Vingança",
  "Nobreza",
  "Política",
  "Monstros",
  "Romance Lento",
  "Realidade Virtual",
  "Apocalipse",
  "Transmigração",
  "Dungeon",
  "Cultivo",
  "Protagonista Feminina",
  "Máfia",
];

export const DeepSearchPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<TipoObra[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusPublicacao[]>([]);
  const [minChapters, setMinChapters] = useState<string>("");
  const [maxChapters, setMaxChapters] = useState<string>("");
  const [minRating, setMinRating] = useState<number>(0);

  // Gêneros com Tri-State e Operador E/OU
  const [genreOperator, setGenreOperator] = useState<LogicalOperator>("AND");
  const [genresState, setGenresState] = useState<Record<string, TriState>>({});

  // Tags com Tri-State e Operador E/OU
  const [tagOperator, setTagOperator] = useState<LogicalOperator>("OR");
  const [tagsState, setTagsState] = useState<Record<string, TriState>>({});
  const [tagFilterInput, setTagFilterInput] = useState("");

  // Ordenação
  const [sortBy, setSortBy] = useState<"NOTA_DESC" | "CAPITULOS_DESC" | "TITULO_ASC" | "TITULO_DESC" | "RECENTES">("NOTA_DESC");

  // Modal de Estante
  const [selectedWork, setSelectedWork] = useState<ObraResponse | null>(null);
  const [readingUrl, setReadingUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchWorks = async () => {
      try {
        const data = await WorkService.listWorks();
        if (isMounted) setWorks(data);
      } catch (err) {
        console.error("Falha ao buscar catálogo:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchWorks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenreToggle = (genre: string, nextState: TriState) => {
    setGenresState((prev) => {
      const next = { ...prev, [genre]: nextState };
      if (nextState === 0) delete next[genre];
      return next;
    });
  };

  const handleTagToggle = (tag: string, nextState: TriState) => {
    setTagsState((prev) => {
      const next = { ...prev, [tag]: nextState };
      if (nextState === 0) delete next[tag];
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedFormats([]);
    setSelectedLanguages([]);
    setSelectedStatuses([]);
    setMinChapters("");
    setMaxChapters("");
    setMinRating(0);
    setGenreOperator("AND");
    setGenresState({});
    setTagOperator("OR");
    setTagsState({});
    setTagFilterInput("");
    setSortBy("NOTA_DESC");
  };

  // Filtragem Computada com Alta Performance
  const filteredWorks = useMemo(() => {
    const includedGenres = Object.entries(genresState)
      .filter(([_, s]) => s === 1)
      .map(([g]) => g.toLowerCase());
    const excludedGenres = Object.entries(genresState)
      .filter(([_, s]) => s === -1)
      .map(([g]) => g.toLowerCase());

    const includedTags = Object.entries(tagsState)
      .filter(([_, s]) => s === 1)
      .map(([t]) => t.toLowerCase());
    const excludedTags = Object.entries(tagsState)
      .filter(([_, s]) => s === -1)
      .map(([t]) => t.toLowerCase());

    const minCh = parseInt(minChapters, 10);
    const maxCh = parseInt(maxChapters, 10);

    const result = works.filter((w) => {
      // 1. Termo de Busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const mainTitle = w.tituloPrincipal.toLowerCase();
        const origTitle = (w.tituloOriginal || "").toLowerCase();
        if (!mainTitle.includes(query) && !origTitle.includes(query)) return false;
      }

      // 2. Formato / Tipo de Obra
      if (selectedFormats.length > 0 && !selectedFormats.includes(w.tipoObra)) {
        return false;
      }

      // 3. Status de Publicação
      if (selectedStatuses.length > 0 && w.statusPublicacao) {
        if (!selectedStatuses.includes(w.statusPublicacao)) return false;
      }

      // 4. Capítulos Mínimo / Máximo
      const totalCap = w.totalCapitulosLancados || 0;
      if (!isNaN(minCh) && minCh > 0 && totalCap < minCh) return false;
      if (!isNaN(maxCh) && maxCh > 0 && totalCap > maxCh) return false;

      // 5. Avaliação Mínima
      if (minRating > 0 && (w.notaGeral || 0) < minRating) return false;

      // 6. Gêneros com Lógica Tri-State e Operador [E / OU]
      const workGenres = (w.generos || []).map((g) => g.toLowerCase());

      // Exclusão estrita (se tiver qualquer gênero excluído, descarta)
      if (excludedGenres.length > 0) {
        const hasExcluded = excludedGenres.some((g) => workGenres.includes(g));
        if (hasExcluded) return false;
      }

      // Inclusão com operador E ou OU
      if (includedGenres.length > 0) {
        if (genreOperator === "AND") {
          const hasAll = includedGenres.every((g) => workGenres.includes(g));
          if (!hasAll) return false;
        } else {
          const hasAny = includedGenres.some((g) => workGenres.includes(g));
          if (!hasAny) return false;
        }
      }

      // 7. Tags com Lógica Tri-State e Operador [E / OU]
      const workTags = (w.tags || []).map((t) => t.toLowerCase());

      if (excludedTags.length > 0) {
        const hasExcludedTag = excludedTags.some((t) => workTags.includes(t));
        if (hasExcludedTag) return false;
      }

      if (includedTags.length > 0) {
        if (tagOperator === "AND") {
          const hasAllTags = includedTags.every((t) => workTags.includes(t));
          if (!hasAllTags) return false;
        } else {
          const hasAnyTag = includedTags.some((t) => workTags.includes(t));
          if (!hasAnyTag) return false;
        }
      }

      return true;
    });

    // Ordenação
    return result.sort((a, b) => {
      if (sortBy === "NOTA_DESC") return (b.notaGeral || 0) - (a.notaGeral || 0);
      if (sortBy === "CAPITULOS_DESC") return (b.totalCapitulosLancados || 0) - (a.totalCapitulosLancados || 0);
      if (sortBy === "TITULO_ASC") return a.tituloPrincipal.localeCompare(b.tituloPrincipal);
      if (sortBy === "TITULO_DESC") return b.tituloPrincipal.localeCompare(a.tituloPrincipal);
      return b.id - a.id;
    });
  }, [
    works,
    searchQuery,
    selectedFormats,
    selectedStatuses,
    minChapters,
    maxChapters,
    minRating,
    genreOperator,
    genresState,
    tagOperator,
    tagsState,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    count += selectedFormats.length;
    count += selectedLanguages.length;
    count += selectedStatuses.length;
    if (minChapters) count++;
    if (maxChapters) count++;
    if (minRating > 0) count++;
    count += Object.keys(genresState).length;
    count += Object.keys(tagsState).length;
    return count;
  }, [
    searchQuery,
    selectedFormats,
    selectedLanguages,
    selectedStatuses,
    minChapters,
    maxChapters,
    minRating,
    genresState,
    tagsState,
  ]);

  const handleAddToShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWork) return;

    setIsAdding(true);
    try {
      await CatalogService.addItemToShelf({
        obraId: selectedWork.id,
        statusLeitura: "LENDO",
        visibilidade: "RESTRITO",
        urlLeitura: readingUrl.trim() || undefined,
      });
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setSelectedWork(null);
        setReadingUrl("");
      }, 1200);
    } catch (err: any) {
      toast.error(err, "Falha ao Adicionar Obra");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link
          to="/explorar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--brand-primary)",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          <ArrowLeft size={16} />
          <span>Voltar ao Catálogo Rápido</span>
        </Link>
        <div className={styles.titleRow}>
          <SlidersHorizontal size={28} color="var(--brand-primary)" />
          <h1 className={styles.title}>Busca Profunda no Catálogo</h1>
        </div>
        <p className={styles.subtitle}>
          Filtros cirúrgicos de inclusão (+) e exclusão (-), operadores lógicos [E / OU], faixas numéricas de capítulos e notas para encontrar a sua próxima leitura perfeita.
        </p>
      </div>

      {/* Painel Central de Filtros */}
      <div className={styles.filterPanel}>
        {/* Termo de Busca */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>
              <Search size={16} />
              <span>Termo ou Título</span>
            </span>
          </div>
          <Input
            placeholder="Digite o título em português, inglês, kanji, hangul ou sinopse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tipo / Formato */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>
              <BookOpen size={16} />
              <span>Tipo de Obra / Romance</span>
            </span>
            <span className={styles.sectionHint}>Selecione um ou múltiplos formatos</span>
          </div>
          <div className={styles.chipGrid}>
            {ALL_FORMATS.map((fmt) => {
              const isSelected = selectedFormats.includes(fmt.value);
              return (
                <button
                  key={fmt.label}
                  type="button"
                  className={`${styles.selectPill} ${isSelected ? styles.selectPillActive : ""}`}
                  onClick={() => {
                    setSelectedFormats((prev) =>
                      isSelected ? prev.filter((f) => f !== fmt.value) : [...prev, fmt.value]
                    );
                  }}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status da História */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Status de Publicação</span>
            <span className={styles.sectionHint}>Situação da obra original</span>
          </div>
          <div className={styles.chipGrid}>
            {ALL_STATUSES.map((st) => {
              const isSelected = selectedStatuses.includes(st.value);
              return (
                <button
                  key={st.value}
                  type="button"
                  className={`${styles.selectPill} ${isSelected ? styles.selectPillActive : ""}`}
                  onClick={() => {
                    setSelectedStatuses((prev) =>
                      isSelected ? prev.filter((s) => s !== st.value) : [...prev, st.value]
                    );
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Idioma Original */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Idioma Original</span>
            <span className={styles.sectionHint}>País de origem do autor</span>
          </div>
          <div className={styles.chipGrid}>
            {ALL_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  className={`${styles.selectPill} ${isSelected ? styles.selectPillActive : ""}`}
                  onClick={() => {
                    setSelectedLanguages((prev) =>
                      isSelected ? prev.filter((l) => l !== lang) : [...prev, lang]
                    );
                  }}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Faixas Numéricas: Capítulos e Avaliação */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <span className={styles.sectionLabel}>Capítulos & Avaliação</span>
          </div>
          <div className={styles.rangeGrid}>
            <div className={styles.rangeItem}>
              <label htmlFor="min-capitulos-input" style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Capítulos Mínimos [min]
              </label>
              <input
                id="min-capitulos-input"
                type="number"
                min="0"
                className={styles.rangeInput}
                placeholder="Ex: 50"
                value={minChapters}
                onChange={(e) => setMinChapters(e.target.value)}
              />
            </div>

            <div className={styles.rangeItem}>
              <label htmlFor="max-capitulos-input" style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Capítulos Máximos [máx]
              </label>
              <input
                id="max-capitulos-input"
                type="number"
                min="0"
                className={styles.rangeInput}
                placeholder="Ex: 500"
                value={maxChapters}
                onChange={(e) => setMaxChapters(e.target.value)}
              />
            </div>

            <div className={styles.rangeItem}>
              <label htmlFor="min-rating-select" style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Avaliação Mínima [min]
              </label>
              <select
                id="min-rating-select"
                className={styles.rangeInput}
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
              >
                <option value={0}>Qualquer nota</option>
                <option value={3.0}>★ 3.0 ou superior</option>
                <option value={3.5}>★ 3.5 ou superior</option>
                <option value={4.0}>★ 4.0 ou superior</option>
                <option value={4.5}>★ 4.5 ou superior</option>
              </select>
            </div>

            <div className={styles.rangeItem}>
              <label htmlFor="ordenacao-select" style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Ordenar Resultados Por
              </label>
              <select
                id="ordenacao-select"
                className={styles.rangeInput}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="NOTA_DESC">Maior Avaliação</option>
                <option value="CAPITULOS_DESC">Mais Capítulos</option>
                <option value="TITULO_ASC">Título (A-Z)</option>
                <option value="TITULO_DESC">Título (Z-A)</option>
                <option value="RECENTES">Mais Recentes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gêneros com Tri-State e Operador [E / OU] */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className={styles.sectionLabel}>Gêneros</span>
              <div className={styles.operatorToggle}>
                <button
                  type="button"
                  className={`${styles.operatorBtn} ${genreOperator === "AND" ? styles.operatorBtnActive : ""}`}
                  onClick={() => setGenreOperator("AND")}
                  title="A obra deve conter TODOS os gêneros marcados"
                >
                  E (AND)
                </button>
                <button
                  type="button"
                  className={`${styles.operatorBtn} ${genreOperator === "OR" ? styles.operatorBtnActive : ""}`}
                  onClick={() => setGenreOperator("OR")}
                  title="A obra pode conter QUALQUER um dos gêneros marcados"
                >
                  OU (OR)
                </button>
              </div>
            </div>
            <span className={styles.sectionHint}>
              Clique 1x para <strong>Incluir (+)</strong>, 2x para <strong>Excluir (-)</strong>, 3x para <strong>Desmarcar</strong>.
            </span>
          </div>

          <div className={styles.chipGrid}>
            {FULL_GENRES.map((genre) => (
              <TriStateChip
                key={genre}
                label={genre}
                state={genresState[genre] || 0}
                onChange={(s: TriState) => handleGenreToggle(genre, s)}
              />
            ))}
          </div>
        </div>

        {/* Tags / Etiquetas com Tri-State e Operador [E / OU] */}
        <div className={styles.filterSection}>
          <div className={styles.sectionHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className={styles.sectionLabel}>Etiquetas & Tags Temáticas</span>
              <div className={styles.operatorToggle}>
                <button
                  type="button"
                  className={`${styles.operatorBtn} ${tagOperator === "AND" ? styles.operatorBtnActive : ""}`}
                  onClick={() => setTagOperator("AND")}
                  title="A obra deve conter TODAS as tags marcadas"
                >
                  E (AND)
                </button>
                <button
                  type="button"
                  className={`${styles.operatorBtn} ${tagOperator === "OR" ? styles.operatorBtnActive : ""}`}
                  onClick={() => setTagOperator("OR")}
                  title="A obra pode conter QUALQUER uma das tags marcadas"
                >
                  OU (OR)
                </button>
              </div>
            </div>

            <div style={{ width: 220 }}>
              <Input
                placeholder="Filtrar tags..."
                value={tagFilterInput}
                onChange={(e) => setTagFilterInput(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.chipGrid}>
            {POPULAR_TAGS.filter((t) =>
              t.toLowerCase().includes(tagFilterInput.toLowerCase().trim())
            ).map((tag) => (
              <TriStateChip
                key={tag}
                label={tag}
                state={tagsState[tag] || 0}
                onChange={(s: TriState) => handleTagToggle(tag, s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Barra Fixa de Ação & Filtros Ativos */}
      <div className={styles.actionStickyBar}>
        <div className={styles.activeSummary}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 700 }}>
            {activeFiltersCount === 0 ? "Nenhum filtro ativo" : `Filtros Ativos (${activeFiltersCount}):`}
          </span>

          {selectedFormats.map((f) => (
            <span key={f} className={styles.activePill}>
              Tipo: {f}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setSelectedFormats((prev) => prev.filter((x) => x !== f))}
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {Object.entries(genresState).map(([g, st]) => {
            if (st === 0) return null;
            const isInc = st === 1;
            return (
              <span
                key={g}
                className={styles.activePill}
                style={{
                  color: isInc ? "var(--accent-emerald)" : "var(--accent-rose)",
                  borderColor: isInc ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
                }}
              >
                {isInc ? "+" : "-"} {g}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleGenreToggle(g, 0)}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}

          {Object.entries(tagsState).map(([t, st]) => {
            if (st === 0) return null;
            const isInc = st === 1;
            return (
              <span
                key={t}
                className={styles.activePill}
                style={{
                  color: isInc ? "var(--accent-emerald)" : "var(--accent-rose)",
                  borderColor: isInc ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)",
                }}
              >
                {isInc ? "+" : "-"} {t}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleTagToggle(t, 0)}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <RotateCcw size={14} />
              <span>Limpar Filtros</span>
            </Button>
          )}

          <div style={{ fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--brand-primary)" }}>
            {filteredWorks.length} obra(s) encontrada(s)
          </div>
        </div>
      </div>

      {/* Lista de Resultados */}
      <div className={styles.resultsHeader}>
        <div className={styles.resultsCount}>
          Resultados da Busca Profunda ({filteredWorks.length})
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className={styles.emptyResults}>
          <h3>Nenhuma obra encontrada</h3>
          <p style={{ marginTop: "0.5rem", fontSize: "var(--text-sm)" }}>
            Tente remover alguns gêneros excluídos (-) ou alterar o operador para [OU].
          </p>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} style={{ marginTop: "1rem" }}>
            Resetar Todos os Filtros
          </Button>
        </div>
      ) : (
        <div className={styles.worksGrid}>
          {filteredWorks.map((obra) => (
            <Card key={obra.id} style={{ padding: "0.75rem", display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  aspectRatio: "2/3",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  background: "var(--bg-elevated)",
                  marginBottom: "0.75rem",
                }}
              >
                {obra.capaUrl ? (
                  <img
                    src={obra.capaUrl}
                    alt={obra.tituloPrincipal}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    Sem capa
                  </div>
                )}
              </div>

              <h2
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  marginBottom: "0.25rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={obra.tituloPrincipal}
              >
                {obra.tituloPrincipal}
              </h2>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <Badge variant="neutral">{obra.tipoObra}</Badge>
                {obra.notaGeral !== undefined && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-amber)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                    <Star size={12} fill="currentColor" />
                    {obra.notaGeral.toFixed(1)}
                  </span>
                )}
              </div>

              {obra.totalCapitulosLancados !== undefined && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                  {obra.totalCapitulosLancados} capítulos
                </div>
              )}

              {obra.generos && obra.generos.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.75rem" }}>
                  {obra.generos.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      style={{
                        fontSize: "0.65rem",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {g}
                    </span>
                  ))}
                  {obra.generos.length > 3 && (
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      +{obra.generos.length - 3}
                    </span>
                  )}
                </div>
              )}

              {isAuthenticated && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedWork(obra)}
                  style={{ width: "100%", marginTop: "auto" }}
                >
                  <Plus size={14} />
                  <span>Estante</span>
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Adicionar à Estante */}
      {selectedWork && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedWork(null)}
          title={`Adicionar: ${selectedWork.tituloPrincipal}`}
        >
          {addSuccess ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--accent-emerald)" }}>
              <Check size={36} style={{ margin: "0 auto 1rem" }} />
              <p style={{ fontWeight: 700 }}>Obra adicionada à sua estante com sucesso!</p>
            </div>
          ) : (
            <form onSubmit={handleAddToShelf} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                A obra entrará na sua estante com status <strong>LENDO</strong>.
              </p>

              <Input
                label="Link Privado de Leitura (Criptografado)"
                placeholder="https://exemplo.com/manga/meu-capitulo"
                value={readingUrl}
                onChange={(e) => setReadingUrl(e.target.value)}
              />

              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Seu link privado de leitura é armazenado com criptografia client-side AES-GCM e nunca é exposto publicamente.
              </p>

              <Button type="submit" variant="primary" size="md" isLoading={isAdding} style={{ marginTop: "0.5rem" }}>
                Confirmar e Adicionar
              </Button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
