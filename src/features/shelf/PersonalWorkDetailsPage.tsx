import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./PersonalWorkDetailsPage.module.css";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import {
  StatusBadge,
  UnlinkedBadge,
  NewChaptersNotificationBadge,
} from "./components/ShelfBadges";
import { ShelfCloseCycleModal } from "./components/ShelfCloseCycleModal";
import { CatalogService } from "../../services/catalog.service";
import { ReadingStatusSelect, getReadingStatusLabel } from "../../components/ui/ReadingStatusSelect";
import type { ItemCatalogoResponse, StatusLeitura } from "../../types/catalog.types";
import { toast } from "../../store/toastStore";
import {
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Shield,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
  Copy,
  Trash2,
  Unlink,
  Eye,
  EyeOff,
  History,
  FileText,
  Star,
  Check,
  Edit,
  Sparkles,
  GitPullRequest,
  Compass,
  X,
} from "lucide-react";
import { WorkService } from "../../services/work.service";
import { SuggestEditModal } from "../catalog/components/SuggestEditModal";
import type { ObraResponse } from "../../types/work.types";

export const PersonalWorkDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ItemCatalogoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scrubber & fine-tuning state
  const [chapterInput, setChapterInput] = useState<number>(0);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<"cycles" | "notes">("cycles");

  // Privacy veil for notes
  const [showNotesContent, setShowNotesContent] = useState(true);

  // Modal de conclusão de ciclo
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  // Edição rápida de URL
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  // Suggest Edit modal (PR global)
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [globalWorkData, setGlobalWorkData] = useState<ObraResponse | null>(null);

  // ===================================================================
  // MODO DE EDIÇÃO INTEGRADO DA PÁGINA (Requisitos 2.2, 5.1 e 5.2)
  // ===================================================================
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Campos de Metadados da Obra
  const [editTitulo, setEditTitulo] = useState("");
  const [editCapaUrl, setEditCapaUrl] = useState("");
  const [editTipoObra, setEditTipoObra] = useState("MANGA");
  const [editTotalCapitulos, setEditTotalCapitulos] = useState<number | "">("");
  const [editTotalVolumes, setEditTotalVolumes] = useState<number | "">("");

  // Campos de Dados Pessoais de Leitura
  const [editStatusLeitura, setEditStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [editProgressoAtual, setEditProgressoAtual] = useState<number>(0);
  const [editVolumeAtual, setEditVolumeAtual] = useState<number | "">("");
  const [editAvaliacaoPessoal, setEditAvaliacaoPessoal] = useState<number>(0);
  const [editAnotacao, setEditAnotacao] = useState("");
  const [editUrlLeitura, setEditUrlLeitura] = useState("");
  const [editSincronizarMetadados, setEditSincronizarMetadados] = useState(true);

  const handleEnterEditMode = () => {
    if (!item) return;
    setEditTitulo(item.titulo || item.obraTitulo || "");
    setEditCapaUrl(item.capaUrl || item.obraCapaUrl || "");
    setEditTipoObra(item.tipoObra || "MANGA");
    setEditTotalCapitulos(item.totalCapitulos !== undefined ? item.totalCapitulos : (item.obraTotalCapitulos ?? ""));
    setEditTotalVolumes(item.totalVolumes !== undefined ? item.totalVolumes : (item.obraTotalVolumes ?? ""));
    setEditStatusLeitura(item.statusLeitura || "LENDO");
    setEditProgressoAtual(item.progressoAtual || 0);
    setEditVolumeAtual(item.volumeAtual ?? "");
    setEditAvaliacaoPessoal(item.avaliacaoPessoal || 0);
    const lastNote = item.historicosLeitura?.find((h) => h.anotacao)?.anotacao || "";
    setEditAnotacao(lastNote);
    setEditUrlLeitura(item.urlLeitura || "");
    setEditSincronizarMetadados(item.sincronizarMetadados !== false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveFullEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!item) return;

    const cleanTitulo = editTitulo.trim();
    if (!cleanTitulo) {
      toast.warning("O título da obra não pode ficar em branco.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const updated = await CatalogService.updatePersonalWork(item.id, {
        titulo: cleanTitulo,
        capaUrl: editCapaUrl.trim() || undefined,
        tipoObra: editTipoObra,
        totalCapitulos: typeof editTotalCapitulos === "number" ? editTotalCapitulos : undefined,
        totalVolumes: typeof editTotalVolumes === "number" ? editTotalVolumes : undefined,
        progressoAtual: editProgressoAtual,
        volumeAtual: typeof editVolumeAtual === "number" ? editVolumeAtual : undefined,
        statusLeitura: editStatusLeitura,
        avaliacaoPessoal: editAvaliacaoPessoal > 0 ? editAvaliacaoPessoal : undefined,
        anotacao: editAnotacao.trim() || undefined,
        urlLeitura: editUrlLeitura.trim() || undefined,
        sincronizarMetadados: editSincronizarMetadados,
      });

      setItem(updated);
      setChapterInput(updated.progressoAtual || 0);
      setTempUrl(updated.urlLeitura || "");
      setIsEditing(false);
      toast.success("Edição salva com sucesso!", "Obra Atualizada");
    } catch (err: any) {
      toast.error(err?.message || "Falha ao salvar alterações da obra.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenSuggestModal = async () => {
    if (!item?.obraId) return;
    try {
      const w = await WorkService.getWorkById(item.obraId);
      setGlobalWorkData(w);
      setIsSuggestModalOpen(true);
    } catch {
      toast.error("Não foi possível carregar os metadados canônicos da obra.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    CatalogService.getCatalogItem(Number(id))
      .then((data) => {
        if (!isMounted) return;
        setItem(data);
        setChapterInput(data.progressoAtual || 0);
        setTempUrl(data.urlLeitura || "");
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err?.message || "Não foi possível carregar os detalhes desta obra na sua estante.");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className={styles.pageContainer} style={{ alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Carregando dados da sua estante pessoal...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.headerNav}>
          <Link to="/minha-estante" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} />
              <span>Voltar à Minha Estante</span>
            </Button>
          </Link>
        </div>
        <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--accent-red)" }}>
          <p>{error || "Obra não encontrada em sua estante."}</p>
        </div>
      </div>
    );
  }

  const tituloExibido = item.titulo || item.obraTitulo;
  const capaExibida = item.capaUrl || item.obraCapaUrl;
  const totalCaps = item.totalCapitulos !== undefined ? item.totalCapitulos : item.obraTotalCapitulos;
  const totalVols = item.totalVolumes !== undefined ? item.totalVolumes : item.obraTotalVolumes;
  const hasTotalCap = totalCaps !== undefined && totalCaps > 0;
  const percentCap = hasTotalCap
    ? Math.min(100, Math.round(((chapterInput || 0) / (totalCaps || 1)) * 100))
    : 0;

  // Actions
  const handleQuickIncrement = async () => {
    if (!item) return;
    try {
      const nextCap = (item.progressoAtual || 0) + 1;
      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: nextCap,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura === "PLANEJADO" ? "LENDO" : item.statusLeitura,
      });
      setItem(updated);
      setChapterInput(nextCap);
      toast.success(`Avançado para o capítulo ${nextCap}!`, "Progresso Atualizado");
    } catch (err: any) {
      toast.error(err, "Falha ao Avançar Capítulo");
    }
  };

  const handleSaveProgress = async () => {
    if (!item) return;
    try {
      setIsSavingProgress(true);
      const totalCaps = item.totalCapitulos !== undefined ? item.totalCapitulos : item.obraTotalCapitulos;
      let finalStatus = item.statusLeitura;

      if (totalCaps && totalCaps > 0 && chapterInput >= totalCaps && finalStatus === "LENDO") {
        finalStatus = "TERMINOU";
      }

      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: chapterInput,
        volumeAtual: item.volumeAtual,
        statusLeitura: finalStatus,
      });
      setItem(updated);
      toast.success(
        finalStatus === "TERMINOU" && item.statusLeitura !== "TERMINOU"
          ? `Parabéns! Obra concluída no capítulo ${chapterInput} e ciclo registrado automaticamente.`
          : `Capítulo ${chapterInput} salvo na sua estante.`,
        "Progresso Atualizado"
      );
    } catch (err: any) {
      toast.error(err, "Falha ao Salvar Progresso");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleSyncMeta = async () => {
    if (!item) return;
    try {
      const updated = await CatalogService.atualizarMetaCapitulos(item.id);
      setItem(updated);
      toast.success("Metadados sincronizados com sucesso!", "Sincronização Concluída");
    } catch (err: any) {
      toast.error(err, "Falha na Sincronização");
    }
  };

  const handleToggleUnlink = async () => {
    if (!item) return;
    try {
      if (item.desvinculado) {
        if (item.obraId) {
          const updated = await CatalogService.vincularObra(item.id, item.obraId, true);
          setItem(updated);
          toast.success("Obra revinculada ao catálogo global com sucesso!");
        } else {
          toast.info("Esta obra foi criada manualmente e não possui identificador global para revinculação.");
        }
      } else {
        const updated = await CatalogService.desvincularObra(item.id);
        setItem(updated);
        toast.success("Obra desvinculada. Agora é 100% autônoma e local!");
      }
    } catch (err: any) {
      toast.error(err, "Erro ao alterar vínculo");
    }
  };

  const handleRemove = async () => {
    if (!item) return;
    if (window.confirm(`Tem certeza que deseja remover "${tituloExibido}" da sua estante? Esta ação é irreversível.`)) {
      try {
        await CatalogService.removeItemFromShelf(item.id);
        toast.success("Obra removida da sua estante.", "Removido");
        navigate("/minha-estante");
      } catch (err: any) {
        toast.error(err, "Falha ao Remover");
      }
    }
  };

  const handleUpdateRating = async (rating: number) => {
    if (!item) return;
    try {
      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: item.progressoAtual,
        volumeAtual: item.volumeAtual,
        nota: rating,
        statusLeitura: item.statusLeitura,
      });
      setItem(updated);
      toast.success(`Avaliação pessoal definida para ${rating} estrelas!`);
    } catch (err: any) {
      toast.error(err, "Falha ao atualizar nota");
    }
  };

  const handleStatusChange = async (newStatus: StatusLeitura) => {
    if (!item) return;
    try {
      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: item.progressoAtual,
        volumeAtual: item.volumeAtual,
        statusLeitura: newStatus,
      });
      setItem(updated);
      toast.success(`Status atualizado para "${getReadingStatusLabel(newStatus)}"!`);
    } catch (err: any) {
      toast.error(err, "Falha ao mudar status");
    }
  };

  const handleSaveUrl = async () => {
    if (!item) return;
    try {
      const updated = await CatalogService.updatePersonalWork(item.id, {
        urlLeitura: tempUrl.trim(),
      });
      setItem({ ...updated, urlLeitura: tempUrl.trim() });
      setIsEditingUrl(false);
      toast.success("URL privada de leitura atualizada!");
    } catch (err: any) {
      toast.error(err, "Falha ao salvar URL");
    }
  };

  const copyUrlToClipboard = () => {
    if (item.urlLeitura) {
      navigator.clipboard.writeText(item.urlLeitura);
      toast.success("URL copiada para a área de transferência!");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.ambientGlowPrimary} />
      <div className={styles.ambientGlowSecondary} />

      {/* 1. Header Navigation & Breadcrumbs */}
      <div className={styles.headerNav}>
        <div className={styles.breadcrumbRow}>
          <nav className={styles.breadcrumbs}>
            <Link to="/minha-estante" className={styles.breadcrumbLink}>
              Minha Estante
            </Link>
            <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            <span className={styles.breadcrumbLink}>
              {item.tipoObra || "Obra"}
            </span>
            <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            <span className={styles.breadcrumbCurrent} title={tituloExibido}>
              {tituloExibido}
            </span>
          </nav>

          <div className={styles.privacyBadge}>
            <Shield size={13} />
            <span>Área Privada • Isolamento Local</span>
          </div>
        </div>

        {/* Action Top Bar */}
        <div className={styles.actionTopBar}>
          <div className={styles.instanceStatus}>
            <div className={styles.statusIndicatorDot} />
            <span>Sessão Local Ativa • Criptografia e Privacidade do Usuário</span>
          </div>

          <div className={styles.actionButtonGroup}>
            {isEditing ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                  <X size={14} />
                  <span>Cancelar</span>
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleSaveFullEdit()} isLoading={isSavingEdit}>
                  <Check size={14} />
                  <span>Salvar Alterações</span>
                </Button>
              </>
            ) : (
              <>
                {item.urlLeitura ? (
                  <a
                    href={item.urlLeitura}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <Button variant="primary" size="sm">
                      <BookOpen size={14} />
                      <span>Abrir Leitor Privado (Cap. {item.progressoAtual})</span>
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditingUrl(true)}
                  >
                    <BookOpen size={14} />
                    <span>Configurar Leitor Privado</span>
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleQuickIncrement}
                  title="Avançar 1 capítulo instantaneamente"
                >
                  <Plus size={14} />
                  <span>+1 Cap</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEnterEditMode}
                  title="Entrar no modo completo de edição de metadados e dados pessoais"
                >
                  <Edit size={14} />
                  <span>Editar Obra</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSyncMeta}
                  title="Sincronizar metadados e novos capítulos lançados"
                >
                  <RefreshCw size={14} />
                  <span>Sincronizar Metadados</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleUnlink}
                  title={item.desvinculado ? "Reconectar ao catálogo global" : "Desvincular e tornar puramente autônomo"}
                >
                  <Unlink size={14} />
                  <span>{item.desvinculado ? "Vincular Global" : "Desvincular"}</span>
                </Button>

                {item.obraId && !item.desvinculado && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenSuggestModal}
                    title="Propor alteração nos metadados globais da obra (estilo Git PR)"
                  >
                    <GitPullRequest size={14} />
                    <span>Propor Sugestão Global</span>
                  </Button>
                )}

                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  title="Remover definitivamente da minha estante"
                >
                  <Trash2 size={14} />
                  <span>Remover</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================
       * MODO DE EDIÇÃO INTEGRADO DA PÁGINA (Requisitos 2.2, 5.1 e 5.2)
       * =================================================================== */}
      {isEditing ? (
        <form onSubmit={handleSaveFullEdit} className={styles.editContainer}>
          <div className={styles.editHeader}>
            <div className={styles.editTitleGroup}>
              <Edit size={22} style={{ color: "var(--brand-primary)" }} />
              <div>
                <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Modo de Edição da Obra
                </h2>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                  Altere múltiplos campos da obra e salve tudo em uma única operação.
                </span>
              </div>
            </div>

            <div className={styles.editActions}>
              <Button type="button" variant="secondary" size="sm" onClick={handleCancelEdit}>
                <X size={14} />
                <span>Cancelar</span>
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingEdit}>
                <Check size={14} />
                <span>Salvar Alterações</span>
              </Button>
            </div>
          </div>

          <div className={styles.editSectionsGrid}>
            {/* SEÇÃO 1: METADADOS DA OBRA */}
            <div className={styles.editCard}>
              <h3 className={styles.editCardTitle}>
                <Compass size={18} style={{ color: "var(--brand-primary)" }} />
                <span>Metadados da Obra</span>
              </h3>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>Título da Obra *</label>
                <input
                  type="text"
                  required
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className={styles.editInput}
                  placeholder="Nome oficial ou personalizado da obra"
                />
              </div>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>URL da Imagem de Capa</label>
                <input
                  type="url"
                  value={editCapaUrl}
                  onChange={(e) => setEditCapaUrl(e.target.value)}
                  className={styles.editInput}
                  placeholder="https://exemplo.com/capa.jpg"
                />
                {editCapaUrl.trim() && (
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <img
                      src={editCapaUrl.trim()}
                      alt="Preview da capa"
                      style={{ width: 44, height: 64, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>Pré-visualização da capa</span>
                  </div>
                )}
              </div>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>Formato Literário</label>
                <select
                  value={editTipoObra}
                  onChange={(e) => setEditTipoObra(e.target.value)}
                  className={styles.editSelect}
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

              <div className={styles.editTwoCols}>
                <div className={styles.editFieldGroup}>
                  <label className={styles.editLabel}>Total de Capítulos</label>
                  <input
                    type="number"
                    min="0"
                    value={editTotalCapitulos}
                    onChange={(e) => setEditTotalCapitulos(e.target.value ? Number(e.target.value) : "")}
                    className={styles.editInput}
                    placeholder="Ex: 120"
                  />
                </div>
                <div className={styles.editFieldGroup}>
                  <label className={styles.editLabel}>Total de Volumes</label>
                  <input
                    type="number"
                    min="0"
                    value={editTotalVolumes}
                    onChange={(e) => setEditTotalVolumes(e.target.value ? Number(e.target.value) : "")}
                    className={styles.editInput}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DADOS PESSOAIS DE LEITURA */}
            <div className={styles.editCard}>
              <h3 className={styles.editCardTitle}>
                <Shield size={18} style={{ color: "var(--accent-rose)" }} />
                <span>Dados Pessoais de Leitura (Privados)</span>
              </h3>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>Status de Leitura</label>
                <ReadingStatusSelect
                  value={editStatusLeitura}
                  onChange={setEditStatusLeitura}
                />
              </div>

              <div className={styles.editTwoCols}>
                <div className={styles.editFieldGroup}>
                  <label className={styles.editLabel}>Capítulo Atual Lido</label>
                  <input
                    type="number"
                    min="0"
                    value={editProgressoAtual}
                    onChange={(e) => setEditProgressoAtual(Number(e.target.value))}
                    className={styles.editInput}
                  />
                </div>
                <div className={styles.editFieldGroup}>
                  <label className={styles.editLabel}>Volume Atual Lido</label>
                  <input
                    type="number"
                    min="0"
                    value={editVolumeAtual}
                    onChange={(e) => setEditVolumeAtual(e.target.value ? Number(e.target.value) : "")}
                    className={styles.editInput}
                    placeholder="Ex: 1"
                  />
                </div>
              </div>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>Sua Avaliação (1 a 10 estrelas)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.2rem" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`${styles.starBtn} ${editAvaliacaoPessoal >= star ? styles.starActive : ""}`}
                      onClick={() => setEditAvaliacaoPessoal(star === editAvaliacaoPessoal ? 0 : star)}
                      title={`Nota ${star}`}
                    >
                      <Star size={18} fill={editAvaliacaoPessoal >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                    {editAvaliacaoPessoal > 0 ? `${editAvaliacaoPessoal}/10` : "Sem avaliação"}
                  </span>
                </div>
              </div>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>Anotação Pessoal / Reflexão de Leitura</label>
                <textarea
                  rows={3}
                  value={editAnotacao}
                  onChange={(e) => setEditAnotacao(e.target.value)}
                  className={styles.editTextarea}
                  placeholder="Impressões sobre os últimos capítulos, teorias ou anotações particulares..."
                />
              </div>

              <div className={styles.editFieldGroup}>
                <label className={styles.editLabel}>URL Privada de Leitura</label>
                <input
                  type="url"
                  value={editUrlLeitura}
                  onChange={(e) => setEditUrlLeitura(e.target.value)}
                  className={styles.editInput}
                  placeholder="https://seu-leitor-privado.local/obra/..."
                />
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Isolada e confidencial — jamais compartilhada publicamente.
                </span>
              </div>

              {/* Sincronização de Metadados Toggle Individual */}
              <label className={styles.toggleSwitchRow}>
                <input
                  type="checkbox"
                  checked={editSincronizarMetadados}
                  onChange={(e) => setEditSincronizarMetadados(e.target.checked)}
                  style={{ marginTop: "0.2rem" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-primary)" }}>
                    Sincronizar Metadados com o Catálogo Global
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Quando ligado, notificações de novos capítulos serão sugeridas. Desativar não apaga seus dados locais nem histórico.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <Button type="button" variant="secondary" size="md" onClick={handleCancelEdit}>
              <X size={16} />
              <span>Cancelar</span>
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSavingEdit}>
              <Check size={16} />
              <span>Salvar Alterações</span>
            </Button>
          </div>
        </form>
      ) : (
        /* ===================================================================
         * MODO DE VISUALIZAÇÃO MINIMALISTA (Requisito 2.2)
         * =================================================================== */
        <>
          {/* 2. Hero Card */}
          <div className={styles.heroCard}>
            <div className={styles.coverContainer}>
              <div className={styles.coverWrapper}>
                {capaExibida ? (
                  <img
                    src={capaExibida}
                    alt={tituloExibido}
                    className={styles.coverImage}
                  />
                ) : (
                  <div className={styles.coverPlaceholder}>
                    <BookOpen size={36} />
                    <span>Sem Capa</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.heroContent}>
              <div className={styles.titleArea}>
                <div className={styles.titleHeaderRow}>
                  <h1 className={styles.workTitle}>{tituloExibido}</h1>
                  {item.volumeAtual !== undefined && (
                    <span className={styles.percentPill}>
                      Vol. {item.volumeAtual}{totalVols ? ` / ${totalVols}` : ""} em andamento
                    </span>
                  )}
                </div>

                <div className={styles.badgesRow}>
                  <StatusBadge status={item.statusLeitura} />
                  {item.desvinculado && <UnlinkedBadge />}
                  {item.temNovosCapitulos && (
                    <NewChaptersNotificationBadge onUpdateMeta={handleSyncMeta} />
                  )}
                </div>

                <div className={styles.authorMeta}>
                  <span>{item.tipoObra || "Obra"}</span>
                  {item.obraId && (
                    <>
                      <span>•</span>
                      <Link
                        to={`/catalogo/${item.obraId}`}
                        style={{ color: "var(--brand-primary)", textDecoration: "none" }}
                      >
                        Ver ficha no Catálogo Global
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Scrubber Module */}
              <div className={styles.scrubberCard}>
                <div className={styles.scrubberHeader}>
                  <div className={styles.chapterMetric}>
                    <span className={styles.chapterLabel}>Capítulo Atual:</span>
                    <span className={styles.chapterNumber}>{chapterInput}</span>
                    <span className={styles.chapterTotal}>
                      {hasTotalCap ? `/ ${totalCaps} capítulos` : "capítulos lidos"}
                    </span>
                  </div>

                  {hasTotalCap && (
                    <span className={styles.percentPill}>{percentCap}% concluído</span>
                  )}
                </div>

                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${percentCap}%` }}
                  />
                </div>

                <div className={styles.scrubberControls}>
                  <div className={styles.chapterAdjustGroup}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setChapterInput((prev) => Math.max(0, prev - 1))}
                      title="Diminuir 1 capítulo"
                    >
                      <Minus size={14} />
                    </Button>

                    <div className={styles.chapterInputWrapper}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cap.</span>
                      <input
                        type="number"
                        min="0"
                        max={totalCaps || 9999}
                        value={chapterInput}
                        onChange={(e) => setChapterInput(Number(e.target.value))}
                        className={styles.chapterInput}
                      />
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setChapterInput((prev) => prev + 1)}
                      title="Aumentar 1 capítulo"
                    >
                      <Plus size={14} />
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveProgress}
                      isLoading={isSavingProgress}
                    >
                      <Check size={14} />
                      <span>Salvar Progresso</span>
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCycleModalOpen(true)}
                  >
                    <Sparkles size={14} />
                    <span>Concluir Ciclo de Leitura</span>
                  </Button>
                </div>
              </div>

              {/* Private Reader URL Block */}
              <div className={styles.readerUrlBlock}>
                <div className={styles.readerUrlInfo}>
                  <div className={styles.urlIconBox}>
                    <ExternalLink size={18} />
                  </div>
                  <div className={styles.urlDetails}>
                    {isEditingUrl ? (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                          type="url"
                          value={tempUrl}
                          onChange={(e) => setTempUrl(e.target.value)}
                          placeholder="https://seu-leitor-privado.local/obra/..."
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-subtle)",
                            background: "var(--bg-surface-elevated)",
                            color: "var(--text-primary)",
                            fontSize: "var(--font-size-xs)",
                            width: "280px",
                          }}
                        />
                        <Button variant="primary" size="sm" onClick={handleSaveUrl}>
                          Salvar
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsEditingUrl(false)}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.urlText}>
                          {item.urlLeitura || "Nenhuma URL privada de leitura configurada"}
                        </span>
                        <span className={styles.urlSubtext}>
                          Privacidade Garantida — Jamais compartilhada publicamente ou exposta a terceiros.
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {!isEditingUrl && item.urlLeitura && (
                  <div className={styles.urlActions}>
                    <Button variant="secondary" size="sm" onClick={copyUrlToClipboard}>
                      <Copy size={13} />
                      <span>Copiar</span>
                    </Button>
                    <a
                      href={item.urlLeitura}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none" }}
                    >
                      <Button variant="secondary" size="sm">
                        <ExternalLink size={13} />
                        <span>Acessar</span>
                      </Button>
                    </a>
                    <Button variant="secondary" size="sm" onClick={() => setIsEditingUrl(true)}>
                      <Edit size={13} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Main Workspace Grid */}
          <div className={styles.workspaceGrid}>
            {/* Left Column: Cycles & Notes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Tab Navigation */}
              <div className={styles.tabNavHeader}>
                <div className={styles.tabsList}>
                  <button
                    className={`${styles.tabBtn} ${activeTab === "cycles" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("cycles")}
                  >
                    <History size={15} />
                    <span>Ciclos &amp; Histórico</span>
                    <span className={styles.tabBadge}>
                      {item.historicosLeitura?.length || 0}
                    </span>
                  </button>

                  <button
                    className={`${styles.tabBtn} ${activeTab === "notes" ? styles.tabBtnActive : ""}`}
                    onClick={() => setActiveTab("notes")}
                  >
                    <FileText size={15} />
                    <span>Anotações Privadas</span>
                  </button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCycleModalOpen(true)}
                >
                  <Plus size={13} />
                  <span>Registrar Ciclo</span>
                </Button>
              </div>

              {/* Tab Content: Cycles */}
              {activeTab === "cycles" && (
                <div className={styles.tabContentCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      <History size={18} style={{ color: "var(--brand-primary)" }} />
                      <span>Histórico de Ciclos de Leitura</span>
                    </h2>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                      {item.historicosLeitura?.length || 0} ciclo(s) registrado(s)
                    </span>
                  </div>

                  {item.historicosLeitura && item.historicosLeitura.length > 0 ? (
                    <div className={styles.cyclesList}>
                      {item.historicosLeitura.map((h, idx) => (
                        <div
                          key={h.id || idx}
                          className={`${styles.cycleItem} ${idx === 0 ? styles.cycleItemActive : ""}`}
                        >
                          <div className={styles.cycleHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Badge variant="brand">
                                {idx === 0 ? "Último Registro" : `Ciclo #${item.historicosLeitura.length - idx}`}
                              </Badge>
                              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                Cap. {h.capituloLido || (h as any).capituloFinal || item.progressoAtual}
                              </span>
                            </div>

                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {h.dataLeitura ? new Date(h.dataLeitura).toLocaleDateString("pt-BR") : "Data não informada"}
                            </span>
                          </div>

                          <div className={styles.cycleStatsGrid}>
                            <div className={styles.cycleStatCol}>
                              <span className={styles.cycleStatLabel}>Capítulo</span>
                              <span className={styles.cycleStatValue}>{h.capituloLido || (h as any).capituloFinal}</span>
                            </div>
                            <div className={styles.cycleStatCol}>
                              <span className={styles.cycleStatLabel}>Volume</span>
                              <span className={styles.cycleStatValue}>{h.volumeLido || "-"}</span>
                            </div>
                            <div className={styles.cycleStatCol}>
                              <span className={styles.cycleStatLabel}>Avaliação</span>
                              <span className={styles.cycleStatValue} style={{ color: "var(--accent-amber)" }}>
                                {h.notaMomento ? `${h.notaMomento} ★` : "-"}
                              </span>
                            </div>
                            <div className={styles.cycleStatCol}>
                              <span className={styles.cycleStatLabel}>Data</span>
                              <span className={styles.cycleStatValue}>
                                {h.dataLeitura ? new Date(h.dataLeitura).toLocaleDateString("pt-BR") : "-"}
                              </span>
                            </div>
                          </div>

                          {h.anotacao && (
                            <div className={styles.cycleNotes}>
                              {h.anotacao}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                      <History size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
                      <p>Nenhum ciclo de releitura finalizado até o momento.</p>
                      <p style={{ fontSize: "var(--font-size-xs)" }}>
                        Quando você terminar de ler ou quiser registrar uma releitura, clique em "Concluir Ciclo de Leitura".
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Notes */}
              {activeTab === "notes" && (
                <div className={styles.tabContentCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      <FileText size={18} style={{ color: "var(--brand-primary)" }} />
                      <span>Anotações &amp; Citações Privadas</span>
                    </h2>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowNotesContent((prev) => !prev)}
                      title="Ocultar/Exibir anotações para evitar spoilers ou privacidade de tela"
                    >
                      {showNotesContent ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showNotesContent ? "Ocultar Anotações" : "Revelar Anotações"}</span>
                    </Button>
                  </div>

                  <div className={styles.notesArea}>
                    <div className={styles.noteBox}>
                      <div className={styles.noteHeader}>
                        <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--text-primary)" }}>
                          Anotação de Leitura Pessoal
                        </span>
                        <Button variant="secondary" size="sm" onClick={handleEnterEditMode}>
                          <Edit size={12} />
                          <span>Editar</span>
                        </Button>
                      </div>

                      <div className={`${styles.noteContent} ${!showNotesContent ? styles.blurredContent : ""}`}>
                        {item.historicosLeitura?.find((h) => h.anotacao)?.anotacao ||
                          "Nenhuma anotação privada registrada. Clique em 'Editar Obra' para adicionar impressões, teorias ou citações importantes desta obra."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Personal Controls & Info */}
            <div className={styles.sidebarColumn}>
              {/* Status & Rating Card */}
              <div className={styles.sidebarCard}>
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Status da Minha Leitura
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                    Status Atual:
                  </label>
                  <ReadingStatusSelect
                    value={item.statusLeitura}
                    onChange={handleStatusChange}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                    Sua Avaliação Pessoal (1 a 10):
                  </label>
                  <div className={styles.ratingRow}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.starBtn} ${
                          (item.avaliacaoPessoal || 0) >= star ? styles.starActive : ""
                        }`}
                        onClick={() => handleUpdateRating(star)}
                        title={`Nota ${star}`}
                      >
                        <Star
                          size={15}
                          fill={(item.avaliacaoPessoal || 0) >= star ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                    {item.avaliacaoPessoal ? `Nota selecionada: ${item.avaliacaoPessoal}/10` : "Ainda não avaliado"}
                  </span>
                </div>
              </div>

              {/* Technical Metadata Card */}
              <div className={styles.sidebarCard}>
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Ficha da Estante
                </h3>

                <div className={styles.metaInfoTable}>
                  <div className={styles.metaInfoRow}>
                    <span className={styles.metaInfoKey}>Privacidade</span>
                    <span className={styles.metaInfoVal}>Estritamente Privada</span>
                  </div>
                  <div className={styles.metaInfoRow}>
                    <span className={styles.metaInfoKey}>Vínculo Global</span>
                    <span className={styles.metaInfoVal}>
                      {item.desvinculado ? "Autônomo (Desvinculado)" : "Vinculado ao Catálogo"}
                    </span>
                  </div>
                  <div className={styles.metaInfoRow}>
                    <span className={styles.metaInfoKey}>Sincronização</span>
                    <span className={styles.metaInfoVal}>
                      {item.sincronizarMetadados !== false ? "Ativa" : "Desativada"}
                    </span>
                  </div>
                  <div className={styles.metaInfoRow}>
                    <span className={styles.metaInfoKey}>Data de Adição</span>
                    <span className={styles.metaInfoVal}>
                      {item.dataAdicao ? new Date(item.dataAdicao).toLocaleDateString("pt-BR") : "-"}
                    </span>
                  </div>
                  <div className={styles.metaInfoRow}>
                    <span className={styles.metaInfoKey}>Última Atualização</span>
                    <span className={styles.metaInfoVal}>
                      {item.ultimaAtualizacao ? new Date(item.ultimaAtualizacao).toLocaleDateString("pt-BR") : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals de Ações Separadas */}
      {isCycleModalOpen && (
        <ShelfCloseCycleModal
          item={item}
          isOpen={isCycleModalOpen}
          onClose={() => setIsCycleModalOpen(false)}
          onCycleClosed={(updated) => {
            setItem(updated);
            setIsCycleModalOpen(false);
          }}
        />
      )}

      {isSuggestModalOpen && globalWorkData && (
        <SuggestEditModal
          work={globalWorkData}
          isOpen={isSuggestModalOpen}
          onClose={() => setIsSuggestModalOpen(false)}
        />
      )}
    </div>
  );
};
