import { useState, useEffect, useMemo, useCallback } from "react";
import { WorkService } from "../../../services/work.service";
import { toast } from "../../../store/toastStore";
import { useDebounce } from "../../../hooks/useDebounce";
import type {
  ObraResponse,
  TipoObra,
  StatusPublicacao,
  SortOption,
} from "../../../types/work.types";

import { isLocalMode } from "../../../services/api/httpClient";

export const PAGE_SIZE = 15;

export interface AssistedNotice {
  formatos: TipoObra[];
  mensagem?: string | null;
}

export const QUICK_TYPES: { value: TipoObra | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos os Tipos" },
  { value: "MANGA", label: "Mangá" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "MANHUA", label: "Manhua" },
  { value: "LIGHT_NOVEL", label: "Light Novel" },
  { value: "WEB_NOVEL", label: "Web Novel" },
  { value: "COMIC", label: "Comic / HQ" },
  { value: "LIVRO", label: "Livro Tradicional" },
];

export const QUICK_STATUSES: { value: StatusPublicacao | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Qualquer Status" },
  { value: "EM_LANCAMENTO", label: "Em Lançamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "EM_HIATO", label: "Em Hiato" },
];

export function useCatalog() {
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => !isLocalMode());
  const [assistedNotice, setAssistedNotice] = useState<AssistedNotice | null>(null);

  // Filtros
  const [searchInput, setSearchInputState] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [selectedType, setSelectedTypeState] = useState<TipoObra | "TODOS">("TODOS");
  const [selectedStatus, setSelectedStatusState] = useState<StatusPublicacao | "TODOS">("TODOS");
  const [sortBy, setSortByState] = useState<SortOption>("NOTA_DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const fetchWorks = useCallback(async () => {
    if (isLocalMode()) {
      setWorks([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      if (debouncedSearch.trim()) {
        const result = await WorkService.searchWorksAssisted(debouncedSearch.trim());
        setWorks(result.obras || []);
        if (result.correspondenciasEmOutrosFormatos && (!result.obras || result.obras.length === 0)) {
          setAssistedNotice({
            formatos: result.formatosDetectadosNaoPermitidos,
            mensagem: result.mensagemContextual,
          });
        } else {
          setAssistedNotice(null);
        }
      } else {
        setAssistedNotice(null);
        const data = await WorkService.listWorks();
        setWorks(data || []);
      }
    } catch (err: any) {
      console.error("Falha ao buscar catálogo:", err);
      toast.error(err, "Falha ao Carregar Catálogo");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    let isMounted = true;
    if (isLocalMode()) {
      return;
    }

    if (debouncedSearch.trim()) {
      WorkService.searchWorksAssisted(debouncedSearch.trim())
        .then((result) => {
          if (!isMounted) return;
          setWorks(result.obras || []);
          if (result.correspondenciasEmOutrosFormatos && (!result.obras || result.obras.length === 0)) {
            setAssistedNotice({
              formatos: result.formatosDetectadosNaoPermitidos,
              mensagem: result.mensagemContextual,
            });
          } else {
            setAssistedNotice(null);
          }
          setIsLoading(false);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          console.error("Falha ao buscar catálogo:", err);
          toast.error(err, "Falha ao Carregar Catálogo");
          setIsLoading(false);
        });
    } else {
      WorkService.listWorks()
        .then((data) => {
          if (!isMounted) return;
          setAssistedNotice(null);
          setWorks(data || []);
          setIsLoading(false);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          console.error("Falha ao buscar catálogo:", err);
          toast.error(err, "Falha ao Carregar Catálogo");
          setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Filtragem e ordenação
  const filteredWorks = useMemo(() => {
    const result = works.filter((w) => {
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchTitle = w.tituloPrincipal.toLowerCase().includes(q);
        const matchOriginal = w.tituloOriginal?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchOriginal) return false;
      }

      if (selectedType !== "TODOS" && w.tipoObra !== selectedType) {
        return false;
      }

      if (selectedStatus !== "TODOS" && w.statusPublicacao !== selectedStatus) {
        return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === "NOTA_DESC") {
        return (b.notaGeral || 0) - (a.notaGeral || 0);
      }
      if (sortBy === "CAPITULOS_DESC") {
        return (b.totalCapitulosLancados || 0) - (a.totalCapitulosLancados || 0);
      }
      if (sortBy === "TITULO_ASC") {
        return a.tituloPrincipal.localeCompare(b.tituloPrincipal);
      }
      if (sortBy === "RECENTES") {
        return b.id - a.id;
      }
      return 0;
    });
  }, [works, debouncedSearch, selectedType, selectedStatus, sortBy]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredWorks.slice(start, start + PAGE_SIZE);
  }, [filteredWorks, currentPage]);

  const setSearchInput = (value: string) => {
    setSearchInputState(value);
    setCurrentPage(1);
  };

  const setSelectedType = (value: TipoObra | "TODOS") => {
    setSelectedTypeState(value);
    setCurrentPage(1);
  };

  const setSelectedStatus = (value: StatusPublicacao | "TODOS") => {
    setSelectedStatusState(value);
    setCurrentPage(1);
  };

  const setSortBy = (value: SortOption) => {
    setSortByState(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInputState("");
    setSelectedTypeState("TODOS");
    setSelectedStatusState("TODOS");
    setSortByState("NOTA_DESC");
    setCurrentPage(1);
  };

  return {
    works,
    filteredWorks,
    paginatedWorks,
    isLoading,
    assistedNotice,
    searchInput,
    setSearchInput,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    totalPages,
    isAdvancedOpen,
    setIsAdvancedOpen,
    fetchWorks,
    handleResetFilters,
  };
}
