import React, { useEffect, useState, useMemo } from "react";
import styles from "./ShelfPage.module.css";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import type { ItemCatalogoResponse, StatusLeitura } from "../../types/catalog.types";
import {
  Plus,
  Edit3,
  ExternalLink,
  Trash2,
  LogIn,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

type FilterTab = "TODOS" | "LENDO" | "TERMINOU" | "FADIGOU" | "PLANEJADO" | "ABDICOU";

const STATUS_TABS: FilterTab[] = ["TODOS", "LENDO", "TERMINOU", "FADIGOU", "PLANEJADO", "ABDICOU"];

export const ShelfPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<ItemCatalogoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("TODOS");

  // Modal de Edição Rápida
  const [editingItem, setEditingItem] = useState<ItemCatalogoResponse | null>(null);
  const [capituloAtual, setCapituloAtual] = useState<number>(0);
  const [volumeAtual, setVolumeAtual] = useState<number>(0);
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [nota, setNota] = useState<number>(0);
  const [anotacao, setAnotacao] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Concluir Ciclo de Leitura
  const [closingCycleItem, setClosingCycleItem] = useState<ItemCatalogoResponse | null>(null);
  const [cycleRating, setCycleRating] = useState<number>(10);
  const [cycleNote, setCycleNote] = useState<string>("");
  const [cycleDate, setCycleDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [isClosingCycle, setIsClosingCycle] = useState(false);

  // Modal de Saída Externa para urlLeitura
  const [externalUrlModal, setExternalUrlModal] = useState<string | null>(null);

  const loadShelf = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await CatalogService.getMyShelf(0, 100);
      setItems(res || []);
    } catch (err: any) {
      console.error("Falha ao carregar estante:", err);
      setLoadError("Não foi possível carregar sua estante no momento.");
      toast.error(err, "Falha ao Carregar Estante");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShelf();
  }, [isAuthenticated]);

  const filteredItems = useMemo(() => {
    if (activeTab === "TODOS") return items;
    if (activeTab === "ABDICOU") {
      return items.filter((i) => i.statusLeitura === "DROPOU");
    }
    return items.filter((i) => i.statusLeitura === activeTab);
  }, [items, activeTab]);

  const handleQuickIncrement = async (item: ItemCatalogoResponse) => {
    try {
      const proximoCap = (item.progressoAtual || 0) + 1;
      const atualizado = await CatalogService.updateProgress(item.id, {
        capituloAtual: proximoCap,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura,
      });

      setItems((prev) => prev.map((i) => (i.id === item.id ? atualizado : i)));
      toast.success(`Capítulo ${proximoCap} registrado para ${item.obraTitulo}!`);
    } catch (err: any) {
      toast.error(err, "Erro ao Registrar Progresso");
    }
  };

  const handleOpenEdit = (item: ItemCatalogoResponse) => {
    setEditingItem(item);
    setCapituloAtual(item.progressoAtual || 0);
    setVolumeAtual(item.volumeAtual || 0);
    setStatusLeitura(item.statusLeitura);
    setNota(item.avaliacaoPessoal || 0);
    setAnotacao("");
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSaving(true);
      const atualizado = await CatalogService.updateProgress(editingItem.id, {
        capituloAtual,
        volumeAtual: volumeAtual > 0 ? volumeAtual : undefined,
        statusLeitura,
        nota: nota > 0 ? nota : undefined,
        anotacao: anotacao.trim() || undefined,
      });

      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? atualizado : i)));
      toast.success("Progresso atualizado com sucesso!");
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err, "Erro ao Salvar Progresso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCloseCycle = (item: ItemCatalogoResponse) => {
    setClosingCycleItem(item);
    setCycleRating(item.avaliacaoPessoal || 10);
    setCycleNote("");
    setCycleDate(new Date().toISOString().split("T")[0]);
  };

  const handleConfirmCloseCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingCycleItem) return;

    try {
      setIsClosingCycle(true);
      const finalCap = closingCycleItem.obraTotalCapitulos || closingCycleItem.progressoAtual || 1;
      const finalVol = closingCycleItem.obraTotalVolumes || closingCycleItem.volumeAtual;

      const atualizado = await CatalogService.updateProgress(closingCycleItem.id, {
        capituloAtual: finalCap,
        volumeAtual: finalVol,
        statusLeitura: "TERMINOU",
        nota: cycleRating,
        anotacao: cycleNote.trim() || `Ciclo concluído em ${cycleDate}`,
      });

      setItems((prev) => prev.map((i) => (i.id === closingCycleItem.id ? atualizado : i)));
      toast.success(`Parabéns! Ciclo de leitura finalizado para ${closingCycleItem.obraTitulo}!`);
      setClosingCycleItem(null);
    } catch (err: any) {
      toast.error(err, "Erro ao Concluir Ciclo");
    } finally {
      setIsClosingCycle(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm("Deseja realmente remover esta obra da sua estante?")) {
      return;
    }

    try {
      await CatalogService.removeItemFromShelf(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.info("Obra removida da estante.");
    } catch (err: any) {
      toast.error(err, "Erro ao Remover");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 600, margin: "3rem auto" }}>
        <Card style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "0.5rem" }}>
            Acesso à Estante Pessoal
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>
            Faça login para acompanhar suas leituras, registrar notas de capítulos e salvar links privados.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const enterBtn = document.querySelector('header button[type="button"]') as HTMLButtonElement | null;
                enterBtn?.click();
              }}
            >
              <LogIn size={16} />
              <span>Entrar com Minha Conta</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Meu Catálogo</h1>
        <p className={styles.subtitle}>
          Sua estante pessoal na nuvem. Acompanhe seu ritmo de leitura, ciclos finalizados e links seguros de leitura.
        </p>

        <div className={styles.tabs}>
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              className={`${styles.tab} ${activeTab === status ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(status)}
            >
              {status === "ABDICOU" ? "Abdicou" : status}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      ) : loadError ? (
        <Card style={{ textAlign: "center", padding: "3rem 2rem", maxWidth: 480, margin: "2rem auto" }}>
          <div style={{ color: "var(--accent-rose)", fontWeight: 700, marginBottom: "0.5rem" }}>
            {loadError}
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Não conseguimos sincronizar a sua estante com o servidor no momento.
          </p>
          <Button variant="secondary" size="sm" onClick={loadShelf} style={{ margin: "0 auto" }}>
            <RotateCcw size={14} />
            <span>Tentar Novamente</span>
          </Button>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Nenhum item na estante para o filtro <strong>{activeTab === "ABDICOU" ? "Abdicou" : activeTab}</strong>.
        </Card>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => {
            const hasTotalCap = item.obraTotalCapitulos !== undefined && item.obraTotalCapitulos > 0;
            const percentCap = hasTotalCap
              ? Math.min(100, Math.round(((item.progressoAtual || 0) / (item.obraTotalCapitulos || 1)) * 100))
              : 0;

            const badgeStatus =
              item.statusLeitura === "DROPOU" ? "Abdicou" : item.statusLeitura;

            return (
              <Card key={item.id} className={styles.itemCard}>
                <div className={styles.coverWrapper}>
                  {item.obraCapaUrl ? (
                    <img src={item.obraCapaUrl} alt={item.obraTitulo} className={styles.coverImg} loading="lazy" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.65rem" }}>
                      Sem Capa
                    </div>
                  )}
                </div>

                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle} title={item.obraTitulo}>
                    {item.obraTitulo}
                  </h3>

                  <div className={styles.progressRow}>
                    <Badge variant={item.statusLeitura === "FADIGOU" ? "warning" : item.statusLeitura === "TERMINOU" ? "success" : "brand"}>
                      {badgeStatus}
                    </Badge>
                    <span className={styles.progressText}>
                      {hasTotalCap
                        ? `Cap. ${item.progressoAtual || 0} / ${item.obraTotalCapitulos} (${percentCap}%)`
                        : `Cap. ${item.progressoAtual || 0} lidos`}
                    </span>
                  </div>

                  {/* Barra de Progresso Visual */}
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: hasTotalCap ? `${percentCap}%` : "100%" }}
                    />
                  </div>

                  {item.obraTotalVolumes ? (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                      Volume: {item.volumeAtual || 0} / {item.obraTotalVolumes}
                    </div>
                  ) : null}

                  <div className={styles.actions}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleQuickIncrement(item)}
                      title="Avançar +1 capítulo"
                    >
                      <Plus size={14} />
                      <span>+1</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenCloseCycle(item)}
                      title="Concluir / Fechar Ciclo de Leitura"
                    >
                      <CheckCircle size={14} />
                      <span>Concluir</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar detalhes do progresso"
                    >
                      <Edit3 size={14} />
                    </Button>

                    {item.urlLeitura && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExternalUrlModal(item.urlLeitura!)}
                        title="Abrir link privado de leitura"
                        style={{ color: "var(--brand-light)" }}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      title="Remover da estante"
                      style={{ marginLeft: "auto", color: "var(--accent-rose)" }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Editar Detalhes do Progresso */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title={`Progresso: ${editingItem.obraTitulo}`}
        >
          <form onSubmit={handleSaveProgress} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Input
                label="Capítulo Atual"
                type="number"
                step="any"
                min="0"
                value={capituloAtual}
                onChange={(e) => setCapituloAtual(parseFloat(e.target.value) || 0)}
                required
              />
              <Input
                label="Volume (Opcional)"
                type="number"
                step="any"
                min="0"
                value={volumeAtual}
                onChange={(e) => setVolumeAtual(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Status de Leitura
              </label>
              <select
                style={{
                  padding: "0.65rem 0.95rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  minHeight: "var(--touch-target-min)",
                  outline: "none",
                }}
                value={statusLeitura}
                onChange={(e) => setStatusLeitura(e.target.value as StatusLeitura)}
              >
                <option value="LENDO">LENDO</option>
                <option value="TERMINOU">TERMINOU</option>
                <option value="FADIGOU">FADIGOU</option>
                <option value="PLANEJADO">PLANEJADO</option>
                <option value="DROPOU">ABDICOU</option>
              </select>
            </div>

            <Input
              label="Nota Pessoal (0.0 a 10.0)"
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={nota}
              onChange={(e) => setNota(parseFloat(e.target.value) || 0)}
            />

            <Input
              label="Anotação / Comentário Privado"
              placeholder="O que achou deste capítulo?"
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
            />

            <Button type="submit" variant="primary" size="md" isLoading={isSaving} style={{ marginTop: "0.5rem" }}>
              Salvar Atualização
            </Button>
          </form>
        </Modal>
      )}

      {/* Modal: Fechar Ciclo de Leitura */}
      {closingCycleItem && (
        <Modal
          isOpen={true}
          onClose={() => setClosingCycleItem(null)}
          title={`Finalizar Leitura: ${closingCycleItem.obraTitulo}`}
        >
          <form onSubmit={handleConfirmCloseCycle} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Você está registrando a conclusão desta obra. O status passará para <strong>TERMINOU</strong> e este ciclo ficará registrado no seu histórico.
            </p>

            <Input
              label="Nota Final de Avaliação (0.0 a 10.0)"
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={cycleRating}
              onChange={(e) => setCycleRating(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Data de Conclusão"
              type="date"
              value={cycleDate}
              onChange={(e) => setCycleDate(e.target.value)}
              required
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Anotação / Crítica Pessoal (Opcional)
              </label>
              <textarea
                placeholder="Escreva sua opinião geral e sentimentos sobre o encerramento da obra..."
                value={cycleNote}
                onChange={(e) => setCycleNote(e.target.value)}
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

            <Button type="submit" variant="primary" size="md" isLoading={isClosingCycle} style={{ marginTop: "0.5rem" }}>
              Confirmar Conclusão do Ciclo
            </Button>
          </form>
        </Modal>
      )}

      {/* Modal: Aviso de Saída Externa */}
      {externalUrlModal && (
        <Modal
          isOpen={true}
          onClose={() => setExternalUrlModal(null)}
          title="Aviso de Saída Externa"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "var(--radius-md)" }}>
              <AlertTriangle size={20} style={{ color: "var(--accent-amber)", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--text-primary)" }}>Você está prestes a sair do Shiori.</strong>
                <p style={{ margin: "0.35rem 0 0 0" }}>
                  O link a seguir foi cadastrado exclusivamente por você em sua conta:
                </p>
                <div style={{ wordBreak: "break-all", background: "var(--bg-surface)", padding: "0.4rem 0.6rem", borderRadius: "var(--radius-sm)", marginTop: "0.5rem", fontFamily: "monospace", color: "var(--brand-light)" }}>
                  {externalUrlModal}
                </div>
              </div>
            </div>

            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Lembramos que o Shiori é um catálogo e rastreador pessoal de leituras e não hospeda, replica, armazena ou redistribui conteúdos de terceiros.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setExternalUrlModal(null)}
              >
                Voltar ao Catálogo
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  window.open(externalUrlModal, "_blank", "noopener,noreferrer");
                  setExternalUrlModal(null);
                }}
              >
                <ExternalLink size={14} />
                <span>Prosseguir para Link Externo</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
