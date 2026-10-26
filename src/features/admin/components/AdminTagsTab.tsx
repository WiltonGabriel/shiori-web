import React, { useState, useEffect, useCallback } from "react";
import styles from "./AdminTagsTab.module.css";
import { TagService } from "../../../services/tag.service";
import { Button } from "../../../components/ui/Button/Button";
import { Badge } from "../../../components/ui/Badge/Badge";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Spinner } from "../../../components/ui/Spinner/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState/EmptyState";
import { toast } from "../../../store/toastStore";
import type { SugestaoTagAdminResponse, StatusSugestaoTag } from "../../../types/tag.types";
import { Check, X, Tag, User, Calendar } from "lucide-react";

interface AdminTagsTabProps {
  onCountsChanged?: () => void;
}

export const AdminTagsTab: React.FC<AdminTagsTabProps> = ({ onCountsChanged }) => {
  const [sugestoes, setSugestoes] = useState<SugestaoTagAdminResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusSugestaoTag>("PENDENTE");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Rejeição
  const [rejectingItem, setRejectingItem] = useState<SugestaoTagAdminResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await TagService.listTagSuggestions(statusFilter, page, 15);
      setSugestoes(Array.isArray(res) ? res : res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || (Array.isArray(res) ? res.length : 0));
    } catch (err: any) {
      toast.error(err?.message || "Falha ao carregar fila de moderação de tags.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleApprove = async (sugestao: SugestaoTagAdminResponse) => {
    try {
      setIsSubmittingAction(true);
      await TagService.approveTagSuggestion(sugestao.id);
      toast.success(
        `A tag '${sugestao.nomeTag}' foi aprovada e associada à obra '${sugestao.obraTitulo}'!`,
        "Tag Aprovada"
      );
      loadSuggestions();
      onCountsChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao aprovar sugestão.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (sugestao: SugestaoTagAdminResponse) => {
    setRejectingItem(sugestao);
    setRejectionReason("");
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      toast.warning("O motivo da rejeição é obrigatório para fins de auditoria.");
      return;
    }

    try {
      setIsSubmittingAction(true);
      await TagService.rejectTagSuggestion(rejectingItem.id, rejectionReason.trim());
      toast.success("A sugestão de tag foi rejeitada e a justificativa registrada.", "Sugestão Rejeitada");
      setRejectingItem(null);
      loadSuggestions();
      onCountsChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Erro ao rejeitar sugestão.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.filtersRow}>
        <div className={styles.statusFilterButtons}>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "PENDENTE" ? styles.filterBtnActive : ""}`}
            onClick={() => {
              setStatusFilter("PENDENTE");
              setPage(0);
            }}
          >
            Pendentes
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "APROVADA" ? styles.filterBtnActive : ""}`}
            onClick={() => {
              setStatusFilter("APROVADA");
              setPage(0);
            }}
          >
            Aprovadas
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === "REJEITADA" ? styles.filterBtnActive : ""}`}
            onClick={() => {
              setStatusFilter("REJEITADA");
              setPage(0);
            }}
          >
            Rejeitadas
          </button>
        </div>

        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          Total de itens: <strong>{totalElements}</strong>
        </span>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner />
        </div>
      ) : sugestoes.length === 0 ? (
        <EmptyState
          icon={<Tag size={36} />}
          title="Fila de Tags Vazia"
          description={`Nenhuma sugestão com status '${statusFilter}' encontrada.`}
        />
      ) : (
        <div className={styles.suggestionsList}>
          {sugestoes.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.tagInfoGroup}>
                  <div className={styles.tagBadgeRow}>
                    <Tag size={16} color="var(--primary)" />
                    <span className={styles.tagName}>{item.nomeTag}</span>
                    <Badge
                      variant={
                        item.status === "APROVADA"
                          ? "success"
                          : item.status === "REJEITADA"
                          ? "danger"
                          : "brand"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className={styles.workRef}>
                    Obra sugerida: <span className={styles.workTitle}>{item.obraTitulo}</span> (ID: {item.obraId})
                  </div>
                </div>

                <div className={styles.metaInfo}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <User size={13} /> {item.usuarioSugeridorApelido}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={13} /> {new Date(item.dataSugestao).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              {item.justificativa && (
                <div className={styles.justificationBox}>
                  <strong>Justificativa do autor:</strong> "{item.justificativa}"
                </div>
              )}

              {item.status === "REJEITADA" && item.motivoRejeicao && (
                <div className={styles.rejectionBox}>
                  <strong>Motivo da recusa:</strong> {item.motivoRejeicao} (Avaliador: {item.adminAvaliadorApelido})
                </div>
              )}

              {item.status === "PENDENTE" && (
                <div className={styles.actionsRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRejectModal(item)}
                    disabled={isSubmittingAction}
                    style={{ color: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}
                  >
                    <X size={14} />
                    <span>Rejeitar</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(item)}
                    disabled={isSubmittingAction}
                  >
                    <Check size={14} />
                    <span>Aprovar & Vincular</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.paginationRow}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            Página Anterior
          </Button>
          <span>
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isLoading}
          >
            Próxima Página
          </Button>
        </div>
      )}

      {/* Modal de Confirmação de Rejeição */}
      <Modal
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        title="Rejeitar Sugestão de Tag"
      >
        <form onSubmit={handleConfirmReject} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", margin: 0 }}>
            Você está recusando a tag <strong>"{rejectingItem?.nomeTag}"</strong> para a obra{" "}
            <strong>"{rejectingItem?.obraTitulo}"</strong>. Justifique a recusa formalmente para fins de auditoria e moderação.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="rejection-reason" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
              Motivo da Recusa (Obrigatório)
            </label>
            <textarea
              id="rejection-reason"
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "8px 12px",
                fontSize: "var(--text-sm)",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                resize: "vertical",
              }}
              placeholder="Ex: Tag ofensiva, redundante com gênero ou fora dos padrões Shiori..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              maxLength={255}
              autoFocus
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button type="button" variant="ghost" onClick={() => setRejectingItem(null)} disabled={isSubmittingAction}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingAction || !rejectionReason.trim()}
              style={{ backgroundColor: "var(--accent-rose)", borderColor: "var(--accent-rose)" }}
            >
              Confirmar Rejeição
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
