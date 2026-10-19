import React, { useEffect, useState, useMemo } from "react";
import styles from "./CatalogPage.module.css";
import { WorkService } from "../../services/work.service";
import { CatalogService } from "../../services/catalog.service";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { useAuthStore } from "../../store/authStore";
import { AdvancedSearchFilter } from "./AdvancedSearchFilter/AdvancedSearchFilter";
import { type SearchFiltersState, DEFAULT_FILTERS } from "../../types/filter.types";
import type { ObraResponse } from "../../types/work.types";
import { Plus, Star, Check } from "lucide-react";

export const CatalogPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFiltersState>(DEFAULT_FILTERS);

  // Modal para adicionar obra à estante
  const [selectedWork, setSelectedWork] = useState<ObraResponse | null>(null);
  const [readingUrl, setReadingUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadWorks = async () => {
      try {
        const data = await WorkService.listWorks();
        if (isMounted) setWorks(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadWorks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Lógica de Filtragem e Ordenação Estilo NovelUpdates
  const filteredWorks = useMemo(() => {
    const includedGenres = Object.entries(filters.genresState)
      .filter(([, state]) => state === 1)
      .map(([genre]) => genre.toLowerCase());

    const excludedGenres = Object.entries(filters.genresState)
      .filter(([, state]) => state === -1)
      .map(([genre]) => genre.toLowerCase());

    const includedTags = Object.entries(filters.tagsState)
      .filter(([, state]) => state === 1)
      .map(([tag]) => tag.toLowerCase());

    const excludedTags = Object.entries(filters.tagsState)
      .filter(([, state]) => state === -1)
      .map(([tag]) => tag.toLowerCase());

    const result = works.filter((w) => {
      // 1. Busca por texto
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = w.tituloPrincipal.toLowerCase().includes(q);
        const matchOriginal = w.tituloOriginal?.toLowerCase().includes(q);
        if (!matchTitle && !matchOriginal) return false;
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

      // 6. Tags: DEVE conter todas as inclusas (+)
      const obraTags = (w.tags || []).map((t) => t.toLowerCase());
      if (includedTags.length > 0) {
        const hasAllTags = includedTags.every((t) => obraTags.includes(t));
        if (!hasAllTags) return false;
      }

      // 7. Tags: NÃO PODE conter nenhuma das excluídas (-)
      if (excludedTags.length > 0) {
        const hasAnyExcludedTag = excludedTags.some((t) => obraTags.includes(t));
        if (hasAnyExcludedTag) return false;
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
      alert(err.message || "Falha ao adicionar obra.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Catálogo de Leituras</h1>
        <p className={styles.subtitle}>
          Consulte o acervo de literatura asiática e ocidental com filtros avançados de inclusão e exclusão estilo NovelUpdates.
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
