import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./WorkDetailsPage.module.css";
import { WorkService } from "../../services/work.service";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { IncorporationModal } from "./components/IncorporationModal";
import { SuggestWorkModal } from "./components/SuggestWorkModal";
import type { ObraResponse } from "../../types/work.types";
import type { ItemCatalogoResponse, AdicionarItemCatalogoRequest } from "../../types/catalog.types";
import {
  ArrowLeft,
  Bookmark,
  Check,
  GitPullRequest,
  BookOpen,
  Calendar,
  Layers,
  ExternalLink,
} from "lucide-react";

type DetailTab = "SINOPSE" | "HISTORICO" | "ONDE_LER";

export const WorkDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [work, setWork] = useState<ObraResponse | null>(null);
  const [shelfItem, setShelfItem] = useState<ItemCatalogoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("SINOPSE");

  // Modais
  const [isIncorporating, setIsIncorporating] = useState(false);
  const [isSubmittingInc, setIsSubmittingInc] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  useDocumentTitle(
    work ? `${work.tituloPrincipal} — Shiori Catálogo` : "Detalhes da Obra — Shiori",
    work?.sinopse || "Detalhes e metadados da obra no catálogo global Shiori."
  );

  const loadWorkData = useCallback(async () => {
    if (!id || isNaN(Number(id))) {
      setError("Identificador de obra inválido.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const workData = await WorkService.getWorkById(Number(id));
      setWork(workData);

      // Se autenticado, verificar se já está na estante
      if (isAuthenticated) {
        try {
          const myShelf = await CatalogService.getMyShelf(0, 200);
          const found = myShelf.find((item) => item.obraId === Number(id));
          setShelfItem(found || null);
        } catch {
          // Falha não bloqueante na verificação da estante
        }
      }
    } catch (err: any) {
      console.error("Falha ao carregar obra:", err);
      setError("Obra não encontrada ou inacessível no catálogo global.");
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    loadWorkData();
  }, [loadWorkData]);

  const handleConfirmIncorporation = async (payload: AdicionarItemCatalogoRequest) => {
    try {
      setIsSubmittingInc(true);
      await CatalogService.addItemToShelf(payload);
      toast.success(`"${work?.tituloPrincipal}" incorporada à sua estante com sucesso!`);
      setIsIncorporating(false);
      loadWorkData();
    } catch (err: any) {
      toast.error(err, "Falha ao Incorporar Obra");
    } finally {
      setIsSubmittingInc(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page} style={{ alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button type="button" className={styles.backBtn} onClick={() => navigate("/catalogo")}>
            <ArrowLeft size={16} />
            <span>Voltar ao Catálogo</span>
          </button>
        </div>
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Obra Não Encontrada"
          description={error || "A obra solicitada não existe ou foi desvinculada do catálogo global."}
          action={{
            label: "Explorar Catálogo",
            onClick: () => navigate("/catalogo"),
            variant: "primary",
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Botão Voltar */}
      <div className={styles.backRow}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>
      </div>

      {/* Hero com Capa e Metadados Principais */}
      <section className={styles.hero}>
        {work.capaUrl && (
          <img src={work.capaUrl} alt="" className={styles.backdropImage} aria-hidden="true" />
        )}
        <div className={styles.heroContent}>
          <div className={styles.coverWrapper}>
            {work.capaUrl ? (
              <img src={work.capaUrl} alt={work.tituloPrincipal} className={styles.cover} />
            ) : (
              <div className={styles.coverPlaceholder}>
                <BookOpen size={48} />
              </div>
            )}
          </div>

          <div className={styles.infoCol}>
            <div className={styles.headerTags}>
              <Badge variant="brand">{work.tipoObra}</Badge>
              {work.statusCatalogo && <Badge variant="neutral">{work.statusCatalogo}</Badge>}
            </div>

            <h1 className={styles.title}>{work.tituloPrincipal}</h1>
            {work.tituloOriginal && (
              <div className={styles.originalTitle}>{work.tituloOriginal}</div>
            )}

            <div className={styles.metaRow}>
              {work.totalCapitulosLancados ? (
                <div className={styles.metaItem}>
                  <BookOpen size={16} />
                  <span>{work.totalCapitulosLancados} capítulos</span>
                </div>
              ) : null}

              {work.totalVolumes ? (
                <div className={styles.metaItem}>
                  <Layers size={16} />
                  <span>{work.totalVolumes} volumes</span>
                </div>
              ) : null}

              <div className={styles.metaItem}>
                <Calendar size={16} />
                <span>Atualizado recentemente</span>
              </div>
            </div>

            {/* Ações: Incorporar e Propor Edição */}
            <div className={styles.actionsRow}>
              {shelfItem ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate("/meu-catalogo")}
                  title="Obra já vinculada à sua estante pessoal"
                >
                  <Check size={16} color="var(--accent-emerald)" />
                  <span>Na Minha Estante</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setIsIncorporating(true)}
                  title="Incorporar ao meu catálogo pessoal com acompanhamento de progresso"
                >
                  <Bookmark size={16} />
                  <span>Incorporar à Minha Estante</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setIsSuggestModalOpen(true)}
                title="Propor alteração ou correção nos metadados globais da obra (estilo Git)"
              >
                <GitPullRequest size={16} />
                <span>Propor Sugestão de Edição</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Abas de Conteúdo */}
      <div className={styles.tabsBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "SINOPSE"}
          className={`${styles.tabBtn} ${activeTab === "SINOPSE" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("SINOPSE")}
        >
          Sinopse & Detalhes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "HISTORICO"}
          className={`${styles.tabBtn} ${activeTab === "HISTORICO" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("HISTORICO")}
        >
          Histórico de Contribuições
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ONDE_LER"}
          className={`${styles.tabBtn} ${activeTab === "ONDE_LER" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("ONDE_LER")}
        >
          Onde Ler
        </button>
      </div>

      {/* Aba: Sinopse & Detalhes */}
      {activeTab === "SINOPSE" && (
        <section className={styles.contentCard}>
          <div>
            <h2 className={styles.sectionTitle}>Sinopse</h2>
            <p className={styles.synopsis}>
              {work.sinopse || "Nenhuma sinopse disponível para esta obra no momento."}
            </p>
          </div>

          <div>
            <h2 className={styles.sectionTitle}>Ficha Técnica de Catálogo</h2>
            <div className={styles.techGrid}>
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Formato</span>
                <span className={styles.techValue}>{work.tipoObra}</span>
              </div>
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Status da Publicação</span>
                <span className={styles.techValue}>{work.statusCatalogo || "Em Andamento"}</span>
              </div>
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Capítulos Lançados</span>
                <span className={styles.techValue}>{work.totalCapitulosLancados || "Indefinido"}</span>
              </div>
              <div className={styles.techItem}>
                <span className={styles.techLabel}>Volumes</span>
                <span className={styles.techValue}>{work.totalVolumes || "Indefinido"}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Aba: Histórico de Contribuições (Estilo Git) */}
      {activeTab === "HISTORICO" && (
        <section className={styles.contentCard}>
          <div>
            <h2 className={styles.sectionTitle}>Histórico de Contribuições da Obra</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              O Shiori adota um fluxo colaborativo auditável inspirado no controle de versão Git. Modificações no catálogo público passam por revisão e aprovação antes de serem mescladas.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className={styles.commitItem}>
              <span className={styles.commitHash}>init</span>
              <div>
                <div className={styles.commitMsg}>Cadastro inicial da obra e metadados base</div>
                <div className={styles.commitMeta}>Registrado pelo Shiori Hub Global</div>
              </div>
            </div>

            {work.totalCapitulosLancados && (
              <div className={styles.commitItem}>
                <span className={styles.commitHash}>meta-sync</span>
                <div>
                  <div className={styles.commitMsg}>Atualização de total de capítulos ({work.totalCapitulosLancados})</div>
                  <div className={styles.commitMeta}>Sincronizado via conectores federados</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Aba: Onde Ler */}
      {activeTab === "ONDE_LER" && (
        <section className={styles.contentCard}>
          <div>
            <h2 className={styles.sectionTitle}>Onde Ler</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              O Shiori é uma plataforma de catálogo e acompanhamento soberano. Utilize os links abaixo para acessar os capítulos nas fontes oficiais ou provedores indexados.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>MangaDex</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  Capítulos em português e outros idiomas
                </div>
              </div>
              <a
                href={`https://mangadex.org/title?q=${encodeURIComponent(work.tituloPrincipal)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <span>Abrir</span>
                  <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Modal de Incorporação */}
      {isIncorporating && (
        <IncorporationModal
          work={work}
          isOpen={isIncorporating}
          onClose={() => setIsIncorporating(false)}
          onConfirm={handleConfirmIncorporation}
          isSubmitting={isSubmittingInc}
        />
      )}

      {/* Modal de Proposta de Sugestão de Edição */}
      {isSuggestModalOpen && (
        <SuggestWorkModal
          isOpen={isSuggestModalOpen}
          onClose={() => setIsSuggestModalOpen(false)}
          onWorkCreated={() => {
            setIsSuggestModalOpen(false);
            loadWorkData();
          }}
        />
      )}
    </div>
  );
};
