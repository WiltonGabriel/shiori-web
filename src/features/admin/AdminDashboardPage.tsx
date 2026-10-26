import React, { useEffect, useState, useMemo } from "react";
import styles from "./AdminDashboardPage.module.css";
import { AdminService } from "../../services/admin.service";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import { Avatar } from "../../components/ui/Avatar/Avatar";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { AdminHeader, type AdminTab } from "./components/AdminHeader";
import { AdminBroadcastsTab } from "./components/AdminBroadcastsTab";
import { AdminTagsTab } from "./components/AdminTagsTab";
import type {
  AdminDashboardResponse,
  ProvedorIntegracaoResponse,
  FeatureFlagResponse,
  SugestaoEdicaoResponse,
  DenunciaComentarioResponse,
  MesclarObrasResponse,
  GeneroResponse,
  AdminUsuarioResponse,
  RegistroAuditoriaResponse,
  BroadcastResponse,
} from "../../types/admin.types";
import {
  Users,
  BookOpen,
  Layers,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  GitMerge,
  FileQuestion,
  Server,
  ToggleLeft,
  RotateCcw,
  Tags,
  History,
  Plus,
  Search,
  AlertTriangle,
  Ban,
  ExternalLink,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export const AdminDashboardPage: React.FC = () => {
  useDocumentTitle(
    "Painel Administrativo | Shiori",
    "Gestão do acervo, curadoria de gêneros, moderação, strikes e auditoria do sistema."
  );

  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("DASHBOARD");

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoEdicaoResponse[]>([]);
  const [denuncias, setDenuncias] = useState<DenunciaComentarioResponse[]>([]);
  const [integrations, setIntegrations] = useState<ProvedorIntegracaoResponse[]>([]);
  const [flags, setFlags] = useState<FeatureFlagResponse[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastResponse[]>([]);
  const [generos, setGeneros] = useState<GeneroResponse[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUsuarioResponse[]>([]);
  const [auditorias, setAuditorias] = useState<RegistroAuditoriaResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Busca e Filtros da aba Usuários
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Modal de Criação de Gênero
  const [isNewGenreModalOpen, setIsNewGenreModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreDescription, setNewGenreDescription] = useState("");
  const [isCreatingGenre, setIsCreatingGenre] = useState(false);

  // Modal de Aplicação de Strike
  const [strikeTargetUser, setStrikeTargetUser] = useState<{ id: number; apelido: string } | null>(null);
  const [strikeReason, setStrikeReason] = useState("");
  const [isApplyingStrike, setIsApplyingStrike] = useState(false);

  // Formulário de Mesclagem de Obras
  const [obraDuplicadaId, setObraDuplicadaId] = useState<string>("");
  const [obraPrincipalId, setObraPrincipalId] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<MesclarObrasResponse | null>(null);

  // Carregamento inicial de métricas e filas
  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, sugRes, denRes, intRes, flagRes, broadRes] = await Promise.allSettled([
        AdminService.getDashboard(),
        AdminService.listPendingSuggestions(),
        AdminService.listOpenReports(),
        AdminService.listIntegrations(),
        AdminService.listFeatureFlags(),
        AdminService.listBroadcasts(),
      ]);

      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (sugRes.status === "fulfilled") setSugestoes(sugRes.value.content || []);
      if (denRes.status === "fulfilled") setDenuncias(denRes.value.content || []);
      if (intRes.status === "fulfilled") setIntegrations(intRes.value || []);
      if (flagRes.status === "fulfilled") setFlags(flagRes.value || []);
      if (broadRes.status === "fulfilled") setBroadcasts(broadRes.value.content || []);
    } catch (err: unknown) {
      toast.error(err, "Falha ao Carregar Dados Administrativos");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBroadcasts = async () => {
    try {
      setIsTabLoading(true);
      const res = await AdminService.listBroadcasts();
      setBroadcasts(res.content || []);
    } catch (err: unknown) {
      toast.error(err, "Falha ao Carregar Comunicados");
    } finally {
      setIsTabLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      setIsTabLoading(true);
      const data = await AdminService.listGenres();
      setGeneros(data);
    } catch (err: unknown) {
      toast.error(err, "Falha ao Carregar Gêneros");
    } finally {
      setIsTabLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsTabLoading(true);
      const res = await AdminService.listUsers(0, 50);
      setUsuarios(res.content || []);
    } catch (err: unknown) {
      toast.error(err, "Falha ao Carregar Usuários");
    } finally {
      setIsTabLoading(false);
    }
  };

  const loadAudits = async () => {
    try {
      setIsTabLoading(true);
      const res = await AdminService.listAuditLogs(0, 50);
      setAuditorias(res.content || []);
    } catch (err: unknown) {
      toast.error(err, "Falha ao Carregar Auditoria");
    } finally {
      setIsTabLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      AdminService.getDashboard(),
      AdminService.listPendingSuggestions(),
      AdminService.listOpenReports(),
      AdminService.listIntegrations(),
      AdminService.listFeatureFlags(),
      AdminService.listBroadcasts(),
    ]).then(([dashRes, sugRes, denRes, intRes, flagRes, broadRes]) => {
      if (!isMounted) return;
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (sugRes.status === "fulfilled") setSugestoes(sugRes.value.content || []);
      if (denRes.status === "fulfilled") setDenuncias(denRes.value.content || []);
      if (intRes.status === "fulfilled") setIntegrations(intRes.value || []);
      if (flagRes.status === "fulfilled") setFlags(flagRes.value || []);
      if (broadRes.status === "fulfilled") setBroadcasts(broadRes.value.content || []);
      setIsLoading(false);
    }).catch((err) => {
      if (!isMounted) return;
      toast.error(err, "Falha ao Carregar Dados Administrativos");
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Carregamento sob demanda das abas específicas
  useEffect(() => {
    let isMounted = true;
    if (activeTab === "GENEROS" && generos.length === 0) {
      AdminService.listGenres()
        .then((data) => {
          if (isMounted) setGeneros(data);
        })
        .catch((err) => {
          if (isMounted) toast.error(err, "Falha ao Carregar Gêneros");
        });
    } else if (activeTab === "USUARIOS" && usuarios.length === 0) {
      AdminService.listUsers(0, 50)
        .then((res) => {
          if (isMounted) setUsuarios(res.content || []);
        })
        .catch((err) => {
          if (isMounted) toast.error(err, "Falha ao Carregar Usuários");
        });
    } else if (activeTab === "AUDITORIA" && auditorias.length === 0) {
      AdminService.listAuditLogs(0, 50)
        .then((res) => {
          if (isMounted) setAuditorias(res.content || []);
        })
        .catch((err) => {
          if (isMounted) toast.error(err, "Falha ao Carregar Auditoria");
        });
    } else if (activeTab === "BROADCASTS" && broadcasts.length === 0) {
      AdminService.listBroadcasts()
        .then((res) => {
          if (isMounted) setBroadcasts(res.content || []);
        })
        .catch((err) => {
          if (isMounted) toast.error(err, "Falha ao Carregar Comunicados");
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab, generos.length, usuarios.length, auditorias.length, broadcasts.length]);

  // Handlers de Sugestão e Denúncia
  const handleEvaluateSuggestion = async (sugestaoId: number, aprovado: boolean) => {
    const parecer = prompt(
      aprovado
        ? "Parecer da aprovação (opcional):"
        : "Motivo da rejeição da sugestão:"
    );
    if (!aprovado && !parecer?.trim()) {
      toast.warning("Informe um motivo para rejeitar a sugestão.");
      return;
    }

    try {
      await AdminService.evaluateSuggestion(sugestaoId, aprovado, parecer?.trim() || undefined);
      toast.success(aprovado ? "Sugestão aprovada e incorporada ao catálogo!" : "Sugestão rejeitada com sucesso.");
      setSugestoes((prev) => prev.filter((s) => s.id !== sugestaoId));
    } catch (err: any) {
      toast.error(err, "Falha ao Avaliar Sugestão");
    }
  };

  const handleResolveReport = async (denunciaId: number, aceitar: boolean) => {
    const parecer = prompt(
      aceitar
        ? "Justificativa da moderação (comentário será removido):"
        : "Motivo do arquivamento da denúncia:"
    );

    try {
      if (aceitar) {
        await AdminService.acceptCommentReport(denunciaId, parecer?.trim() || undefined);
        toast.success("Denúncia aceita e conteúdo moderado com sucesso.");
      } else {
        await AdminService.rejectCommentReport(denunciaId, parecer?.trim() || undefined);
        toast.info("Denúncia rejeitada e arquivada.");
      }
      setDenuncias((prev) => prev.filter((d) => d.id !== denunciaId));
    } catch (err: any) {
      toast.error(err, "Falha ao Resolver Denúncia");
    }
  };

  // Handler de Gêneros
  const handleCreateGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) {
      toast.warning("O nome do gênero é obrigatório.");
      return;
    }

    try {
      setIsCreatingGenre(true);
      const created = await AdminService.createGenre({
        nome: newGenreName.trim(),
        descricao: newGenreDescription.trim() || undefined,
      });

      setGeneros((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      toast.success(`Gênero oficial '${created.nome}' cadastrado com sucesso!`);
      setIsNewGenreModalOpen(false);
      setNewGenreName("");
      setNewGenreDescription("");
    } catch (err: any) {
      toast.error(err, "Falha ao Cadastrar Gênero");
    } finally {
      setIsCreatingGenre(false);
    }
  };

  // Handlers de Moderação de Usuários (Strikes & Ban)
  const handleOpenStrikeModal = (userId: number, apelido: string, defaultReason = "") => {
    setStrikeTargetUser({ id: userId, apelido });
    setStrikeReason(defaultReason);
  };

  const handleConfirmStrike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strikeTargetUser) return;
    if (!strikeReason.trim()) {
      toast.warning("Informe a justificativa do strike.");
      return;
    }

    try {
      setIsApplyingStrike(true);
      const updatedUser = await AdminService.applyStrike(strikeTargetUser.id, strikeReason.trim());
      setUsuarios((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

      if (!updatedUser.ativo || updatedUser.strikes >= 3) {
        toast.error(`Strike aplicado! O usuário @${updatedUser.apelido} atingiu 3 strikes e foi banido automaticamente.`);
      } else {
        toast.warning(`Strike aplicado ao usuário @${updatedUser.apelido} (${updatedUser.strikes}/3 strikes).`);
      }

      setStrikeTargetUser(null);
      setStrikeReason("");
    } catch (err: any) {
      toast.error(err, "Falha ao Aplicar Strike");
    } finally {
      setIsApplyingStrike(false);
    }
  };

  const handleRemoveStrike = async (userId: number, apelido: string) => {
    const motivo = prompt(`Motivo do perdão / remoção de strike de @${apelido}:`);
    if (!motivo?.trim()) return;

    try {
      const updatedUser = await AdminService.removeStrike(userId, motivo.trim());
      setUsuarios((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      toast.info(`Strike removido com sucesso de @${apelido} (${updatedUser.strikes}/3 strikes).`);
    } catch (err: any) {
      toast.error(err, "Falha ao Remover Strike");
    }
  };

  const handleBanUser = async (userId: number, apelido: string) => {
    const motivo = prompt(`ATENÇÃO: Justificativa para banir permanentemente o usuário @${apelido}:`);
    if (!motivo?.trim()) return;

    try {
      await AdminService.banUser(userId, motivo.trim());
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ativo: false } : u))
      );
      toast.error(`Usuário @${apelido} banido do sistema.`);
    } catch (err: any) {
      toast.error(err, "Falha ao Banir Usuário");
    }
  };

  // Handler de Mesclagem
  const handleMergeWorks = async (e: React.FormEvent) => {
    e.preventDefault();
    const dupId = parseInt(obraDuplicadaId, 10);
    const princId = parseInt(obraPrincipalId, 10);

    if (isNaN(dupId) || isNaN(princId)) {
      toast.warning("Informe IDs numéricos válidos para ambas as obras.");
      return;
    }

    if (dupId === princId) {
      toast.warning("O ID da obra duplicada e da obra principal não podem ser idênticos.");
      return;
    }

    if (!window.confirm(`Confirma a mesclagem da obra #${dupId} na obra canônica #${princId}? Os itens de estante e históricos serão migrados.`)) {
      return;
    }

    try {
      setIsMerging(true);
      const res = await AdminService.mergeWorks({
        obraDuplicadaId: dupId,
        obraPrincipalId: princId,
      });

      setMergeResult(res);
      toast.success(res.mensagem || "Obras mescladas com sucesso!");
      setObraDuplicadaId("");
      setObraPrincipalId("");
    } catch (err: any) {
      toast.error(err, "Falha ao Mesclar Obras");
    } finally {
      setIsMerging(false);
    }
  };

  // Handlers de Integração e Flags
  const handleToggleIntegration = async (id: number, currentStatus: boolean) => {
    try {
      const updated = await AdminService.toggleIntegrationStatus(id, !currentStatus);
      setIntegrations((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(`Provedor ${updated.nomeExibicao} ${updated.ativo ? "ativado" : "desativado"}.`);
    } catch (err: any) {
      toast.error(err, "Falha ao Alterar Integração");
    }
  };

  const handleToggleFlag = async (chave: string, currentStatus: boolean) => {
    try {
      const updated = await AdminService.toggleFeatureFlag(chave, !currentStatus);
      setFlags((prev) => prev.map((f) => (f.chave === chave ? updated : f)));
      toast.info(`Flag '${updated.nome}' definida como ${updated.ativado ? "habilitada" : "desabilitada"}.`);
    } catch (err: any) {
      toast.error(err, "Falha ao Alterar Feature Flag");
    }
  };

  // Filtro de Usuários
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return usuarios;
    const term = userSearchTerm.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.apelido?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        String(u.id) === term
    );
  }, [usuarios, userSearchTerm]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "5rem 1rem", textAlign: "center" }}>
        <Spinner size="lg" />
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Carregando métricas e subsistemas administrativos...
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 1rem 5rem" }}>
      {/* Cabeçalho Dedicado com Navegação das 9 Abas de Governança e Administração */}
      <AdminHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          sugestoes: sugestoes.length,
          denuncias: denuncias.length,
          broadcasts: broadcasts.filter((b) => b.ativo).length,
          integracoes: integrations.length,
          flags: flags.length,
        }}
        onRefresh={loadAdminData}
        isRefreshing={isLoading}
      />

      {/* 1. Visão Geral / Dashboard */}
      {activeTab === "DASHBOARD" && dashboard && (
        <div className={styles.metricsGrid}>
          <Card className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "var(--brand-glow)", color: "var(--brand-light)" }}>
              <Users size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{dashboard.totalUsuarios}</div>
              <div className={styles.metricLabel}>{dashboard.totalUsuariosAtivos} leitores ativos</div>
            </div>
          </Card>

          <Card className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34D399" }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{dashboard.totalObras}</div>
              <div className={styles.metricLabel}>Obras catalogadas</div>
            </div>
          </Card>

          <Card className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber-light)" }}>
              <Layers size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{dashboard.totalItensEstante}</div>
              <div className={styles.metricLabel}>Itens em estantes de usuários</div>
            </div>
          </Card>

          <Card className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#F87171" }}>
              <AlertOctagon size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{dashboard.totalDenunciasComentariosPendentes}</div>
              <div className={styles.metricLabel}>Denúncias de comentários abertas</div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Sugestões de Edição Pendentes */}
      {activeTab === "SUGESTOES" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <FileQuestion size={18} />
            <span>Sugestões de Edição Comunitárias Pendentes</span>
          </h2>

          {sugestoes.length === 0 ? (
            <EmptyState
              icon={<FileQuestion size={28} />}
              title="Nenhuma sugestão pendente"
              description="Todas as sugestões de edição da comunidade já foram avaliadas."
            />
          ) : (
            <div className={styles.listCards}>
              {sugestoes.map((s) => (
                <Card key={s.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div>
                      <strong style={{ fontSize: "var(--text-base)" }}>Obra: {s.obraTitulo}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        Sugerido por @{s.usuarioSugeridorApelido || "Leitor"} em{" "}
                        {new Date(s.dataCriacao).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <Badge variant="warning">Pendente</Badge>
                  </div>

                  <div style={{ fontSize: "var(--text-xs)", background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    {s.tituloPrincipalSugerido && (
                      <div><strong>Título Sugerido:</strong> {s.tituloPrincipalSugerido}</div>
                    )}
                    {s.sinopseSugerida && (
                      <div style={{ marginTop: "0.25rem" }}><strong>Sinopse Sugerida:</strong> {s.sinopseSugerida}</div>
                    )}
                    {s.totalCapitulosSugerido && (
                      <div style={{ marginTop: "0.25rem" }}><strong>Total de Capítulos:</strong> {s.totalCapitulosSugerido}</div>
                    )}
                    {s.justificativa && (
                      <div style={{ marginTop: "0.25rem", color: "var(--text-secondary)" }}>
                        <strong>Justificativa:</strong> {s.justificativa}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEvaluateSuggestion(s.id, true)}
                    >
                      <CheckCircle2 size={14} />
                      <span>Aprovar Sugestão</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleEvaluateSuggestion(s.id, false)}
                    >
                      <XCircle size={14} />
                      <span>Rejeitar</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Curadoria de Tags Comunitárias */}
      {activeTab === "TAGS" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Tags size={18} style={{ color: "var(--primary)" }} />
            <span>Fila de Curadoria de Tags Comunitárias</span>
          </h2>
          <AdminTagsTab onCountsChanged={loadAdminData} />
        </section>
      )}

      {/* 3. Denúncias Abertas com Ação de Strike */}
      {activeTab === "DENUNCIAS" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AlertOctagon size={18} style={{ color: "var(--accent-rose)" }} />
            <span>Denúncias Abertas da Comunidade</span>
          </h2>

          {denuncias.length === 0 ? (
            <EmptyState
              icon={<AlertOctagon size={28} />}
              title="Nenhuma denúncia aberta"
              description="O ecossistema está pacífico! Não há infrações ou denúncias aguardando moderação."
            />
          ) : (
            <div className={styles.listCards}>
              {denuncias.map((d) => (
                <Card key={d.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div>
                      <strong style={{ fontSize: "var(--text-base)" }}>Motivo: {d.motivo}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                        Denunciado por @{d.denuncianteApelido || "Anônimo"} • Autor do comentário: @{d.comentarioAutorApelido}
                      </div>
                    </div>
                    <Badge variant="danger">Aberta</Badge>
                  </div>

                  <div style={{ fontSize: "var(--text-xs)", background: "rgba(239, 68, 68, 0.05)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <strong>Texto do Comentário Denunciado:</strong>
                    <p style={{ margin: "0.25rem 0 0 0", fontStyle: "italic", color: "var(--text-primary)" }}>
                      "{d.comentarioTexto}"
                    </p>
                    {d.detalhes && (
                      <div style={{ marginTop: "0.35rem", color: "var(--text-secondary)" }}>
                        <strong>Detalhes informados:</strong> {d.detalhes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {d.comentarioAutorId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        style={{ color: "var(--accent-amber-light)", borderColor: "rgba(245, 158, 11, 0.3)" }}
                        onClick={() =>
                          handleOpenStrikeModal(
                            d.comentarioAutorId!,
                            d.comentarioAutorApelido || "Infrator",
                            `Infração em comentário (Denúncia #${d.id}: ${d.motivo})`
                          )
                        }
                      >
                        <AlertTriangle size={14} />
                        <span>Aplicar Strike ao Autor</span>
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleResolveReport(d.id, true)}
                    >
                      <CheckCircle2 size={14} />
                      <span>Aceitar Denúncia (Remover Comentário)</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResolveReport(d.id, false)}
                    >
                      <XCircle size={14} />
                      <span>Arquivar / Rejeitar</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Gestão de Usuários & Moderação (Strikes) */}
      {activeTab === "USUARIOS" && (
        <section className={styles.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Users size={18} />
                <span>Gestão de Membros, Níveis de Acesso e Moderação</span>
              </h2>
              <p className={styles.sectionSubtitle} style={{ marginTop: "0.25rem" }}>
                Controle de strikes punitivos. Ao atingir o 3º strike, o sistema bloqueia e bane a conta automaticamente.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <div style={{ width: 280, maxWidth: "100%" }}>
                <Input
                  placeholder="Filtrar por apelido ou e-mail..."
                  leadingIcon={<Search size={14} />}
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadUsers}
                title="Recarregar Usuários"
                disabled={isTabLoading}
              >
                <RotateCcw size={14} />
              </Button>
            </div>
          </div>

          {isTabLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <Spinner size="md" />
            </div>
          ) : (
            <Card className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Leitor</th>
                      <th className={styles.th}>Nível (Role)</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th}>Confiança</th>
                      <th className={styles.th}>Strikes</th>
                      <th className={styles.th} style={{ textAlign: "right" }}>Ações de Moderação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                          Nenhum usuário encontrado com os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const strikesCount = u.strikes || 0;
                        return (
                          <tr key={u.id} className={styles.tr}>
                            <td className={styles.td}>
                              <div className={styles.userCell}>
                                <Avatar src={u.fotoUrl} name={u.apelido || "U"} size="sm" />
                                <div className={styles.userMeta}>
                                  <span className={styles.userName}>@{u.apelido || "sem_apelido"}</span>
                                  <span className={styles.userEmail}>{u.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className={styles.td}>
                              {u.role === "ROLE_ADMIN" ? (
                                <Badge variant="brand">Admin</Badge>
                              ) : u.role === "ROLE_CURADOR" ? (
                                <Badge variant="warning">Curador</Badge>
                              ) : (
                                <Badge variant="neutral">Leitor</Badge>
                              )}
                            </td>
                            <td className={styles.td}>
                              <Badge variant={u.ativo ? "success" : "danger"}>
                                {u.ativo ? "Ativo" : "Bloqueado / Banido"}
                              </Badge>
                            </td>
                            <td className={styles.td}>
                              <span style={{ fontWeight: 600 }}>{u.pontosConfianca ?? 0}</span> pts
                            </td>
                            <td className={styles.td}>
                              <div className={styles.strikeMeter}>
                                <div className={styles.strikeDots}>
                                  <div className={`${styles.strikeDot} ${strikesCount >= 1 ? styles.strikeDotActive : ""}`} />
                                  <div className={`${styles.strikeDot} ${strikesCount >= 2 ? styles.strikeDotActive : ""}`} />
                                  <div className={`${styles.strikeDot} ${strikesCount >= 3 ? styles.strikeDotActive : ""}`} />
                                </div>
                                <span
                                  style={{
                                    fontSize: "var(--text-xs)",
                                    fontWeight: 700,
                                    color:
                                      strikesCount >= 3
                                        ? "var(--accent-rose)"
                                        : strikesCount > 0
                                        ? "var(--accent-amber-light)"
                                        : "var(--text-muted)",
                                  }}
                                >
                                  {strikesCount}/3
                                </span>
                              </div>
                            </td>
                            <td className={styles.td} style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  style={{ color: "var(--accent-amber-light)", padding: "0.35rem 0.65rem" }}
                                  title="Aplicar Strike Punitivo"
                                  onClick={() => handleOpenStrikeModal(u.id, u.apelido || u.email)}
                                >
                                  <AlertTriangle size={14} />
                                  <span>Strike</span>
                                </Button>

                                {strikesCount > 0 && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    style={{ padding: "0.35rem 0.65rem" }}
                                    title="Remover 1 Strike"
                                    onClick={() => handleRemoveStrike(u.id, u.apelido || u.email)}
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Perdoar</span>
                                  </Button>
                                )}

                                {u.ativo && (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    style={{ padding: "0.35rem 0.65rem" }}
                                    title="Banir Imediatamente"
                                    onClick={() => handleBanUser(u.id, u.apelido || u.email)}
                                  >
                                    <Ban size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* 5. CRUD de Gêneros Oficiais */}
      {activeTab === "GENEROS" && (
        <section className={styles.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Tags size={18} />
                <span>Catálogo de Gêneros Oficiais Controlados</span>
              </h2>
              <p className={styles.sectionSubtitle} style={{ marginTop: "0.25rem" }}>
                Vocabulário controlado oficial do Shiori utilizado para classificação canônica e filtros avançados.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadGenres}
                title="Recarregar Gêneros"
                disabled={isTabLoading}
              >
                <RotateCcw size={14} />
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsNewGenreModalOpen(true)}>
                <Plus size={14} />
                <span>Novo Gênero Oficial</span>
              </Button>
            </div>
          </div>

          {isTabLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <Spinner size="md" />
            </div>
          ) : (
            <Card className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Nome Oficial</th>
                      <th className={styles.th}>Slug Canônico</th>
                      <th className={styles.th}>Descrição / Diretrizes</th>
                      <th className={styles.th} style={{ textAlign: "right" }}>Identificador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generos.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                          Nenhum gênero oficial cadastrado ainda. Clique em "Novo Gênero Oficial" para adicionar o primeiro.
                        </td>
                      </tr>
                    ) : (
                      generos.map((g) => (
                        <tr key={g.id} className={styles.tr}>
                          <td className={styles.td}>
                            <strong style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{g.nome}</strong>
                          </td>
                          <td className={styles.td}>
                            <code style={{ color: "var(--brand-light)", background: "var(--bg-elevated)", padding: "0.2rem 0.4rem", borderRadius: "var(--radius-sm)" }}>
                              {g.slug}
                            </code>
                          </td>
                          <td className={styles.td} style={{ color: "var(--text-secondary)", maxWidth: 360 }}>
                            {g.descricao || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Sem descrição informada</span>}
                          </td>
                          <td className={styles.td} style={{ textAlign: "right", color: "var(--text-muted)" }}>
                            #{g.id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* 6. Gestão de Provedores de Integração */}
      {activeTab === "INTEGRACOES" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Server size={18} />
            <span>Gestão de Provedores de Integração Externa (MangaDex, AniList)</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Supervisão de clientes externos, consumo de cotas diárias de requisições e alternância de tráfego.
          </p>

          <Card className={styles.tableCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Provedor / Cliente</th>
                    <th className={styles.th}>URL Base da API</th>
                    <th className={styles.th}>Status de Conexão</th>
                    <th className={styles.th}>Consumo de Cota Diária</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Ação de Governança</th>
                  </tr>
                </thead>
                <tbody>
                  {integrations.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        Nenhum provedor de integração cadastrado no banco.
                      </td>
                    </tr>
                  ) : (
                    integrations.map((p) => {
                      const consumptionPct = Math.min(
                        100,
                        Math.round((p.requisicoesHoje / Math.max(1, p.limiteDiario)) * 100)
                      );
                      const isHigh = consumptionPct >= 90;
                      const isMedium = consumptionPct >= 70;

                      return (
                        <tr key={p.id} className={styles.tr}>
                          <td className={styles.td}>
                            <div>
                              <strong style={{ fontSize: "var(--text-sm)" }}>{p.nomeExibicao}</strong>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                                Código: <code>{p.codigo}</code>
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <a
                              href={p.urlBase}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "var(--brand-light)" }}
                            >
                              <code>{p.urlBase}</code>
                              <ExternalLink size={12} />
                            </a>
                          </td>
                          <td className={styles.td}>
                            <Badge variant={p.ativo ? "success" : "danger"}>
                              {p.ativo ? "Ativo / Operante" : "Inativo / Desativado"}
                            </Badge>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.quotaBar}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                <span>{p.requisicoesHoje} / {p.limiteDiario}</span>
                                <span style={{ fontWeight: 700, color: isHigh ? "var(--accent-rose)" : isMedium ? "var(--accent-amber-light)" : "#34D399" }}>
                                  {consumptionPct}%
                                </span>
                              </div>
                              <div className={styles.quotaProgressBg}>
                                <div
                                  className={styles.quotaProgressFill}
                                  style={{
                                    width: `${consumptionPct}%`,
                                    background: isHigh
                                      ? "var(--accent-rose)"
                                      : isMedium
                                      ? "var(--accent-amber-light)"
                                      : "#34D399",
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className={styles.td} style={{ textAlign: "right" }}>
                            <Button
                              variant={p.ativo ? "outline" : "primary"}
                              size="sm"
                              onClick={() => handleToggleIntegration(p.id, p.ativo)}
                            >
                              {p.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                              <span>{p.ativo ? "Desativar" : "Ativar"}</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      {/* 7. Feature Flags Globais */}
      {activeTab === "FLAGS" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ToggleLeft size={18} />
            <span>Feature Flags Globais em Tempo de Execução</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Habilite ou restrinja recursos da plataforma instantaneamente sem necessidade de redeploy.
          </p>

          <div className={styles.flagsList}>
            {flags.map((flag) => (
              <Card key={flag.chave} className={styles.flagRow}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{flag.nome}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Chave: <code>{flag.chave}</code> • {flag.descricao}
                  </div>
                </div>
                <Button
                  variant={flag.ativado ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => handleToggleFlag(flag.chave, flag.ativado)}
                >
                  {flag.ativado ? "Habilitado" : "Desabilitado"}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 8. Comunicados Globais / Broadcasts */}
      {activeTab === "BROADCASTS" && (
        <AdminBroadcastsTab
          broadcasts={broadcasts}
          isLoading={isTabLoading}
          onRefresh={loadBroadcasts}
        />
      )}

      {/* 9. Log de Auditoria Visual */}
      {activeTab === "AUDITORIA" && (
        <section className={styles.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                <History size={18} />
                <span>Trilha de Auditoria e Governança do Sistema</span>
              </h2>
              <p className={styles.sectionSubtitle} style={{ marginTop: "0.25rem" }}>
                Registro cronológico e imutável de todas as ações administrativas, punições, mesclagens e alterações de sistema.
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={loadAudits}>
              <RotateCcw size={14} />
              <span>Atualizar Logs</span>
            </Button>
          </div>

          {isTabLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <Spinner size="md" />
            </div>
          ) : (
            <Card className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Data / Horário</th>
                      <th className={styles.th}>Operador</th>
                      <th className={styles.th}>Ação Executada</th>
                      <th className={styles.th}>Entidade Afetada</th>
                      <th className={styles.th}>Justificativa / Detalhes</th>
                      <th className={styles.th} style={{ textAlign: "right" }}>IP Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditorias.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                          Nenhum registro de auditoria encontrado.
                        </td>
                      </tr>
                    ) : (
                      auditorias.map((a) => (
                        <tr key={a.id} className={styles.tr}>
                          <td className={styles.td} style={{ whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                            {new Date(a.dataHora).toLocaleString("pt-BR")}
                          </td>
                          <td className={styles.td}>
                            <strong style={{ color: "var(--brand-light)" }}>@{a.adminApelido || `Admin #${a.adminId || "?"}`}</strong>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.actionBadge}>{a.acao}</span>
                          </td>
                          <td className={styles.td}>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {a.entidadeAfetada} #{a.entidadeId}
                            </span>
                          </td>
                          <td className={styles.td} style={{ maxWidth: 360, color: "var(--text-primary)" }}>
                            {a.detalhes}
                          </td>
                          <td className={styles.td} style={{ textAlign: "right", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            {a.ipOrigem || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      )}

      {/* 9. Ferramenta de Mesclagem */}
      {activeTab === "MESCLAR" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <GitMerge size={18} />
            <span>Ferramenta de Mesclagem Canônica de Obras</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Transfere itens de estantes, ciclos de releitura e históricos de uma obra duplicada/secundária para a obra principal canônica.
          </p>

          <Card style={{ padding: "1.5rem", maxWidth: 650 }}>
            <form onSubmit={handleMergeWorks} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input
                label="ID da Obra Duplicada (Origem que será absorvida)"
                type="number"
                placeholder="Digite o ID da obra duplicada..."
                value={obraDuplicadaId}
                onChange={(e) => setObraDuplicadaId(e.target.value)}
                required
              />

              <Input
                label="ID da Obra Principal Canônica (Destino final)"
                type="number"
                placeholder="Digite o ID da obra canônica de destino..."
                value={obraPrincipalId}
                onChange={(e) => setObraPrincipalId(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isMerging}
                style={{ marginTop: "0.5rem" }}
              >
                <GitMerge size={16} />
                <span>Executar Mesclagem de Obras</span>
              </Button>
            </form>

            {mergeResult && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-md)" }}>
                <strong style={{ color: "#34D399", fontSize: "var(--text-sm)" }}>Mesclagem Concluída:</strong>
                <p style={{ margin: "0.35rem 0 0 0", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                  {mergeResult.mensagem} (Total de itens migrados: {mergeResult.totalItensEstanteTransferidos})
                </p>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* ===================================================================
       * MODAL 1: CADASTRAR NOVO GÊNERO OFICIAL
       * =================================================================== */}
      {isNewGenreModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsNewGenreModalOpen(false)}
          title="Cadastrar Novo Gênero Oficial"
        >
          <form onSubmit={handleCreateGenreSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Adicione um novo gênero oficial ao vocabulário controlado do catálogo. O identificador slug será derivado automaticamente pelo sistema.
            </p>

            <Input
              label="Nome do Gênero *"
              placeholder="Digite o nome do gênero..."
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              required
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Descrição / Diretrizes (Opcional)
              </label>
              <textarea
                placeholder="Orientações e características que definem este gênero literário..."
                value={newGenreDescription}
                onChange={(e) => setNewGenreDescription(e.target.value)}
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
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsNewGenreModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isCreatingGenre}>
                <Plus size={16} />
                <span>Salvar Gênero Oficial</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================
       * MODAL 2: APLICAR STRIKE PUNITIVO
       * =================================================================== */}
      {strikeTargetUser && (
        <Modal
          isOpen={true}
          onClose={() => setStrikeTargetUser(null)}
          title={`Aplicar Strike Punitivo a @${strikeTargetUser.apelido}`}
        >
          <form onSubmit={handleConfirmStrike} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "var(--radius-md)" }}>
              <AlertTriangle size={24} style={{ color: "var(--accent-rose)", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Esta penalidade será registrada permanentemente na trilha de auditoria. Lembre-se: <strong>ao atingir 3 strikes</strong>, o usuário perde o acesso à plataforma imediatamente.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Motivo / Justificativa do Strike *
              </label>
              <textarea
                placeholder="Descreva detalhadamente a infração cometida pelo usuário..."
                value={strikeReason}
                onChange={(e) => setStrikeReason(e.target.value)}
                rows={3}
                required
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
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setStrikeTargetUser(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                isLoading={isApplyingStrike}
              >
                <AlertTriangle size={16} />
                <span>Confirmar e Aplicar Strike</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
