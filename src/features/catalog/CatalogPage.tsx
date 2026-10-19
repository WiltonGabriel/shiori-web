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
import type { ObraResponse } from "../../types/work.types";
import { Star, Plus, Check } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  searchQuery: "",
  selectedTypes: [],
  minChapters: 0,
  genresState: {},
  sortBy: "NOTA_DESC",
};

export const CatalogPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Estado do Modal de Adicionar à Estante
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
        const query = filters.searchQuery.toLowerCase().trim();
        const mainTitle = w.tituloPrincipal.toLowerCase();
        const origTitle = (w.tituloOriginal || "").toLowerCase();
        if (!mainTitle.includes(query) && !origTitle.includes(query)) {
          return false;
        }
      }

      // 2. Formato literário
      if (filters.selectedTypes.length > 0) {
        if (!filters.selectedTypes.includes(w.tipoObra)) return false;
      }

      // 3. Mínimo de capítulos
      if (filters.minChapters > 0) {
        if ((w.totalCapitulosLancados || 0) < filters.minChapters) return false;
      }

      // 4. Gêneros: DEVE conter todos os inclusos (+)
      const obraGeneros = (w.generos || []).map((g) => g.toLowerCase());
      if (includedGenres.length > 0) {
        const hasAllIncluded = includedGenres.every((g) => obraGeneros.includes(g));
        if (!hasAllIncluded) return false;
      }

      // 5. Gêneros: NÃO PODE conter nenhum dos excluídos (-)
      if (excludedGenres.length > 0) {
        const hasAnyExcluded = excludedGenres.some((g) => obraGeneros.includes(g));
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
      return b.id - a.id;
    });
  }, [works, filters]);

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
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Catálogo de Leituras</h1>
        <p className={styles.subtitle}>
          Consulte o acervo de mangás, novels, livros e quadrinhos com filtros rápidos ou abra a busca profunda.
        </p>

        <AdvancedSearchFilter
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Nenhuma obra encontrada para a combinação de filtros selecionada.
        </Card>
      ) : (
        <div className={styles.grid}>
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
                  {obra.totalCapitulosLancados} capítulos lançados
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
