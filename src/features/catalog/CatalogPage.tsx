import React, { useEffect, useMemo, useState } from "react";
import styles from "./CatalogPage.module.css";
import { WorkService } from "../../services/work.service";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { AdvancedSearchFilter, type FilterState } from "./AdvancedSearchFilter/AdvancedSearchFilter";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import type { ObraResponse, TipoObra } from "../../types/work.types";
import type { StatusLeitura, Visibilidade } from "../../types/catalog.types";
import { Star, Plus, Check, BookPlus, ChevronLeft, ChevronRight, Share2 } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  selectedTypes: [],
  selectedStatuses: [],
  minChapters: 0,
  genresState: {},
  sortBy: "NOTA_DESC",
};

const PAGE_SIZE = 12;

export const CatalogPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal: Adicionar à Estante
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
  const [submeterComunitario, setSubmeterComunitario] = useState(true);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  const fetchWorks = async () => {
    try {
      setIsLoading(true);
      const data = await WorkService.listWorks();
      setWorks(data);
    } catch (err: any) {
      console.error("Falha ao buscar catálogo:", err);
      toast.error(err, "Falha ao Carregar Catálogo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  // Lógica de Filtragem e Ordenação
  const filteredWorks = useMemo(() => {
    const includedGenres = Object.entries(filters.genresState)
      .filter(([_, s]) => s === 1)
      .map(([g]) => g.toLowerCase());
    const excludedGenres = Object.entries(filters.genresState)
      .filter(([_, s]) => s === -1)
      .map(([g]) => g.toLowerCase());

    const result = works.filter((w) => {
      // 1. Busca textual
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = w.tituloPrincipal.toLowerCase().includes(q);
        const matchOriginal = w.tituloOriginal?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchOriginal) return false;
      }

      // 2. Formato literário
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(w.tipoObra)) {
        return false;
      }

      // 3. Status de Publicação
      if (filters.selectedStatuses.length > 0 && w.statusPublicacao) {
        if (!filters.selectedStatuses.includes(w.statusPublicacao)) {
          return false;
        }
      }

      // 4. Mínimo de capítulos
      if (filters.minChapters > 0 && (w.totalCapitulosLancados || 0) < filters.minChapters) {
        return false;
      }

      // 5. Gêneros Tri-state (+/-)
      const workGenres = (w.generos || []).map((g) => g.toLowerCase());
      if (includedGenres.length > 0) {
        const hasAllIncluded = includedGenres.every((g) => workGenres.includes(g));
        if (!hasAllIncluded) return false;
      }
      if (excludedGenres.length > 0) {
        const hasAnyExcluded = excludedGenres.some((g) => workGenres.includes(g));
        if (hasAnyExcluded) return false;
      }

      return true;
    });

    // Ordenação
    return result.sort((a, b) => {
      if (filters.sortBy === "NOTA_DESC") {
        return (b.notaGeral || 0) - (a.notaGeral || 0);
      }
      if (filters.sortBy === "CAPITULOS_DESC") {
        return (b.totalCapitulosLancados || 0) - (a.totalCapitulosLancados || 0);
      }
      if (filters.sortBy === "TITULO_ASC") {
        return a.tituloPrincipal.localeCompare(b.tituloPrincipal);
      }
      if (filters.sortBy === "RECENTES") {
        return b.id - a.id;
      }
      return 0;
    });
  }, [works, filters]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredWorks.slice(start, start + PAGE_SIZE);
  }, [filteredWorks, currentPage]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const handleOpenAddModal = (work: ObraResponse) => {
    if (!isAuthenticated) {
      toast.info("Faça login para adicionar títulos à sua estante pessoal!");
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
      }, 1200);
    } catch (err: any) {
      toast.error(err, "Falha ao Adicionar");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloPrincipal.trim()) {
      toast.warning("O título principal é obrigatório.");
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

      if (submeterComunitario && user?.id) {
        await WorkService.submitToGlobalCatalog(created.id, user.id);
        toast.success(
          "Obra criada e submetida para avaliação comunitária no catálogo global com sucesso!",
          "Sugestão Enviada"
        );
      } else {
        toast.success(
          "Obra criada como privada em sua conta!",
          "Obra Cadastrada"
        );
      }

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

  return (
    <div>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.title}>Catálogo Global</h1>
            <p className={styles.subtitle}>
              Explore mangás, webtoons, light novels e livros catalogados pela comunidade Shiori.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (!isAuthenticated) {
                toast.info("Faça login para sugerir novas obras ao catálogo.");
                return;
              }
              setIsSuggestModalOpen(true);
            }}
          >
            <BookPlus size={18} />
            <span>Sugerir Obra Manual</span>
          </Button>
        </div>

        {/* Filtros de Busca */}
        <AdvancedSearchFilter
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
          <Spinner size="lg" />
        </div>
      ) : paginatedWorks.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "0.5rem" }}>
            Nenhuma obra encontrada para os filtros selecionados.
          </p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Tente remover alguns filtros ou busque por outro termo. Você também pode sugerir uma nova obra!
          </p>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} style={{ margin: "0 auto" }}>
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedWorks.map((work) => (
              <Card key={work.id} interactive className={styles.workCard}>
                <div className={styles.coverWrapper}>
                  {work.capaUrl ? (
                    <img src={work.capaUrl} alt={work.tituloPrincipal} className={styles.coverImg} loading="lazy" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      Sem Capa
                    </div>
                  )}
                  {work.statusCatalogo === "OFICIAL" && (
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <Badge variant="brand">Oficial</Badge>
                    </div>
                  )}
                </div>

                <div className={styles.workInfo}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <Badge variant="neutral">{work.tipoObra}</Badge>
                    {work.notaGeral !== undefined && work.notaGeral > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-amber)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                        <Star size={12} fill="currentColor" />
                        {work.notaGeral.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <h3 className={styles.workTitle} title={work.tituloPrincipal}>
                    {work.tituloPrincipal}
                  </h3>

                  {work.totalCapitulosLancados ? (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      {work.totalCapitulosLancados} capítulos lançados
                    </span>
                  ) : null}

                  <p className={styles.workSynopsis}>
                    {work.sinopse || "Sem sinopse cadastrada no momento."}
                  </p>

                  <div style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenAddModal(work)}
                      style={{ width: "100%" }}
                    >
                      <Plus size={14} />
                      <span>+ Estante</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2.5rem" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </Button>

              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Página {currentPage} de {totalPages} ({filteredWorks.length} obras)
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

      {/* Modal: Adicionar Obra à Minha Estante */}
      {selectedWork && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedWork(null)}
          title={`Adicionar: ${selectedWork.tituloPrincipal}`}
        >
          {addSuccess ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <Check size={40} style={{ color: "#34D399", margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "var(--text-base)", marginBottom: "0.5rem" }}>Adicionada com Sucesso!</h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                A obra agora está disponível em sua estante pessoal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAddToShelf} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Status Inicial de Leitura
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
                  <option value="LENDO">Lendo</option>
                  <option value="PLANEJADO">Planejo Ler</option>
                  <option value="PAUSADO">Pausado</option>
                  <option value="ENGAVETADO">Engavetado</option>
                  <option value="TERMINOU">Terminou</option>
                  <option value="DROPOU">Abdicou</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Visibilidade na Sua Estante
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
                  <option value="RESTRITO">Restrito (Apenas amigos conectados)</option>
                  <option value="PUBLICO">Público (Visível em seu perfil aberto)</option>
                  <option value="PRIVADO">Privado (Apenas você pode ver)</option>
                </select>
              </div>

              <Input
                label="Link Privado de Leitura (Opcional)"
                type="url"
                placeholder="https://sua-fonte-de-leitura.com/capitulo"
                value={readingUrl}
                onChange={(e) => setReadingUrl(e.target.value)}
                
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAdding}
                style={{ marginTop: "0.5rem" }}
              >
                Confirmar Adição à Estante
              </Button>
            </form>
          )}
        </Modal>
      )}

      {/* Modal: Sugerir Obra Manual */}
      <Modal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        title="Sugerir Obra Manual ao Catálogo"
      >
        <form onSubmit={handleCreateWork} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Título Principal (Obrigatório)"
            placeholder="Ex: Solo Leveling, Omniscient Reader..."
            value={tituloPrincipal}
            onChange={(e) => setTituloPrincipal(e.target.value)}
            required
            maxLength={150}
          />

          <Input
            label="Título Original (Opcional)"
            placeholder="Ex: 나 혼자만 레벨업"
            value={tituloOriginal}
            onChange={(e) => setTituloOriginal(e.target.value)}
            maxLength={150}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Tipo de Obra
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
                <option value="NOVEL">Light Novel</option>
                <option value="MANHWA">Manhwa</option>
                <option value="MANHUA">Manhua</option>
                <option value="COMIC">Comic</option>
                <option value="LIVRO">Livro</option>
              </select>
            </div>

            <Input
              label="Capítulos Lançados"
              type="number"
              min="0"
              value={totalCapitulos}
              onChange={(e) => setTotalCapitulos(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <Input
            label="URL da Capa (Opcional)"
            type="url"
            placeholder="https://exemplo.com/capa.jpg"
            value={capaUrl}
            onChange={(e) => setCapaUrl(e.target.value)}
            maxLength={500}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
              Sinopse (Opcional)
            </label>
            <textarea
              placeholder="Descreva o enredo da obra..."
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

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "var(--text-xs)", color: "var(--text-secondary)", cursor: "pointer", background: "var(--bg-elevated)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
            <input
              type="checkbox"
              checked={submeterComunitario}
              onChange={(e) => setSubmeterComunitario(e.target.checked)}
              style={{ marginTop: "2px" }}
            />
            <div>
              <strong style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Share2 size={13} style={{ color: "var(--brand-primary)" }} />
                Submeter para aprovação comunitária no Catálogo Global
              </strong>
              <div style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Se desmarcado, a obra será criada exclusivamente como privada em sua conta.
              </div>
            </div>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmittingWork}
            style={{ marginTop: "0.5rem" }}
          >
            Cadastrar e Salvar Obra
          </Button>
        </form>
      </Modal>
    </div>
  );
};
