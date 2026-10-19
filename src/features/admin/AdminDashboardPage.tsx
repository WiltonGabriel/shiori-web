import React, { useEffect, useState } from "react";
import styles from "./AdminDashboardPage.module.css";
import { AdminService } from "../../services/admin.service";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import type {
  AdminDashboardResponse,
  ProvedorIntegracaoResponse,
  FeatureFlagResponse,
  SugestaoEdicaoResponse,
  DenunciaComentarioResponse,
  MesclarObrasResponse,
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
  ShieldAlert,
  Server,
  ToggleLeft,
  RotateCcw,
} from "lucide-react";

type AdminTab = "DASHBOARD" | "SUGESTOES" | "DENUNCIAS" | "MESCLAR" | "INTEGRACOES" | "FLAGS";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>("DASHBOARD");

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [sugestoes, setSugestoes] = useState<SugestaoEdicaoResponse[]>([]);
  const [denuncias, setDenuncias] = useState<DenunciaComentarioResponse[]>([]);
  const [integrations, setIntegrations] = useState<ProvedorIntegracaoResponse[]>([]);
  const [flags, setFlags] = useState<FeatureFlagResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Formulário de Mesclagem de Obras
  const [obraDuplicadaId, setObraDuplicadaId] = useState<string>("");
  const [obraPrincipalId, setObraPrincipalId] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<MesclarObrasResponse | null>(null);

  const loadAdminData = async () => {
    if (user?.role !== "ROLE_ADMIN") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [dashRes, sugRes, denRes, intRes, flagRes] = await Promise.allSettled([
        AdminService.getDashboard(),
        AdminService.listPendingSuggestions(),
        AdminService.listOpenReports(),
        AdminService.listIntegrations(),
        AdminService.listFeatureFlags(),
      ]);

      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (sugRes.status === "fulfilled") setSugestoes(sugRes.value.content || []);
      if (denRes.status === "fulfilled") setDenuncias(denRes.value.content || []);
      if (intRes.status === "fulfilled") setIntegrations(intRes.value || []);
      if (flagRes.status === "fulfilled") setFlags(flagRes.value || []);
    } catch (err: any) {
      toast.error(err, "Falha ao Carregar Dados Administrativos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

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
      setSugestoes((prev) => prev.filter((s) => s.id !== sugestaoId));
      toast.success(aprovado ? "Sugestão aprovada e incorporada!" : "Sugestão rejeitada.");
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
      toast.success(`Feature Flag '${chave}' atualizada.`);
    } catch (err: any) {
      toast.error(err, "Falha ao Alterar Feature Flag");
    }
  };

  if (user?.role !== "ROLE_ADMIN") {
    return (
      <Card style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 500, margin: "2rem auto" }}>
        <ShieldAlert size={40} style={{ color: "var(--accent-rose)", margin: "0 auto 1rem auto" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>Acesso Restrito</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Esta área é restrita a administradores autorizados do Shiori.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className={styles.title}>Painel de Controle Administrativo</h1>
            <p className={styles.subtitle}>
              Supervisão geral, governança de integrações, moderação e curadoria do catálogo oficial.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={loadAdminData}>
            <RotateCcw size={14} />
            <span>Atualizar Painel</span>
          </Button>
        </div>

        {/* Abas Administrativas */}
        <div className={styles.adminTabs}>
          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "DASHBOARD" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("DASHBOARD")}
          >
            <Layers size={14} />
            <span>Métricas Gerais</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "SUGESTOES" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("SUGESTOES")}
          >
            <FileQuestion size={14} />
            <span>Sugestões Pendentes</span>
            {sugestoes.length > 0 && <span className={styles.badgeCount}>{sugestoes.length}</span>}
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "DENUNCIAS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("DENUNCIAS")}
          >
            <AlertOctagon size={14} />
            <span>Denúncias Abertas</span>
            {denuncias.length > 0 && <span className={styles.badgeCount}>{denuncias.length}</span>}
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "MESCLAR" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("MESCLAR")}
          >
            <GitMerge size={14} />
            <span>Mesclar Obras</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "INTEGRACOES" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("INTEGRACOES")}
          >
            <Server size={14} />
            <span>Provedores ({integrations.length})</span>
          </button>

          <button
            type="button"
            className={`${styles.adminTab} ${activeTab === "FLAGS" ? styles.adminTabActive : ""}`}
            onClick={() => setActiveTab("FLAGS")}
          >
            <ToggleLeft size={14} />
            <span>Feature Flags ({flags.length})</span>
          </button>
        </div>
      </div>

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
              <div className={styles.metricValue}>
                {dashboard.totalDenunciasComentariosPendentes + dashboard.totalDenunciasObrasPendentes}
              </div>
              <div className={styles.metricLabel}>Denúncias aguardando moderação</div>
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
            <Card style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Nenhuma sugestão de edição pendente de avaliação.
            </Card>
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

      {/* 3. Denúncias Abertas */}
      {activeTab === "DENUNCIAS" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <AlertOctagon size={18} style={{ color: "var(--accent-rose)" }} />
            <span>Denúncias Abertas</span>
          </h2>

          {denuncias.length === 0 ? (
            <Card style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Nenhuma denúncia aberta no momento. O ecossistema está pacífico!
            </Card>
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

                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
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

      {/* 4. Ferramenta de Mesclagem */}
      {activeTab === "MESCLAR" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <GitMerge size={18} />
            <span>Ferramenta de Mesclagem Canônica de Obras</span>
          </h2>

          <Card style={{ padding: "1.5rem", maxWidth: 650 }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Transfere itens de estantes, ciclos de releitura e históricos de uma obra duplicada/secundária para a obra principal canônica. A obra duplicada terá seus itens absorvidos sem perda de progresso dos leitores.
            </p>

            <form onSubmit={handleMergeWorks} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input
                label="ID da Obra Duplicada (Origem que será absorvida)"
                type="number"
                placeholder="Ex: 42"
                value={obraDuplicadaId}
                onChange={(e) => setObraDuplicadaId(e.target.value)}
                required
              />

              <Input
                label="ID da Obra Principal Canônica (Destino final)"
                type="number"
                placeholder="Ex: 7"
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

      {/* 5. Gestão de Provedores */}
      {activeTab === "INTEGRACOES" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Server size={18} />
            <span>Gestão de Provedores de Integração (MangaDex, AniList, etc.)</span>
          </h2>

          <div className={styles.integrationsGrid}>
            {integrations.map((p) => (
              <Card key={p.id} className={styles.integrationCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>{p.nomeExibicao}</span>
                  <Badge variant={p.ativo ? "success" : "danger"}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                  <div>URL Base: <code>{p.urlBase}</code></div>
                  <div style={{ marginTop: "0.25rem" }}>
                    Requisições hoje: <strong>{p.requisicoesHoje}</strong> / {p.limiteDiario}
                  </div>
                </div>

                <Button
                  variant={p.ativo ? "outline" : "primary"}
                  size="sm"
                  onClick={() => handleToggleIntegration(p.id, p.ativo)}
                >
                  {p.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{p.ativo ? "Desativar Provedor" : "Ativar Provedor"}</span>
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 6. Feature Flags */}
      {activeTab === "FLAGS" && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <ToggleLeft size={18} />
            <span>Feature Flags Globais em Tempo de Execução</span>
          </h2>

          <div className={styles.flagsList}>
            {flags.map((flag) => (
              <Card key={flag.chave} className={styles.flagRow}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{flag.nome}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{flag.descricao}</div>
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
    </div>
  );
};
