import React, { useEffect, useState } from "react";
import styles from "./AdminDashboardPage.module.css";
import { AdminService } from "../../services/admin.service";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { useAuthStore } from "../../store/authStore";
import type {
  AdminDashboardResponse,
  ProvedorIntegracaoResponse,
  FeatureFlagResponse,
} from "../../types/admin.types";
import { Users, BookOpen, Layers, AlertOctagon, CheckCircle2, XCircle } from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [integrations, setIntegrations] = useState<ProvedorIntegracaoResponse[]>([]);
  const [flags, setFlags] = useState<FeatureFlagResponse[]>([]);
  const [isLoading, setIsLoading] = useState(() => user?.role === "ROLE_ADMIN");


  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, intRes, flagRes] = await Promise.allSettled([
        AdminService.getDashboard(),
        AdminService.listIntegrations(),
        AdminService.listFeatureFlags(),
      ]);
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
      if (intRes.status === "fulfilled") setIntegrations(intRes.value);
      if (flagRes.status === "fulfilled") setFlags(flagRes.value);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ROLE_ADMIN") {
      loadAdminData();
    }
  }, [user]);

  const handleToggleIntegration = async (id: number, currentStatus: boolean) => {
    try {
      const updated = await AdminService.toggleIntegrationStatus(id, !currentStatus);
      setIntegrations((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      alert(err.message || "Erro ao alterar status do provedor.");
    }
  };

  const handleToggleFlag = async (chave: string, currentStatus: boolean) => {
    try {
      const updated = await AdminService.toggleFeatureFlag(chave, !currentStatus);
      setFlags((prev) => prev.map((f) => (f.chave === chave ? updated : f)));
    } catch (err: any) {
      alert(err.message || "Erro ao alterar feature flag.");
    }
  };

  if (user?.role !== "ROLE_ADMIN") {
    return (
      <Card style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 500, margin: "2rem auto" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Acesso Restrito</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Esta área é restrita a administradores do Shiori.
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
        <h1 className={styles.title}>Painel de Controle Administrativo</h1>
        <p className={styles.subtitle}>
          Supervisão em tempo real de infraestrutura, governança de integrações e métricas do ecossistema.
        </p>
      </div>

      {dashboard && (
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
              <div className={styles.metricLabel}>Obras no catálogo</div>
            </div>
          </Card>

          <Card className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber-light)" }}>
              <Layers size={22} />
            </div>
            <div>
              <div className={styles.metricValue}>{dashboard.totalItensEstante}</div>
              <div className={styles.metricLabel}>Itens em estantes</div>
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
              <div className={styles.metricLabel}>Denúncias pendentes</div>
            </div>
          </Card>
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Integrações Externas Dinâmicas (MangaDex, AniList)</h2>
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feature Flags em Tempo de Execução</h2>
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
    </div>
  );
};
