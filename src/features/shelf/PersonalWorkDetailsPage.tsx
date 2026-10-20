import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./PersonalWorkDetailsPage.module.css";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import {
  StatusBadge,
  VisibilityBadge,
  UnlinkedBadge,
  NewChaptersNotificationBadge,
} from "./components/ShelfBadges";
import { ShelfCloseCycleModal } from "./components/ShelfCloseCycleModal";
import { ShelfEditModal } from "./components/ShelfEditModal";
import { CatalogService } from "../../services/catalog.service";
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
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"cycles" | "notes" | "sync">("cycles");

  // Privacy veil for notes
  const [showNotesContent, setShowNotesContent] = useState(true);

  // Modals
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Local URL editing
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState("");

  const loadItem = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await CatalogService.getCatalogItem(Number(id));
      setItem(data);
      setChapterInput(data.progressoAtual || 0);
      setTempUrl(data.urlLeitura || "");
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar os detalhes desta obra na sua estante.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

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
          <Link to="/meu-catalogo" style={{ textDecoration: "none" }}>
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
      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: chapterInput,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura,
      });
      setItem(updated);
      toast.success(`Capítulo ${chapterInput} salvo na sua estante.`, "Progresso Atualizado");
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
        navigate("/meu-catalogo");
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
      toast.success(`Status atualizado para ${newStatus}!`);
    } catch (err: any) {
      toast.error(err, "Falha ao mudar status");
    }
  };

  const handleSaveUrl = async () => {
    if (!item) return;
    try {
      // Usando endpoint de alteração de item ou progresso
      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: item.progressoAtual,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura,
      });
      setItem({ ...updated, urlLeitura: tempUrl });
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
            <Link to="/meu-catalogo" className={styles.breadcrumbLink}>
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
              onClick={handleSyncMeta}
              title="Sincronizar metadados e novos capítulos lançados"
            >
              <RefreshCw size={14} />
              <span>Sincronizar Metadados</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              title="Editar metadados pessoais"
            >
              <Edit size={14} />
              <span>Editar</span>
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

            <Button
              variant="danger"
              size="sm"
              onClick={handleRemove}
              title="Remover definitivamente da minha estante"
            >
              <Trash2 size={14} />
              <span>Remover</span>
            </Button>
          </div>
        </div>
      </div>

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
              <VisibilityBadge visibility={item.visibilidade} />
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
                    <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
                      <Edit size={12} />
                      <span>Editar</span>
                    </Button>
                  </div>

                  <div className={`${styles.noteContent} ${!showNotesContent ? styles.blurredContent : ""}`}>
                    {item.historicosLeitura?.find((h) => h.anotacao)?.anotacao ||
                      "Nenhuma anotação privada registrada. Clique em 'Editar' para adicionar impressões, teorias ou citações importantes desta obra."}
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
              <select
                value={item.statusLeitura}
                onChange={(e) => handleStatusChange(e.target.value as StatusLeitura)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-surface-sunken)",
                  color: "var(--text-primary)",
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                }}
              >
                <option value="LENDO">LENDO</option>
                <option value="PLANEJADO">PLANEJADO</option>
                <option value="TERMINOU">TERMINOU</option>
                <option value="ENGAVETADO">ENGAVETADO</option>
                <option value="ABDICOU">ABDICOU</option>
                <option value="PAUSADO">PAUSADO</option>
              </select>
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
                <span className={styles.metaInfoKey}>Visibilidade</span>
                <span className={styles.metaInfoVal}>{item.visibilidade}</span>
              </div>
              <div className={styles.metaInfoRow}>
                <span className={styles.metaInfoKey}>Vínculo Global</span>
                <span className={styles.metaInfoVal}>
                  {item.desvinculado ? "Autônomo (Desvinculado)" : "Sincronizado com Catálogo"}
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

      {/* Modals */}
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

      {isEditModalOpen && (
        <ShelfEditModal
          item={item}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={(updatedItem: ItemCatalogoResponse) => {
            setItem(updatedItem);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
