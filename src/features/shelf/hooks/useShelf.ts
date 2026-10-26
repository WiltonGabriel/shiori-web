import { useState, useEffect, useMemo, useCallback } from "react";
import { CatalogService } from "../../../services/catalog.service";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "../../../store/toastStore";
import type { ItemCatalogoResponse } from "../../../types/catalog.types";
import { countByTab, filterByTab, type FilterTab } from "../domain/shelfFilters";

export type { FilterTab };

export const STATUS_TABS: { value: FilterTab; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "LENDO", label: "Lendo" },
  { value: "PLANEJADO", label: "Quero ler" },
  { value: "ENGAVETADO", label: "Engavetado" },
  { value: "TERMINOU", label: "Concluído" },
  { value: "ABDICOU", label: "Abandonado" },
];

export function useShelf() {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<ItemCatalogoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(isAuthenticated));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("TODOS");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadShelf = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await CatalogService.getMyShelf(0, 100);
      setItems(res || []);
    } catch (err) {
      console.error("Falha ao carregar estante:", err);
      setLoadError("Não foi possível carregar sua estante no momento.");
      toast.error(err, "Falha ao Carregar Estante");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    CatalogService.getMyShelf(0, 100)
      .then((res) => {
        if (!isMounted) return;
        setItems(res || []);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("Falha ao carregar estante:", err);
        setLoadError("Não foi possível carregar sua estante no momento.");
        toast.error(err, "Falha ao Carregar Estante");
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const filteredItems = useMemo(() => filterByTab(items, activeTab), [items, activeTab]);

  const tabCounts = useMemo(() => countByTab(items), [items]);

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
      toast.success(`Capítulo ${proximoCap} registrado para ${item.titulo || item.obraTitulo}!`);
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, progressoAtual: anterior } : i))
      );
      toast.error(err, "Erro ao Registrar Progresso");
    }
  };

  const handleUpdateMetaCapitulos = async (itemId: number) => {
    try {
      await CatalogService.atualizarMetaCapitulos(itemId);
      toast.success(
        "Meta de capítulos atualizada com sucesso sem alterar seu progresso!",
        "Capítulos Atualizados"
      );
      loadShelf();
    } catch (err) {
      toast.error(err, "Falha ao Atualizar Meta");
    }
  };

  const handleUnlink = async (itemId: number) => {
    if (
      !window.confirm(
        "Deseja desvincular esta obra do Catálogo Global? Seus metadados locais, progresso e notas permanecerão 100% seguros."
      )
    ) {
      return;
    }
    try {
      await CatalogService.desvincularObra(itemId);
      toast.success(
        "Obra desvinculada com sucesso! Agora é um registro estritamente local e isolado.",
        "Isolamento Local Ativo"
      );
      loadShelf();
    } catch (err) {
      toast.error(err, "Falha ao Desvincular Obra");
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
    } catch (err) {
      toast.error(err, "Erro ao Remover");
    }
  };

  const updateItemInList = (updated: ItemCatalogoResponse) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  return {
    items,
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
  };
}
