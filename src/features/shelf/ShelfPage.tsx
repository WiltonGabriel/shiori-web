import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ShelfPage.module.css";
import { useAuthStore } from "../../store/authStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Card } from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { BookOpen, LogIn, RotateCcw, Compass } from "lucide-react";
import type { ItemCatalogoResponse } from "../../types/catalog.types";
import { useShelf } from "./hooks/useShelf";
import { useShelfPortability } from "./hooks/useShelfPortability";
import { ShelfHeader } from "./components/ShelfHeader";
import { ShelfCard } from "./components/ShelfCard";
import { ShelfTable } from "./components/ShelfTable";
import { ShelfEditModal } from "./components/ShelfEditModal";
import { ShelfCloseCycleModal } from "./components/ShelfCloseCycleModal";
import { ShelfSafetyModal } from "./components/ShelfSafetyModal";

export const ShelfPage: React.FC = () => {
  useDocumentTitle(
    "Meu Catálogo | Shiori",
    "Acompanhe o ritmo de leitura de seus mangás, novels e livros. Registre notas, conclua ciclos e acesse seus links seguros."
  );

  const { isAuthenticated, openAuthModal } = useAuthStore();
  const {
    filteredItems,
    isLoading,
    loadError,
    activeTab,
    setActiveTab,
    tabCounts,
    viewMode,
    setViewMode,
    loadShelf,
    handleQuickIncrement,
    handleUpdateMetaCapitulos,
    handleUnlink,
    handleRemove,
    updateItemInList,
  } = useShelf();

  const { exportShelf, importShelf } = useShelfPortability(loadShelf);

  // Estados dos Modais
  const [editingItem, setEditingItem] = useState<ItemCatalogoResponse | null>(null);
  const [closingCycleItem, setClosingCycleItem] = useState<ItemCatalogoResponse | null>(null);
  const [safetyModalUrl, setSafetyModalUrl] = useState<string | null>(null);

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
            <Button variant="primary" size="md" onClick={openAuthModal}>
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
      <ShelfHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabCounts={tabCounts}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExport={exportShelf}
        onImport={importShelf}
      />

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
            Nenhum item na estante para o filtro <strong>{activeTab}</strong>
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
        <div className={styles.grid}>
          {filteredItems.map((item) => (
            <ShelfCard
              key={item.id}
              item={item}
              onQuickIncrement={handleQuickIncrement}
              onOpenCycle={(i) => setClosingCycleItem(i)}
              onOpenEdit={(i) => setEditingItem(i)}
              onUnlink={handleUnlink}
              onOpenSafetyUrl={(url) => setSafetyModalUrl(url)}
              onRemove={handleRemove}
              onUpdateMeta={handleUpdateMetaCapitulos}
            />
          ))}
        </div>
      ) : (
        <ShelfTable
          items={filteredItems}
          onQuickIncrement={handleQuickIncrement}
          onOpenCycle={(i) => setClosingCycleItem(i)}
          onOpenEdit={(i) => setEditingItem(i)}
          onUnlink={handleUnlink}
          onOpenSafetyUrl={(url) => setSafetyModalUrl(url)}
          onRemove={handleRemove}
          onUpdateMeta={handleUpdateMetaCapitulos}
        />
      )}

      {/* Modais com responsabilidade única */}
      <ShelfEditModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSaved={updateItemInList}
      />

      <ShelfCloseCycleModal
        item={closingCycleItem}
        isOpen={Boolean(closingCycleItem)}
        onClose={() => setClosingCycleItem(null)}
        onCycleClosed={updateItemInList}
      />

      <ShelfSafetyModal
        url={safetyModalUrl}
        isOpen={Boolean(safetyModalUrl)}
        onClose={() => setSafetyModalUrl(null)}
      />
    </div>
  );
};
