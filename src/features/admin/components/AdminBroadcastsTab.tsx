import React, { useState } from "react";
import styles from "../AdminDashboardPage.module.css";
import { AdminService } from "../../../services/admin.service";
import { Card } from "../../../components/ui/Card/Card";
import { Badge } from "../../../components/ui/Badge/Badge";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Spinner } from "../../../components/ui/Spinner/Spinner";
import { toast } from "../../../store/toastStore";
import type { BroadcastResponse, NivelBroadcast } from "../../../types/admin.types";
import {
  Megaphone,
  Plus,
  Trash2,
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
} from "lucide-react";

interface AdminBroadcastsTabProps {
  broadcasts: BroadcastResponse[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AdminBroadcastsTab: React.FC<AdminBroadcastsTabProps> = ({
  broadcasts,
  isLoading,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [nivel, setNivel] = useState<NivelBroadcast>("INFO");
  const [dataExpiracao, setDataExpiracao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      toast.warning("Título e mensagem são obrigatórios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await AdminService.createBroadcast({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        nivel,
        dataExpiracao: dataExpiracao ? new Date(dataExpiracao).toISOString() : undefined,
      });

      toast.success("Comunicado global publicado com sucesso!");
      setIsModalOpen(false);
      setTitulo("");
      setMensagem("");
      setNivel("INFO");
      setDataExpiracao("");
      onRefresh();
    } catch (err: unknown) {
      toast.error(err, "Falha ao Publicar Comunicado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      setDeactivatingId(id);
      await AdminService.deactivateBroadcast(id);
      toast.success("Comunicado desativado com sucesso!");
      onRefresh();
    } catch (err: unknown) {
      toast.error(err, "Falha ao Desativar Comunicado");
    } finally {
      setDeactivatingId(null);
    }
  };

  const getNivelBadge = (n: NivelBroadcast) => {
    switch (n) {
      case "URGENTE":
        return <Badge variant="danger">URGENTE</Badge>;
      case "AVISO":
        return <Badge variant="warning">AVISO</Badge>;
      case "INFO":
      default:
        return <Badge variant="brand">INFO</Badge>;
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.tableHeaderRow} style={{ padding: "0 0 1rem 0", borderBottom: "none" }}>
        <div>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            <Megaphone size={18} />
            <span>Comunicados Globais do Sistema (Broadcasts)</span>
          </h2>
          <p className={styles.sectionSubtitle} style={{ margin: "0.25rem 0 0 0" }}>
            Alertas e avisos emitidos para exibição em banner a todos os leitores conectados na plataforma.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} />
          <span>Novo Comunicado</span>
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <Spinner size="md" />
        </div>
      ) : broadcasts.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "3.5rem", color: "var(--text-muted)" }}>
          <Megaphone size={36} style={{ color: "var(--border-light)", margin: "0 auto 1rem auto" }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Nenhum comunicado global cadastrado no sistema.</p>
        </Card>
      ) : (
        <div className={styles.listCards}>
          {broadcasts.map((b) => (
            <Card key={b.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  {getNivelBadge(b.nivel)}
                  <strong style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
                    {b.titulo}
                  </strong>
                  {b.ativo ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="neutral">Inativo / Expirado</Badge>
                  )}
                </div>

                {b.ativo && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeactivate(b.id)}
                    isLoading={deactivatingId === b.id}
                    title="Desativar banner imediatamente"
                  >
                    <Trash2 size={13} />
                    <span>Desativar</span>
                  </Button>
                )}
              </div>

              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {b.mensagem}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-muted)",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "0.65rem",
                  marginTop: "0.25rem",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <User size={12} />
                  Criado por @{b.adminCriadorApelido || "Admin"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Calendar size={12} />
                  Emissão: {new Date(b.dataCriacao).toLocaleString("pt-BR")}
                </span>
                {b.dataExpiracao && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--accent-amber-light)" }}>
                    <AlertTriangle size={12} />
                    Expira em: {new Date(b.dataExpiracao).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Publicação de Comunicado */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title="Emitir Novo Comunicado Global"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Este comunicado será exibido no topo da tela (Banner de Transmissão) para todos os usuários que acessarem a plataforma.
            </p>

            <Input
              label="Título do Comunicado *"
              placeholder="Ex: Manutenção Programada dos Serviços Shiori"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Nível de Severidade *
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(["INFO", "AVISO", "URGENTE"] as NivelBroadcast[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setNivel(opt)}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      borderRadius: "var(--radius-md)",
                      border: nivel === opt ? "1px solid var(--brand-primary)" : "1px solid var(--border-light)",
                      background: nivel === opt ? "var(--brand-glow)" : "var(--bg-surface)",
                      color: nivel === opt ? "var(--brand-light)" : "var(--text-secondary)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Mensagem Completa *
              </label>
              <textarea
                placeholder="Descreva detalhadamente o comunicado que será exibido aos leitores..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
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

            <Input
              label="Data / Hora de Expiração Automática (Opcional)"
              type="datetime-local"
              value={dataExpiracao}
              onChange={(e) => setDataExpiracao(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                <CheckCircle2 size={16} />
                <span>Publicar Comunicado</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
};
