import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./ShelfPage.module.css";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { HorizontalScroller } from "../../components/ui/HorizontalScroller/HorizontalScroller";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import type { ItemCatalogoResponse, StatusLeitura, Visibilidade } from "../../types/catalog.types";
import {
  Edit3,
  ExternalLink,
  Trash2,
  LogIn,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  Eye,
  Shield,
  Lock,
  Compass,
  Star,
  BookOpen,
} from "lucide-react";

type FilterTab = "TODOS" | "LENDO" | "ENGAVETADO" | "TERMINOU" | "PLANEJADO" | "ABDICOU";

const STATUS_TABS: { value: FilterTab; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "LENDO", label: "Lendo" },
  { value: "ENGAVETADO", label: "Engavetado" },
  { value: "TERMINOU", label: "Terminou" },
  { value: "PLANEJADO", label: "Planejado" },
  { value: "ABDICOU", label: "Abdicou" },
];

export const ShelfPage: React.FC = () => {
  useDocumentTitle(
    "Meu Catálogo | Shiori",
    "Acompanhe o ritmo de leitura de seus mangás, novels e livros. Registre notas, conclua ciclos e acesse seus links seguros."
  );

  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [items, setItems] = useState<ItemCatalogoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("TODOS");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal de Edição Rápida
  const [editingItem, setEditingItem] = useState<ItemCatalogoResponse | null>(null);
  const [capituloAtual, setCapituloAtual] = useState<number>(0);
  const [volumeAtual, setVolumeAtual] = useState<number>(0);
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [visibilidade, setVisibilidade] = useState<Visibilidade>("RESTRITO");
  const [nota, setNota] = useState<number>(0);
  const [anotacao, setAnotacao] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Concluir Ciclo de Leitura
  const [closingCycleItem, setClosingCycleItem] = useState<ItemCatalogoResponse | null>(null);
  const [cycleRating, setCycleRating] = useState<number>(10);
  const [cycleNote, setCycleNote] = useState<string>("");
  const [cycleDate, setCycleDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [isClosingCycle, setIsClosingCycle] = useState(false);

  // Modal de Segurança para Redirecionamento Externo
  const [safetyModalUrl, setSafetyModalUrl] = useState<string | null>(null);

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
      return items.filter((i) => i.statusLeitura === "DROPOU" || (i.statusLeitura as any) === "ABDICOU");
    }
    return items.filter((i) => i.statusLeitura === activeTab);
  }, [items, activeTab]);

  // Contagem para cada aba
  const tabCounts = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      TODOS: items.length,
      LENDO: 0,
      ENGAVETADO: 0,
      TERMINOU: 0,
      PLANEJADO: 0,
      ABDICOU: 0,
    };
    items.forEach((item) => {
      if (item.statusLeitura === "LENDO") counts.LENDO++;
      else if (item.statusLeitura === "ENGAVETADO") counts.ENGAVETADO++;
      else if (item.statusLeitura === "TERMINOU") counts.TERMINOU++;
      else if (item.statusLeitura === "PLANEJADO") counts.PLANEJADO++;
      else if (item.statusLeitura === "DROPOU" || (item.statusLeitura as any) === "ABDICOU") counts.ABDICOU++;
    });
    return counts;
  }, [items]);

  // Botão +1 Otimista
  const handleQuickIncrement = async (item: ItemCatalogoResponse) => {
    const proximoCap = (item.progressoAtual || 0) + 1;
    const anterior = item.progressoAtual;

    // Atualização otimista
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, progressoAtual: proximoCap } : i))
    );

    try {
      const atualizado = await CatalogService.updateProgress(item.id, {
        capituloAtual: proximoCap,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura,
      });

      setItems((prev) => prev.map((i) => (i.id === item.id ? atualizado : i)));
      toast.success(`Capítulo ${proximoCap} registrado para ${item.obraTitulo}!`);
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, progressoAtual: anterior } : i))
      );
      toast.error(err, "Erro ao Registrar Progresso");
    }
  };

  const handleOpenEdit = (item: ItemCatalogoResponse) => {
    setEditingItem(item);
    setCapituloAtual(item.progressoAtual || 0);
    setVolumeAtual(item.volumeAtual || 0);
    setStatusLeitura(item.statusLeitura);
    setVisibilidade(item.visibilidade || "RESTRITO");
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

      if (visibilidade !== editingItem.visibilidade) {
        await CatalogService.updateVisibility(editingItem.id, { visibilidade });
        atualizado.visibilidade = visibilidade;
      }

      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? atualizado : i)));
      toast.success("Progresso e preferências atualizados!");
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
      toast.success(
        `Ciclo de leitura finalizado com nota ${cycleRating} para ${closingCycleItem.obraTitulo}!`,
        "Ciclo Concluído"
      );
      setClosingCycleItem(null);
    } catch (err: any) {
      toast.error(err, "Erro ao Concluir Ciclo");
    } finally {
      setIsClosingCycle(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm("Deseja realmente remover esta obra da sua estante pessoal?")) {
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

  const renderVisibilityBadge = (vis: Visibilidade) => {
    switch (vis) {
      case "PUBLICO":
        return (
          <span className={styles.visibilityBadge} title="Leitura visível publicamente no seu perfil">
            <Eye size={11} style={{ color: "var(--brand-light)" }} />
            <span>Público</span>
          </span>
        );
      case "PRIVADO":
        return (
          <span className={styles.visibilityBadge} title="Leitura estritamente privada">
            <Lock size={11} style={{ color: "var(--accent-rose)" }} />
            <span>Privado</span>
          </span>
        );
      case "RESTRITO":
      default:
        return (
          <span className={styles.visibilityBadge} title="Visível apenas para você e conexões mútuas">
            <Shield size={11} style={{ color: "#34D399" }} />
            <span>Restrito</span>
          </span>
        );
    }
  };

  const renderStatusBadge = (status: StatusLeitura) => {
    switch (status) {
      case "LENDO":
        return <Badge variant="brand">Lendo</Badge>;
      case "TERMINOU":
        return <Badge variant="success">Terminou</Badge>;
      case "ENGAVETADO":
        return <Badge variant="warning">Engavetado</Badge>;
      case "PLANEJADO":
        return <Badge variant="neutral">Planejado</Badge>;
      case "DROPOU":
      case "ABDICOU" as any:
        return <Badge variant="neutral">Abdicou</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 580, margin: "3rem auto" }}>
        <Card style={{ textAlign: "center", padding: "3.5rem 2rem" }}>
          <BookOpen size={42} style={{ color: "var(--brand-light)", margin: "0 auto 1.25rem" }} />
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "0.5rem" }}>
            Acesso à Estante Pessoal
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
            Faça login para acompanhar o progresso de suas obras capítulo a capítulo, registrar notas de ciclos e gerenciar seus links seguros de leitura.
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="primary"
              size="md"
              onClick={openAuthModal}
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
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.title}>Meu Catálogo</h1>
            <p className={styles.subtitle}>
              Sua estante pessoal e diário de leitura. Acompanhe seu ritmo capítulo a capítulo, registre anotações e conclua ciclos.
            </p>
          </div>

          <Link to="/catalogo">
            <Button variant="secondary" size="sm">
              <Compass size={16} />
              <span>Explorar Catálogo Global</span>
            </Button>
          </Link>
        </div>

        {/* Barra de Controles: Abas de Estado e Alternador Visual */}
        <div className={styles.controlsRow}>
          <div className={styles.tabsContainer}>
            <HorizontalScroller
              step={220}
              ariaLabel="Abas de filtro da estante"
              showFade
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab(tab.value)}
                  role="tab"
                  aria-selected={activeTab === tab.value}
                >
                  <span>{tab.label}</span>
                  <span className={styles.tabCount}>{tabCounts[tab.value]}</span>
                </button>
              ))}
            </HorizontalScroller>
          </div>

          <div className={styles.viewToggle} role="group" aria-label="Modo de visualização">
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === "grid" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              title="Visão em Grade"
              aria-label="Visão em Grade"
            >
              <LayoutGrid size={15} />
              <span>Grade</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === "list" ? styles.toggleBtnActive : ""}`}
              onClick={() => setViewMode("list")}
              title="Visão em Lista"
              aria-label="Visão em Lista"
            >
              <List size={15} />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
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
        <Card style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
          <BookOpen size={36} style={{ color: "var(--border-light)", margin: "0 auto 1rem auto" }} />
          <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Nenhum item na estante para o filtro{" "}
            <strong>
              {STATUS_TABS.find((t) => t.value === activeTab)?.label || activeTab}
            </strong>
          </p>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Adicione obras através do catálogo global para acompanhar seu ritmo de leitura!
          </p>
          <Link to="/catalogo">
            <Button variant="primary" size="sm" style={{ margin: "0 auto" }}>
              <Compass size={16} />
              <span>Explorar Catálogo</span>
            </Button>
          </Link>
        </Card>
      ) : viewMode === "grid" ? (
        /* ===================================================================
         * VISÃO EM GRADE (Cards com Capas 3:4)
         * =================================================================== */
        <div className={styles.grid}>
          {filteredItems.map((item) => {
            const hasTotalCap = item.obraTotalCapitulos !== undefined && item.obraTotalCapitulos > 0;
            const percentCap = hasTotalCap
              ? Math.min(
                  100,
                  Math.round(((item.progressoAtual || 0) / (item.obraTotalCapitulos || 1)) * 100)
                )
              : 0;

            return (
              <div key={item.id} className={styles.shelfCard}>
                <div className={styles.coverWrapper}>
                  {item.obraCapaUrl ? (
                    <img
                      src={item.obraCapaUrl}
                      alt={item.obraTitulo}
                      className={styles.coverImg}
                      loading="lazy"
                    />
                  ) : (
                    <BookOpen size={24} style={{ color: "var(--text-muted)" }} />
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeaderRow}>
                    <h3 className={styles.cardTitle} title={item.obraTitulo}>
                      {item.obraTitulo}
                    </h3>
                    {renderVisibilityBadge(item.visibilidade)}
                  </div>

                  <div className={styles.progressInfo}>
                    {renderStatusBadge(item.statusLeitura)}
                    <span>
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

                  <div className={styles.cardMetaRow}>
                    {item.obraTotalVolumes ? (
                      <span>Vol. {item.volumeAtual || 0} / {item.obraTotalVolumes}</span>
                    ) : null}
                    {item.avaliacaoPessoal !== undefined && item.avaliacaoPessoal > 0 && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-amber)" }}>
                        <Star size={11} fill="currentColor" />
                        {item.avaliacaoPessoal.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      className={styles.quickPlusBtn}
                      onClick={() => handleQuickIncrement(item)}
                      title={`Incrementar +1 capítulo de ${item.obraTitulo}`}
                      aria-label={`Incrementar +1 capítulo de ${item.obraTitulo}`}
                    >
                      +1
                    </button>

                    <button
                      type="button"
                      className={styles.cycleBtn}
                      onClick={() => handleOpenCloseCycle(item)}
                      title="Registrar conclusão de ciclo com nota e anotação"
                    >
                      <CheckCircle size={13} />
                      <span>Registro de Ciclo</span>
                    </button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      title="Editar detalhes do progresso"
                      aria-label="Editar progresso"
                    >
                      <Edit3 size={13} />
                    </Button>

                    {item.urlLeitura && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSafetyModalUrl(item.urlLeitura!)}
                        title="Abrir link privado de leitura"
                        style={{ color: "var(--brand-light)" }}
                        aria-label="Abrir link externo de leitura"
                      >
                        <ExternalLink size={13} />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      title="Remover da estante"
                      style={{ marginLeft: "auto", color: "var(--accent-rose)" }}
                      aria-label="Remover obra da estante"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===================================================================
         * VISÃO EM LISTA (Tabela Compacta com Rolagem Interna)
         * =================================================================== */
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>Capa</th>
                <th>Obra</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 160 }}>Progresso</th>
                <th style={{ width: 110 }}>Visibilidade</th>
                <th style={{ textAlign: "right", width: 220 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const hasTotalCap = item.obraTotalCapitulos !== undefined && item.obraTotalCapitulos > 0;
                const percentCap = hasTotalCap
                  ? Math.min(
                      100,
                      Math.round(((item.progressoAtual || 0) / (item.obraTotalCapitulos || 1)) * 100)
                    )
                  : 0;

                return (
                  <tr key={item.id}>
                    <td>
                      {item.obraCapaUrl ? (
                        <img
                          src={item.obraCapaUrl}
                          alt={item.obraTitulo}
                          className={styles.tableCover}
                        />
                      ) : (
                        <div
                          style={{
                            width: 36,
                            height: 48,
                            borderRadius: "var(--radius-sm)",
                            background: "var(--bg-surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BookOpen size={16} style={{ color: "var(--text-muted)" }} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.tableObraCell}>
                        <div>
                          <span className={styles.tableTitle}>{item.obraTitulo}</span>
                          {item.avaliacaoPessoal !== undefined && item.avaliacaoPessoal > 0 && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: "var(--accent-amber)",
                                fontSize: "0.7rem",
                                marginTop: "0.15rem",
                              }}
                            >
                              <Star size={11} fill="currentColor" />
                              Nota: {item.avaliacaoPessoal.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{renderStatusBadge(item.statusLeitura)}</td>
                    <td>
                      <div className={styles.tableProgress}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          {hasTotalCap
                            ? `Cap. ${item.progressoAtual || 0} / ${item.obraTotalCapitulos}`
                            : `Cap. ${item.progressoAtual || 0}`}
                        </span>
                        <div className={styles.progressBarContainer} style={{ height: 4 }}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: hasTotalCap ? `${percentCap}%` : "100%" }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{renderVisibilityBadge(item.visibilidade)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        <button
                          type="button"
                          className={styles.quickPlusBtn}
                          onClick={() => handleQuickIncrement(item)}
                          title="Avançar +1 capítulo"
                          aria-label={`Incrementar +1 capítulo de ${item.obraTitulo}`}
                        >
                          +1
                        </button>

                        <button
                          type="button"
                          className={styles.cycleBtn}
                          onClick={() => handleOpenCloseCycle(item)}
                          title="Registro de ciclo"
                        >
                          <CheckCircle size={12} />
                          <span>Ciclo</span>
                        </button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          title="Editar progresso"
                          aria-label="Editar"
                        >
                          <Edit3 size={13} />
                        </Button>

                        {item.urlLeitura && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSafetyModalUrl(item.urlLeitura!)}
                            title="Abrir link de leitura"
                            style={{ color: "var(--brand-light)" }}
                            aria-label="Link externo"
                          >
                            <ExternalLink size={13} />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item.id)}
                          title="Remover"
                          style={{ color: "var(--accent-rose)" }}
                          aria-label="Remover"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================================
       * MODAL 1: REGISTRO DE CICLO CONCLUÍDO
       * =================================================================== */}
      {closingCycleItem && (
        <Modal
          isOpen={true}
          onClose={() => setClosingCycleItem(null)}
          title={`Registro de Ciclo: ${closingCycleItem.obraTitulo}`}
        >
          <form onSubmit={handleConfirmCloseCycle} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className={styles.cycleModalHeader}>
              {closingCycleItem.obraCapaUrl && (
                <img
                  src={closingCycleItem.obraCapaUrl}
                  alt={closingCycleItem.obraTitulo}
                  className={styles.cycleCoverMini}
                />
              )}
              <div>
                <strong style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                  {closingCycleItem.obraTitulo}
                </strong>
                <p style={{ margin: "0.2rem 0 0 0", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                  Conclusão do ciclo de leitura. Ao salvar, a obra será marcada como <strong>Terminou</strong> e registrada em seu histórico.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Nota do Ciclo (0 a 10)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={cycleRating}
                    onChange={(e) => setCycleRating(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                    style={{
                      padding: "0.65rem 0.95rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                      fontSize: "var(--text-sm)",
                      width: "100%",
                      outline: "none",
                    }}
                  />
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-amber)", fontWeight: 800, fontSize: "var(--text-sm)" }}>
                    <Star size={16} fill="currentColor" />
                    {cycleRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <Input
                label="Data de Conclusão"
                type="date"
                value={cycleDate}
                onChange={(e) => setCycleDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Anotações e Reflexões Pessoais (Opcional)
              </label>
              <textarea
                placeholder="Escreva suas impressões sobre o desfecho, personagens e narrativa..."
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setClosingCycleItem(null)}
                disabled={isClosingCycle}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isClosingCycle}
              >
                <CheckCircle size={16} />
                <span>Salvar Ciclo Concluído</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===================================================================
       * MODAL 2: AVISO DISCRETO DE SEGURANÇA PARA LINK EXTERNO
       * =================================================================== */}
      {safetyModalUrl && (
        <Modal
          isOpen={true}
          onClose={() => setSafetyModalUrl(null)}
          title="Redirecionamento para Site Externo"
        >
          <div>
            <div className={styles.safetyModalWarning}>
              <AlertTriangle size={24} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", display: "block", marginBottom: "0.2rem" }}>
                  Aviso de Segurança
                </strong>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Você está sendo redirecionado para fora do domínio do Shiori. Este endereço foi registrado exclusivamente em sua estante privada como atalho de leitura.
                </p>
              </div>
            </div>

            <div className={styles.safetyUrlBox}>{safetyModalUrl}</div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button variant="secondary" size="md" onClick={() => setSafetyModalUrl(null)}>
                Voltar ao Shiori
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  window.open(safetyModalUrl, "_blank", "noopener,noreferrer");
                  setSafetyModalUrl(null);
                }}
              >
                <ExternalLink size={16} />
                <span>Continuar para o Site</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================================================================
       * MODAL 3: EDITAR DETALHES DO PROGRESSO
       * =================================================================== */}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Status de Leitura
                </label>
                <select
                  value={statusLeitura}
                  onChange={(e) => setStatusLeitura(e.target.value as StatusLeitura)}
                  style={{
                    padding: "0.65rem 0.95rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    minHeight: "var(--touch-target-min)",
                    outline: "none",
                  }}
                >
                  <option value="LENDO">Lendo</option>
                  <option value="ENGAVETADO">Engavetado</option>
                  <option value="TERMINOU">Terminou</option>
                  <option value="PLANEJADO">Planejado</option>
                  <option value="DROPOU">Abdicou</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Visibilidade da Leitura
                </label>
                <select
                  value={visibilidade}
                  onChange={(e) => setVisibilidade(e.target.value as Visibilidade)}
                  style={{
                    padding: "0.65rem 0.95rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    minHeight: "var(--touch-target-min)",
                    outline: "none",
                  }}
                >
                  <option value="PUBLICO">Público (Visível no perfil)</option>
                  <option value="RESTRITO">Restrito (Conexões mútuas)</option>
                  <option value="PRIVADO">Privado (Apenas você)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Nota Pessoal (0 a 10)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={nota}
                onChange={(e) => setNota(parseFloat(e.target.value) || 0)}
                style={{
                  padding: "0.65rem 0.95rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  minHeight: "var(--touch-target-min)",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
                Anotação / Registro
              </label>
              <textarea
                placeholder="Adicione uma anotação ou reflexão sobre este momento da leitura..."
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                rows={2}
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
                variant="secondary"
                size="md"
                onClick={() => setEditingItem(null)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ShelfPage;
