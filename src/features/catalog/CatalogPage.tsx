import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CatalogPage.module.css";
import { WorkService } from "../../services/work.service";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useDebounce } from "../../hooks/useDebounce";
import { HorizontalScroller } from "../../components/ui/HorizontalScroller/HorizontalScroller";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import {
  TODOS_FORMATOS,
  TIPO_OBRA_LABELS,
  type ObraResponse,
  type TipoObra,
  type StatusPublicacao,
  type SortOption,
  type IntegracaoMetadadosObra,
} from "../../types/work.types";
import type { StatusLeitura, Visibilidade } from "../../types/catalog.types";
import {
  Search,
  SlidersHorizontal,
  Plus,
  BookPlus,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  BookOpen,
  EyeOff,
  Sparkles,
} from "lucide-react";

const QUICK_TYPES: { value: TipoObra | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos os Tipos" },
  { value: "MANGA", label: "Mangá" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "MANHUA", label: "Manhua" },
  { value: "LIGHT_NOVEL", label: "Light Novel" },
  { value: "WEB_NOVEL", label: "Web Novel" },
  { value: "COMIC", label: "Comic / HQ" },
  { value: "LIVRO", label: "Livro Tradicional" },
];

const QUICK_STATUSES: { value: StatusPublicacao | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Qualquer Status" },
  { value: "EM_LANCAMENTO", label: "Em Lançamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "EM_HIATO", label: "Em Hiato" },
];

const PAGE_SIZE = 15;

interface AssistedNotice {
  formatos: TipoObra[];
  mensagem?: string | null;
}

export const CatalogPage: React.FC = () => {
  useDocumentTitle(
    "Catálogo | Shiori",
    "Explore e descubra mangás, novels, manhwas, comics e livros no catálogo do Shiori. Filtre por gênero, formato literário e status de publicação."
  );

  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assistedNotice, setAssistedNotice] = useState<AssistedNotice | null>(null);

  // Filtros
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedType, setSelectedType] = useState<TipoObra | "TODOS">("TODOS");
  const [selectedStatus, setSelectedStatus] = useState<StatusPublicacao | "TODOS">("TODOS");
  const [sortBy, setSortBy] = useState<SortOption>("NOTA_DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Modal: Adicionar à Minha Estante
  const [selectedWork, setSelectedWork] = useState<ObraResponse | null>(null);
  const [readingUrl, setReadingUrl] = useState("");
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [visibilidade, setVisibilidade] = useState<Visibilidade>("RESTRITO");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Modal: Sugerir Obra Manual
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [tituloPrincipal, setTituloPrincipal] = useState("");
  const [tituloOriginal, setTituloOriginal] = useState("");
  const [capaUrl, setCapaUrl] = useState("");
  const [tipoObra, setTipoObra] = useState<TipoObra>("MANGA");
  const [totalCapitulos, setTotalCapitulos] = useState<number>(0);
  const [sinopse, setSinopse] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Integração com Provedores Externos no Modal
  const [externalSearchTerm, setExternalSearchTerm] = useState("");
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<IntegracaoMetadadosObra[]>([]);

  const fetchWorks = async () => {
    try {
      setIsLoading(true);
      if (debouncedSearch.trim()) {
        const result = await WorkService.searchWorksAssisted(debouncedSearch.trim());
        setWorks(result.obras || []);
        if (result.correspondenciasEmOutrosFormatos && (!result.obras || result.obras.length === 0)) {
          setAssistedNotice({
            formatos: result.formatosDetectadosNaoPermitidos,
            mensagem: result.mensagemContextual,
          });
        } else {
          setAssistedNotice(null);
        }
      } else {
        setAssistedNotice(null);
        const data = await WorkService.listWorks();
        setWorks(data || []);
      }
    } catch (err: any) {
      console.error("Falha ao buscar catálogo:", err);
      toast.error(err, "Falha ao Carregar Catálogo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, [debouncedSearch, selectedType, selectedStatus]);

  const handleSearchExternal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!externalSearchTerm.trim()) {
      toast.warning("Digite um termo para pesquisar nos provedores.");
      return;
    }
    try {
      setIsSearchingExternal(true);
      const results = await WorkService.searchExternalWorks(externalSearchTerm.trim());
      setExternalResults(results || []);
      if (!results || results.length === 0) {
        toast.info("Nenhuma obra encontrada nos provedores externos (AniList, MangaDex, Open Library).");
      }
    } catch (err: any) {
      toast.error(err, "Falha na busca externa");
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const handleSelectExternalResult = (item: IntegracaoMetadadosObra) => {
    setTituloPrincipal(item.tituloPrincipal);
    if (item.tituloOriginal) setTituloOriginal(item.tituloOriginal);
    if (item.capaUrl) setCapaUrl(item.capaUrl);
    if (item.totalCapitulosLancados) setTotalCapitulos(item.totalCapitulosLancados);
    if (item.sinopse) setSinopse(item.sinopse);
    if (item.tipoObra && TODOS_FORMATOS.includes(item.tipoObra as TipoObra)) {
      setTipoObra(item.tipoObra as TipoObra);
    }
    setExternalResults([]);
    toast.success(`Metadados de "${item.tituloPrincipal}" importados com sucesso! Revise os campos e envie.`);
  };

  // Lógica de Filtragem e Busca
  const filteredWorks = useMemo(() => {
    const result = works.filter((w) => {
      // 1. Busca textual com debounce
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchTitle = w.tituloPrincipal.toLowerCase().includes(q);
        const matchOriginal = w.tituloOriginal?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchOriginal) return false;
      }

      // 2. Tipo de Obra
      if (selectedType !== "TODOS" && w.tipoObra !== selectedType) {
        return false;
      }

      // 3. Status de Publicação
      if (selectedStatus !== "TODOS" && w.statusPublicacao !== selectedStatus) {
        return false;
      }

      return true;
    });

    // Ordenação
    return result.sort((a, b) => {
      if (sortBy === "NOTA_DESC") {
        return (b.notaGeral || 0) - (a.notaGeral || 0);
      }
      if (sortBy === "CAPITULOS_DESC") {
        return (b.totalCapitulosLancados || 0) - (a.totalCapitulosLancados || 0);
      }
      if (sortBy === "TITULO_ASC") {
        return a.tituloPrincipal.localeCompare(b.tituloPrincipal);
      }
      if (sortBy === "RECENTES") {
        return b.id - a.id;
      }
      return 0;
    });
  }, [works, debouncedSearch, selectedType, selectedStatus, sortBy]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredWorks.slice(start, start + PAGE_SIZE);
  }, [filteredWorks, currentPage]);

  const handleOpenAddModal = (work: ObraResponse) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setSelectedWork(work);
    setReadingUrl("");
    setStatusLeitura("LENDO");
    setVisibilidade("RESTRITO");
    setAddSuccess(false);
  };

  const handleAddToShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWork) return;

    try {
      setIsAdding(true);
      await CatalogService.addItemToShelf({
        obraId: selectedWork.id,
        statusLeitura,
        visibilidade,
        urlLeitura: readingUrl.trim() || undefined,
      });

      setAddSuccess(true);
      toast.success(`"${selectedWork.tituloPrincipal}" foi adicionada à sua estante!`);
      setTimeout(() => {
        setSelectedWork(null);
        setAddSuccess(false);
      }, 1000);
    } catch (err: any) {
      toast.error(err, "Falha ao Adicionar");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloPrincipal.trim()) {
      toast.warning("O título principal da obra é obrigatório.");
      return;
    }

    try {
      setIsSubmittingWork(true);
      const created = await WorkService.createWork({
        tituloPrincipal: tituloPrincipal.trim(),
        tituloOriginal: tituloOriginal.trim() || undefined,
        capaUrl: capaUrl.trim() || undefined,
        tipoObra,
        totalCapitulosLancados: totalCapitulos > 0 ? totalCapitulos : undefined,
        sinopse: sinopse.trim() || undefined,
      });

      if (user?.id) {
        await WorkService.submitToGlobalCatalog(created.id, user.id);
      }

      toast.success(
        "Obra cadastrada e enviada para curadoria comunitária do Shiori!",
        "Sugestão Enviada"
      );

      setIsSuggestModalOpen(false);
      setTituloPrincipal("");
      setTituloOriginal("");
      setCapaUrl("");
      setTotalCapitulos(0);
      setSinopse("");
      fetchWorks();
    } catch (err: any) {
      toast.error(err, "Falha ao Sugerir Obra");
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedType("TODOS");
    setSelectedStatus("TODOS");
    setSortBy("NOTA_DESC");
    setCurrentPage(1);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.title}>Catálogo Global</h1>
            <p className={styles.subtitle}>
              Explore e descubra obras catalogadas pela comunidade. Pesquise por títulos, filtre por tipo ou sugira novas obras.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal();
                return;
              }
              setIsSuggestModalOpen(true);
            }}
          >
            <BookPlus size={17} />
            <span>Sugerir Obra Manual</span>
          </Button>
        </div>

        {/* 1. Barra de Busca Central com Debounce */}
        <div className={styles.searchSection}>
          <div className={styles.searchBarWrapper}>
            <div className={styles.searchInputArea}>
              <Input
                placeholder="Buscar por título, autor ou gênero..."
                leadingIcon={<Search size={16} />}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              title="Ordenar catálogo"
            >
              <option value="NOTA_DESC">Maior Avaliação</option>
              <option value="CAPITULOS_DESC">Mais Capítulos</option>
              <option value="TITULO_ASC">Título (A-Z)</option>
              <option value="RECENTES">Recentes</option>
            </select>

            <button
              type="button"
              className={`${styles.filterToggleBtn} ${isAdvancedOpen ? styles.filterToggleActive : ""}`}
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              title="Filtros avançados"
            >
              <SlidersHorizontal size={15} />
              <span>Filtros</span>
            </button>
          </div>

          {/* 2. Filtros por Facetas com Rolagem Horizontal Suave */}
          <div className={styles.quickFiltersRow}>
            <HorizontalScroller step={240} ariaLabel="Filtro rápido por formato literário">
              {QUICK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`${styles.quickChip} ${
                    selectedType === type.value ? styles.quickChipActive : ""
                  }`}
                  onClick={() => {
                    setSelectedType(type.value);
                    setCurrentPage(1);
                  }}
                >
                  {type.label}
                </button>
              ))}
            </HorizontalScroller>
          </div>

          {/* Painel Avançado Expandido */}
          {isAdvancedOpen && (
            <div className={styles.advancedPanel}>
              <div className={styles.panelSection}>
                <span className={styles.panelSectionTitle}>Status de Publicação</span>
                <div className={styles.chipGroup}>
                  {QUICK_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      className={`${styles.quickChip} ${
                        selectedStatus === status.value ? styles.quickChipActive : ""
                      }`}
                      onClick={() => {
                        setSelectedStatus(status.value);
                        setCurrentPage(1);
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Limpar Todos os Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Grade de Resultados de Cartões de Obra */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
          <Spinner size="lg" />
        </div>
      ) : assistedNotice ? (
        <div className={styles.assistedNoticeCard}>
          <div className={styles.noticeIconArea}>
            <EyeOff size={28} />
          </div>
          <div>
            <h3 className={styles.noticeTitle}>
              Obras encontradas em formatos não ativados
            </h3>
            <p className={styles.noticeDescription}>
              Encontramos obras correspondentes ao termo de busca, mas exclusivamente em formatos que estão desativados nas suas preferências de leitura.
            </p>
          </div>
          <div className={styles.detectedFormatsList}>
            {assistedNotice.formatos.map((fmt) => (
              <span key={fmt} className={styles.detectedFormatChip}>
                {TIPO_OBRA_LABELS[fmt] || fmt}
              </span>
            ))}
          </div>
          <p className={styles.noticeDescription} style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            Para preservar a sua escolha de leitura, as capas e dados dessas obras não foram exibidos. Deseja visualizar esses formatos? Ajuste suas preferências de leitura.
          </p>
          <div className={styles.noticeActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/configuracoes")}
            >
              Ajustar Preferências de Formatos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      ) : paginatedWorks.length === 0 ? (
        <div className={styles.emptyCard}>
          <BookOpen size={42} style={{ color: "var(--border-light)" }} />
          <div>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, margin: "0 0 0.4rem 0" }}>
              Nenhuma obra encontrada
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", margin: 0 }}>
              Não encontramos resultados para os filtros selecionados. Tente ajustar os termos de busca ou sugira o cadastro manual desta obra!
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal();
                  return;
                }
                setIsSuggestModalOpen(true);
              }}
            >
              <BookPlus size={15} />
              <span>Sugerir Obra Manual</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedWorks.map((work) => (
              <article key={work.id} className={styles.workCard}>
                <div className={styles.coverWrapper}>
                  {work.capaUrl ? (
                    <img
                      src={work.capaUrl}
                      alt={work.tituloPrincipal}
                      className={styles.coverImg}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.coverPlaceholder}>Sem Capa</div>
                  )}
                  {work.statusCatalogo === "OFICIAL" && (
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <Badge variant="brand">Oficial</Badge>
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardBadges}>
                    <Badge variant="neutral">{TIPO_OBRA_LABELS[work.tipoObra] || work.tipoObra}</Badge>
                    {work.notaGeral !== undefined && work.notaGeral > 0 && (
                      <span className={styles.ratingBadge}>
                        <Star size={11} fill="currentColor" />
                        {work.notaGeral.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h3 className={styles.workTitle} title={work.tituloPrincipal}>
                    {work.tituloPrincipal}
                  </h3>

                  <div className={styles.workMeta}>
                    {work.totalCapitulosLancados ? (
                      <span>{work.totalCapitulosLancados} capítulos</span>
                    ) : (
                      <span>Capítulos em atualização</span>
                    )}
                  </div>

                  <div className={styles.cardActionArea}>
                    <Button
                      variant="primary"
                      size="sm"
                      className={styles.addBtn}
                      onClick={() => handleOpenAddModal(work)}
                    >
                      <Plus size={14} />
                      <span>Adicionar ao Meu Catálogo</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </Button>

              <span className={styles.pageInfo}>
                Página {currentPage} de {totalPages} ({filteredWorks.length} obras encontradas)
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <span>Próxima</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ===================================================================
       * MODAL 1: ADICIONAR AO MEU CATÁLOGO
       * =================================================================== */}
      {selectedWork && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedWork(null)}
          title={`Adicionar: ${selectedWork.tituloPrincipal}`}
        >
          {addSuccess ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <Check size={42} style={{ color: "#34D399", margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "var(--text-base)", marginBottom: "0.5rem" }}>
                Adicionada ao Meu Catálogo!
              </h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                Acompanhe e registre seus capítulos na sua estante pessoal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddToShelf} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Status Inicial
                  </label>
                  <select
                    value={statusLeitura}
                    onChange={(e) => setStatusLeitura(e.target.value as StatusLeitura)}
                    style={{
                      padding: "0.65rem 0.95rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      minHeight: "var(--touch-target-min)",
                      outline: "none",
                    }}
                  >
                    <option value="LENDO">Lendo (Em andamento)</option>
                    <option value="PLANEJADO">Planejado (Quero ler)</option>
                    <option value="ENGAVETADO">Engavetado (Pausado)</option>
                    <option value="TERMINOU">Terminou (Concluído)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Visibilidade
                  </label>
                  <select
                    value={visibilidade}
                    onChange={(e) => setVisibilidade(e.target.value as Visibilidade)}
                    style={{
                      padding: "0.65rem 0.95rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      minHeight: "var(--touch-target-min)",
                      outline: "none",
                    }}
                  >
                    <option value="PUBLICO">Público (Visível no perfil)</option>
                    <option value="RESTRITO">Restrito (Conexões mútuas)</option>
                    <option value="PRIVADO">Privado (Apenas você)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Link de Leitura Privado (Opcional)"
                type="url"
                placeholder="Insira a URL do seu leitor ou site de acompanhamento..."
                value={readingUrl}
                onChange={(e) => setReadingUrl(e.target.value)}
                helperText="Fica gravado apenas para você e nunca é exposto publicamente."
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <Button variant="secondary" size="md" onClick={() => setSelectedWork(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isAdding}>
                  Confirmar e Adicionar
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ===================================================================
       * MODAL 2: SUGERIR OBRA MANUAL COM PROVEDORES EXTERNOS
       * =================================================================== */}
      {isSuggestModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsSuggestModalOpen(false);
            setExternalResults([]);
          }}
          title="Sugerir Obra Manual ao Catálogo"
        >
          <form onSubmit={handleCreateWork} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Não encontrou sua obra no catálogo? Pesquise em nossos provedores parceiros para auto-preencher ou cadastre manualmente abaixo.
            </p>

            {/* Bloco de Busca em Provedores Externos */}
            <div className={styles.externalSearchSection}>
              <div className={styles.externalSearchHeader}>
                <span className={styles.externalSearchTitle}>
                  Preenchimento Automático via Provedores (AniList, MangaDex, Open Library)
                </span>
                <Sparkles size={15} style={{ color: "var(--brand-light)" }} />
              </div>
              <div className={styles.externalSearchInputRow}>
                <Input
                  placeholder="Pesquisar título nos provedores externos..."
                  value={externalSearchTerm}
                  onChange={(e) => setExternalSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchExternal();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSearchExternal()}
                  isLoading={isSearchingExternal}
                >
                  Pesquisar
                </Button>
              </div>

              {externalResults.length > 0 && (
                <div className={styles.externalResultsList}>
                  {externalResults.map((item, idx) => (
                    <div key={`${item.idExterno}-${idx}`} className={styles.externalResultItem}>
                      <div className={styles.externalResultInfo}>
                        <span className={styles.externalResultTitle} title={item.tituloPrincipal}>
                          {item.tituloPrincipal}
                        </span>
                        <div className={styles.externalResultMeta}>
                          {item.provedorCodigo && (
                            <Badge variant="brand">{item.provedorCodigo}</Badge>
                          )}
                          <span>{TIPO_OBRA_LABELS[item.tipoObra as TipoObra] || item.tipoObra}</span>
                          {item.totalCapitulosLancados ? <span>• {item.totalCapitulosLancados} caps</span> : null}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectExternalResult(item)}
                      >
                        Importar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Título Principal *"
              placeholder="Digite o título principal da obra..."
              value={tituloPrincipal}
              onChange={(e) => setTituloPrincipal(e.target.value)}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Input
                label="Título Original (Opcional)"
                placeholder="Digite o título original ou alternativo..."
                value={tituloOriginal}
                onChange={(e) => setTituloOriginal(e.target.value)}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Formato Literário (Tipo) *
                </label>
                <select
                  value={tipoObra}
                  onChange={(e) => setTipoObra(e.target.value as TipoObra)}
                  style={{
                    padding: "0.65rem 0.95rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    minHeight: "var(--touch-target-min)",
                    outline: "none",
                  }}
                >
                  <option value="MANGA">Mangá</option>
                  <option value="MANHWA">Manhwa</option>
                  <option value="MANHUA">Manhua</option>
                  <option value="LIGHT_NOVEL">Light Novel</option>
                  <option value="WEB_NOVEL">Web Novel</option>
                  <option value="COMIC">Comic / HQ</option>
                  <option value="LIVRO">Livro Tradicional</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Input
                label="Capítulos Lançados"
                type="number"
                min="0"
                value={totalCapitulos}
                onChange={(e) => setTotalCapitulos(parseInt(e.target.value) || 0)}
              />

              <Input
                label="URL da Imagem de Capa"
                type="url"
                placeholder="Insira a URL direta da imagem de capa..."
                value={capaUrl}
                onChange={(e) => setCapaUrl(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Sinopse / Descrição
              </label>
              <textarea
                placeholder="Digite uma breve sinopse ou resumo da obra..."
                value={sinopse}
                onChange={(e) => setSinopse(e.target.value)}
                rows={3}
                style={{
                  padding: "0.65rem 0.95rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  fontSize: "var(--text-sm)",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsSuggestModalOpen(false);
                  setExternalResults([]);
                }}
                disabled={isSubmittingWork}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmittingWork}
              >
                Enviar Sugestão
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CatalogPage;
