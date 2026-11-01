import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import { SuggestEditModal } from "./components/SuggestEditModal";
import { WorkTagsSection } from "./components/WorkTagsSection";
import type { ObraResponse } from "../../types/work.types";
import type { ItemCatalogoResponse, AdicionarItemCatalogoRequest } from "../../types/catalog.types";
import {
  ArrowLeft,
  Bookmark,
  Check,
  GitPullRequest,
  BookOpen,
  Layers,
  MessageSquare,
  Flag,
  Eye,
  Send,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal/Modal";

type DetailTab = "SINOPSE" | "COMENTARIOS";

interface WorkComment {
  id: number;
  autorId: number | null;
  autorApelido: string;
  autorAvatarUrl?: string | null;
  texto: string;
  contemSpoiler: boolean;
  dataCriacao: string;
}

export const WorkDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const isInvalidId = !id || isNaN(Number(id));
  const [work, setWork] = useState<ObraResponse | null>(null);
  const [shelfItem, setShelfItem] = useState<ItemCatalogoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(() => !isInvalidId);
  const [error, setError] = useState<string | null>(() => (isInvalidId ? "Identificador de obra inválido." : null));
  const [activeTab, setActiveTab] = useState<DetailTab>("SINOPSE");

  // Modais
  const [isIncorporating, setIsIncorporating] = useState(false);
  const [isSubmittingInc, setIsSubmittingInc] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  // Comentários e Denúncias reais
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentSpoiler, setNewCommentSpoiler] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});
  const [reportTarget, setReportTarget] = useState<{ type: "WORK" | "COMMENT"; commentId?: number } | null>(null);
  const [reportMotivo, setReportMotivo] = useState("DADOS_FALSOS_OU_DUPLICADOS");
  const [reportDetalhes, setReportDetalhes] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const loadComments = useCallback(async (obraId: number) => {
    try {
      const page = await WorkService.listComments(obraId, 0, 30);
      setComments(page.content || []);
    } catch {
      setComments([]);
    }
  }, []);

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
      loadComments(Number(id));

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
  }, [id, isAuthenticated, loadComments]);

  useEffect(() => {
    let isMounted = true;
    if (!id || isNaN(Number(id))) return;

    WorkService.getWorkById(Number(id))
      .then(async (workData) => {
        if (!isMounted) return;
        setWork(workData);
        loadComments(Number(id));
        if (isAuthenticated) {
          try {
            const myShelf = await CatalogService.getMyShelf(0, 200);
            if (!isMounted) return;
            const found = myShelf.find((item) => item.obraId === Number(id));
            setShelfItem(found || null);
          } catch {
            // Falha não bloqueante na verificação da estante
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Falha ao carregar obra:", err);
        setError("Obra não encontrada ou inacessível no catálogo global.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated, loadComments]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!work || !newCommentText.trim()) return;
    if (!isAuthenticated) {
      toast.warning("Faça login na sua conta para publicar comentários.");
      return;
    }
    try {
      setIsSubmittingComment(true);
      const created = await WorkService.createComment(work.id, {
        texto: newCommentText.trim(),
        contemSpoiler: newCommentSpoiler,
      });
      setComments((prev) => [created, ...prev]);
      setNewCommentText("");
      setNewCommentSpoiler(false);
      toast.success("Comentário publicado com sucesso!");
    } catch (err: any) {
      toast.error(err, "Erro ao Publicar Comentário");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleConfirmReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!work || !reportTarget) return;
    if (!isAuthenticated) {
      toast.warning("Faça login para registrar uma denúncia à moderação.");
      return;
    }
    try {
      setIsSubmittingReport(true);
      if (reportTarget.type === "WORK") {
        await WorkService.reportWork(work.id, {
          motivo: reportMotivo,
          detalhes: reportDetalhes.trim() || undefined,
        });
        toast.success("Denúncia da obra enviada para a fila de moderação.");
      } else if (reportTarget.commentId) {
        await WorkService.reportComment(work.id, reportTarget.commentId, {
          motivo: reportMotivo,
          detalhes: reportDetalhes.trim() || undefined,
        });
        toast.success("Denúncia de comentário registrada para avaliação da curadoria.");
      }
      setReportTarget(null);
      setReportDetalhes("");
    } catch (err: any) {
      toast.error(err, "Não foi possível registrar a denúncia");
    } finally {
      setIsSubmittingReport(false);
    }
  };

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
            </div>

            {/* Ações: Incorporar, Propor Edição e Reportar */}
            <div className={styles.actionsRow}>
              {shelfItem ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/minha-estante/${shelfItem.id}`)}
                  title="Abrir detalhes pessoais desta obra na sua estante"
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
                title="Propor alteração ou correção nos metadados globais da obra"
              >
                <GitPullRequest size={16} />
                <span>Propor Sugestão de Edição</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setReportMotivo("DADOS_FALSOS_OU_DUPLICADOS");
                  setReportTarget({ type: "WORK" });
                }}
                title="Reportar problema ou duplicidade nesta obra à moderação"
              >
                <Flag size={15} />
                <span>Reportar Obra</span>
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
          Sinopse & Ficha Técnica
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "COMENTARIOS"}
          className={`${styles.tabBtn} ${activeTab === "COMENTARIOS" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("COMENTARIOS")}
        >
          Comentários da Comunidade ({comments.length})
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
                <span className={styles.techLabel}>Status no Catálogo</span>
                <span className={styles.techValue}>{work.statusCatalogo || "OFICIAL"}</span>
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

          <WorkTagsSection obraId={work.id} obraTitulo={work.tituloPrincipal} />
        </section>
      )}

      {/* Aba: Comentários Reais da Comunidade */}
      {activeTab === "COMENTARIOS" && (
        <section className={styles.contentCard}>
          <div>
            <h2 className={styles.sectionTitle}>Comentários e Avaliações da Comunidade</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Compartilhe sua análise sobre {work.tituloPrincipal}. Marque a opção de spoiler caso mencione eventos importantes do enredo.
            </p>
          </div>

          <form onSubmit={handleCreateComment} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={
                isAuthenticated
                  ? "Escreva seu comentário sobre esta obra..."
                  : "Faça login na sua conta para participar das discussões..."
              }
              rows={3}
              disabled={!isAuthenticated || isSubmittingComment}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--text-xs)", color: "var(--text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newCommentSpoiler}
                  onChange={(e) => setNewCommentSpoiler(e.target.checked)}
                  disabled={!isAuthenticated}
                />
                <span>Este comentário contém spoilers do enredo</span>
              </label>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingComment} disabled={!isAuthenticated || !newCommentText.trim()}>
                <Send size={14} />
                <span>Publicar Comentário</span>
              </Button>
            </div>
          </form>

          {comments.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              <MessageSquare size={28} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
              <div>Nenhum comentário publicado ainda. Seja o primeiro a comentar!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {comments.map((c) => {
                const isSpoilerHidden = c.contemSpoiler && !revealedSpoilers[c.id];
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Link
                          to={`/leitor/${c.autorApelido}`}
                          style={{ fontSize: "var(--text-sm)", color: "var(--brand-primary)", fontWeight: 700, textDecoration: "none" }}
                        >
                          @{c.autorApelido}
                        </Link>
                        {c.contemSpoiler && <Badge variant="warning">Spoiler</Badge>}
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                          {new Date(c.dataCriacao).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportMotivo("SPOILER_NO_TITULO_OU_CAPA");
                            setReportTarget({ type: "COMMENT", commentId: c.id });
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "var(--text-xs)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                          title="Denunciar comentário à moderação"
                        >
                          <Flag size={12} />
                          <span>Denunciar</span>
                        </button>
                      )}
                    </div>

                    {isSpoilerHidden ? (
                      <button
                        type="button"
                        onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [c.id]: true }))}
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px dashed var(--border-strong)",
                          background: "var(--bg-surface)",
                          color: "var(--text-secondary)",
                          fontSize: "var(--text-xs)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          alignSelf: "flex-start",
                        }}
                      >
                        <Eye size={14} />
                        <span>Comentário oculto por conter spoiler — Clique para revelar</span>
                      </button>
                    ) : (
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", whiteSpace: "pre-line", margin: 0 }}>
                        {c.texto}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modal de Denúncia (Obra ou Comentário) */}
      <Modal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title={reportTarget?.type === "WORK" ? "Reportar Obra à Moderação" : "Denunciar Comentário"}
      >
        <form onSubmit={handleConfirmReport} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-secondary)" }}>
              Motivo da Denúncia
            </label>
            <select
              value={reportMotivo}
              onChange={(e) => setReportMotivo(e.target.value)}
              style={{
                padding: "0.65rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
              }}
            >
              <option value="DADOS_FALSOS_OU_DUPLICADOS">Dados Falsos ou Obra Duplicada</option>
              <option value="SPOILER_NO_TITULO_OU_CAPA">Spoiler sem Aviso</option>
              <option value="CONTEUDO_IMPROPRIO">Conteúdo Impróprio / Ofensivo</option>
              <option value="SPAM">Spam ou Propaganda</option>
              <option value="OUTRO">Outro Motivo</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-secondary)" }}>
              Detalhes Adicionais (Opcional)
            </label>
            <textarea
              value={reportDetalhes}
              onChange={(e) => setReportDetalhes(e.target.value)}
              rows={3}
              placeholder="Descreva brevemente o problema para auxiliar os moderadores..."
              style={{
                padding: "0.65rem 0.75rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => setReportTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingReport}>
              Enviar para Moderação
            </Button>
          </div>
        </form>
      </Modal>

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

      {/* Modal de Proposta de Sugestão de Edição (Estilo Git PR) */}
      {isSuggestModalOpen && work && (
        <SuggestEditModal
          work={work}
          isOpen={isSuggestModalOpen}
          onClose={() => setIsSuggestModalOpen(false)}
        />
      )}
    </div>
  );
};
