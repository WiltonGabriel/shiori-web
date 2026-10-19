import React, { useEffect, useState, useMemo } from "react";
import styles from "./CatalogPage.module.css";
import { WorkService } from "../../services/work.service";
import { CatalogService } from "../../services/catalog.service";
import { Card } from "../../components/ui/Card/Card";
import { Input } from "../../components/ui/Input/Input";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Modal } from "../../components/ui/Modal/Modal";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { useAuthStore } from "../../store/authStore";
import type { ObraResponse, TipoObra } from "../../types/work.types";
import { Search, Plus, Star, Check } from "lucide-react";

const TYPES: (TipoObra | "TODOS")[] = ["TODOS", "MANGA", "NOVEL", "MANHWA", "COMIC", "LIVRO"];

export const CatalogPage: React.FC = () => {
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<TipoObra | "TODOS">("TODOS");
  const [isLoading, setIsLoading] = useState(true);

  // Modal para adicionar obra à estante
  const [selectedWork, setSelectedWork] = useState<ObraResponse | null>(null);
  const [readingUrl, setReadingUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const { isAuthenticated } = useAuthStore();

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

  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const matchSearch =
        !search ||
        w.tituloPrincipal.toLowerCase().includes(search.toLowerCase()) ||
        w.tituloOriginal?.toLowerCase().includes(search.toLowerCase());
      const matchType = activeType === "TODOS" || w.tipoObra === activeType;
      return matchSearch && matchType;
    });
  }, [works, search, activeType]);

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
        <h1 className={styles.title}>Explorar Catálogo</h1>
        <p className={styles.subtitle}>
          Encontre títulos da literatura asiática e ocidental, filtre por formato e adicione à sua estante pessoal.
        </p>

        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder="Buscar por título ou original..."
              leadingIcon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.chips}>
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`${styles.chip} ${activeType === t ? styles.chipActive : ""}`}
                onClick={() => setActiveType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      ) : filteredWorks.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Nenhuma obra encontrada para os critérios selecionados.
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

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <Badge variant="neutral">{obra.tipoObra}</Badge>
                {obra.notaGeral !== undefined && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-amber)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                    <Star size={12} fill="currentColor" />
                    {obra.notaGeral.toFixed(1)}
                  </span>
                )}
              </div>

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
                A obra entrará na sua estante como <strong>LENDO</strong>.
              </p>

              <Input
                label="Link Privado de Leitura (Opcional & Criptografado)"
                placeholder="https://exemplo.com/manga/meu-capitulo"
                value={readingUrl}
                onChange={(e) => setReadingUrl(e.target.value)}
              />

              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Seu link privado nunca é exposto publicamente para proteger a sua privacidade.
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
