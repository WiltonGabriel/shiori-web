import React, { useState } from "react";
import styles from "./ShelfPage.module.css";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Card } from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { ShelfCardSkeleton } from "../../components/ui/Skeleton/Skeleton";
import { BookOpen, RotateCcw, Compass } from "lucide-react";
import type { ItemCatalogoResponse } from "../../types/catalog.types";
import { useShelf } from "./hooks/useShelf";
import { useShelfPortability } from "./hooks/useShelfPortability";
import { ShelfHeader } from "./components/ShelfHeader";
import { ShelfCard } from "./components/ShelfCard";
import { ShelfTable } from "./components/ShelfTable";
import { ShelfEditModal } from "./components/ShelfEditModal";
import { ShelfCloseCycleModal } from "./components/ShelfCloseCycleModal";
import { SuggestWorkModal } from "../catalog/components/SuggestWorkModal";
import { Plus } from "lucide-react";

export const ShelfPage: React.FC = () => {
  useDocumentTitle(
    "Minha Estante | Shiori",
    "Acompanhe o ritmo de leitura de seus mangás, novels e livros. Registre notas, conclua ciclos e acesse seus links seguros."
  );

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
        onAddManual={() => setIsAddModalOpen(true)}
      />

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <ShelfCardSkeleton key={idx} />
          ))}
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
        <EmptyState
          icon={<BookOpen size={32} />}
          title={`Nenhum item na estante para o filtro "${activeTab}"`}
          description="Sua estante é o seu espaço pessoal e autônomo. Adicione obras à sua estante para acompanhar capítulos e ciclos de releitura!"
          action={{
            label: "Adicionar Obra Manual",
            onClick: () => setIsAddModalOpen(true),
            icon: <Plus size={16} />,
            variant: "primary",
          }}
          secondaryAction={{
            label: "Explorar Catálogo Global",
            href: "/catalogo",
            icon: <Compass size={16} />,
            variant: "secondary",
          }}
        />
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

      <SuggestWorkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onWorkCreated={() => loadShelf()}
      />
    </div>
  );
};
