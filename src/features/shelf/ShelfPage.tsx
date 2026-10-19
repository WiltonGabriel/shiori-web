import React, { useEffect, useState, useMemo } from "react";
import styles from "./ShelfPage.module.css";
import { CatalogService } from "../../services/catalog.service";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { useAuthStore } from "../../store/authStore";
import type { ItemCatalogoResponse, StatusLeitura } from "../../types/catalog.types";
import { Plus, ExternalLink, Edit3, Trash2, BookOpen } from "lucide-react";

const STATUS_TABS: (StatusLeitura | "TODOS")[] = [
  "TODOS",
  "LENDO",
  "FADIGOU",
  "TERMINOU",
  "PLANEJADO",
  "PAUSADO",
  "DROPOU",
];

export const ShelfPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<ItemCatalogoResponse[]>([]);
  const [activeTab, setActiveTab] = useState<StatusLeitura | "TODOS">("TODOS");
  const [isLoading, setIsLoading] = useState(() => isAuthenticated);

  // Modal para atualizar progresso detalhado
  const [editingItem, setEditingItem] = useState<ItemCatalogoResponse | null>(null);
  const [capituloAtual, setCapituloAtual] = useState(0);
  const [volumeAtual, setVolumeAtual] = useState(0);
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [nota, setNota] = useState(0);
  const [anotacao, setAnotacao] = useState("");
  const [isSaving, setIsSaving] = useState(false);


  const loadShelf = async () => {
    try {
      setIsLoading(true);
      const data = await CatalogService.getMyShelf();
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadShelf();
    }
  }, [isAuthenticated]);

  const filteredItems = useMemo(() => {
    if (activeTab === "TODOS") return items;
    return items.filter((i) => i.statusLeitura === activeTab);
  }, [items, activeTab]);

  const handleQuickIncrement = async (item: ItemCatalogoResponse) => {
    const nextChapter = (item.progressoAtual || 0) + 1;
    try {
      const updated = await CatalogService.updateProgress(item.id, {
        capituloAtual: nextChapter,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert(err.message || "Falha ao avançar capítulo.");
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

    setIsSaving(true);
    try {
      const updated = await CatalogService.updateProgress(editingItem.id, {
        capituloAtual,
        volumeAtual: volumeAtual || undefined,
        statusLeitura,
        nota: nota > 0 ? nota : undefined,
        anotacao: anotacao.trim() || undefined,
      });
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      setEditingItem(null);
    } catch (err: any) {
      alert(err.message || "Erro ao salvar progresso.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (itemId: number) => {
    if (!window.confirm("Deseja realmente remover esta obra da sua estante?")) return;
    try {
      await CatalogService.removeItemFromShelf(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || "Falha ao remover item.");
    }
  };

  if (!isAuthenticated) {
    return (
      <Card style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: 500, margin: "2rem auto" }}>
        <BookOpen size={48} style={{ margin: "0 auto 1rem", color: "var(--brand-light)" }} />
        <h2 style={{ marginBottom: "0.5rem" }}>Sua Estante Pessoal</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "1.5rem" }}>
          Faça login para acompanhar o progresso das suas leituras e salvar links privados.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Minha Estante</h1>
        <p className={styles.subtitle}>
          Gerencie seu ritmo de leitura, ciclos de releitura e acesse rapidamente seus links de leitura.
        </p>

        <div className={styles.tabs}>
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              className={`${styles.tab} ${activeTab === status ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Nenhum item na estante para o filtro <strong>{activeTab}</strong>.
        </Card>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => (
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
                    {item.statusLeitura}
                  </Badge>
                  <span className={styles.progressText}>Cap. {item.progressoAtual || 0}</span>
                </div>

                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickIncrement(item)}
                    title="Avançar 1 capítulo"
                  >
                    <Plus size={14} />
                    <span>+1</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    title="Editar progresso detalhado"
                  >
                    <Edit3 size={14} />
                  </Button>

                  {item.urlLeitura && (
                    <a
                      href={item.urlLeitura}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Abrir leitor privado"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink size={14} />
                      </Button>
                    </a>
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
          ))}
        </div>
      )}

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
              <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 500 }}>
                Status de Leitura
              </label>
              <select
                className="glass-input"
                style={{ padding: "0.65rem 0.95rem", minHeight: "var(--touch-target-min)" }}
                value={statusLeitura}
                onChange={(e) => setStatusLeitura(e.target.value as StatusLeitura)}
              >
                {STATUS_TABS.filter((t) => t !== "TODOS").map((s) => (
                  <option key={s} value={s} style={{ background: "#0E1017", color: "#FFF" }}>
                    {s}
                  </option>
                ))}
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
    </div>
  );
};
