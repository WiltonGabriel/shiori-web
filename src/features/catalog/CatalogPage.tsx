import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CatalogPage.module.css";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { HorizontalScroller } from "../../components/ui/HorizontalScroller/HorizontalScroller";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { CatalogCardSkeleton } from "../../components/ui/Skeleton/Skeleton";
import {
  TIPO_OBRA_LABELS,
  type ObraResponse,
  type SortOption,
} from "../../types/work.types";
import { IncorporationModal } from "./components/IncorporationModal";
import { CatalogCard } from "./components/CatalogCard";
import { SuggestWorkModal } from "./components/SuggestWorkModal";
import type { AdicionarItemCatalogoRequest } from "../../types/catalog.types";
import {
  useCatalog,
  QUICK_TYPES,
  QUICK_STATUSES,
} from "./hooks/useCatalog";
import {
  Search,
  SlidersHorizontal,
  BookPlus,
  ChevronLeft,
  ChevronRight,
  EyeOff,
} from "lucide-react";

export const CatalogPage: React.FC = () => {
  useDocumentTitle(
    "Catálogo | Shiori",
    "Explore e descubra mangás, novels, manhwas, comics e livros no catálogo do Shiori. Filtre por gênero, formato literário e status de publicação."
  );

  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  const {
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
  } = useCatalog();

  // Estados dos Modais
  const [selectedWork, setSelectedWork] = useState<ObraResponse | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const handleOpenAddModal = (work: ObraResponse) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setSelectedWork(work);
  };

  const handleConfirmIncorporation = async (payload: AdicionarItemCatalogoRequest) => {
    try {
      setIsAdding(true);
      await CatalogService.addItemToShelf(payload);
      toast.success(
        `"${payload.titulo || selectedWork?.tituloPrincipal}" incorporado com sucesso à sua estante pessoal!`,
        "Estante Atualizada"
      );
      setSelectedWork(null);
    } catch (err: any) {
      toast.error(err, "Falha ao Incorporar Obra");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.title}>Catálogo Global</h1>
            <p className={styles.subtitle}>
              Explore e descubra obras catalogadas pela comunidade. Pesquise por títulos, filtre por tipo ou sugira novas obras.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal();
                return;
              }
              setIsSuggestModalOpen(true);
            }}
          >
            <BookPlus size={17} />
            <span>Sugerir Obra Manual</span>
          </Button>
        </div>

        {/* 1. Barra de Busca Central com Debounce */}
        <div className={styles.searchSection}>
          <div className={styles.searchBarWrapper}>
            <div className={styles.searchInputArea}>
              <Input
                placeholder="Buscar por título, autor ou gênero..."
                leadingIcon={<Search size={16} />}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              title="Ordenar catálogo"
            >
              <option value="NOTA_DESC">Maior Avaliação</option>
              <option value="CAPITULOS_DESC">Mais Capítulos</option>
              <option value="TITULO_ASC">Título (A-Z)</option>
              <option value="RECENTES">Recentes</option>
            </select>

            <button
              type="button"
              className={`${styles.filterToggleBtn} ${isAdvancedOpen ? styles.filterToggleActive : ""}`}
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              title="Filtros avançados"
            >
              <SlidersHorizontal size={15} />
              <span>Filtros</span>
            </button>
          </div>

          {/* 2. Filtros por Facetas com Rolagem Horizontal Suave */}
          <div className={styles.quickFiltersRow}>
            <HorizontalScroller step={240} ariaLabel="Filtro rápido por formato literário">
              {QUICK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`${styles.quickChip} ${
                    selectedType === type.value ? styles.quickChipActive : ""
                  }`}
                  onClick={() => {
                    setSelectedType(type.value);
                    setCurrentPage(1);
                  }}
                >
                  {type.label}
                </button>
              ))}
            </HorizontalScroller>
          </div>

          {/* Painel Avançado Expandido */}
          {isAdvancedOpen && (
            <div className={styles.advancedPanel}>
              <div className={styles.panelSection}>
                <span className={styles.panelSectionTitle}>Status de Publicação</span>
                <div className={styles.chipGroup}>
                  {QUICK_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      className={`${styles.quickChip} ${
                        selectedStatus === status.value ? styles.quickChipActive : ""
                      }`}
                      onClick={() => {
                        setSelectedStatus(status.value);
                        setCurrentPage(1);
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Limpar Todos os Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Grade de Resultados de Cartões de Obra */}
      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <CatalogCardSkeleton key={idx} />
          ))}
        </div>
      ) : assistedNotice ? (
        <div className={styles.assistedNoticeCard}>
          <div className={styles.noticeIconArea}>
            <EyeOff size={28} />
          </div>
          <div>
            <h3 className={styles.noticeTitle}>
              Obras encontradas em formatos não ativados
            </h3>
            <p className={styles.noticeDescription}>
              Encontramos obras correspondentes ao termo de busca, mas exclusivamente em formatos que estão desativados nas suas preferências de leitura.
            </p>
          </div>
          <div className={styles.detectedFormatsList}>
            {assistedNotice.formatos.map((fmt) => (
              <span key={fmt} className={styles.detectedFormatChip}>
                {TIPO_OBRA_LABELS[fmt] || fmt}
              </span>
            ))}
          </div>
          <p className={styles.noticeDescription} style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            Para preservar a sua escolha de leitura, as capas e dados dessas obras não foram exibidos. Deseja visualizar esses formatos? Ajuste suas preferências de leitura.
          </p>
          <div className={styles.noticeActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/configuracoes")}
            >
              Ajustar Preferências de Formatos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      ) : paginatedWorks.length === 0 ? (
        <EmptyState
          icon={<Search size={32} />}
          title="Nenhuma obra encontrada"
          description="Não encontramos resultados para os filtros e termos selecionados. Tente ajustar os termos de busca ou sugira o cadastro manual desta obra!"
          action={{
            label: "Sugerir Obra Manual",
            onClick: () => {
              if (!isAuthenticated) {
                openAuthModal();
                return;
              }
              setIsSuggestModalOpen(true);
            },
            icon: <BookPlus size={16} />,
            variant: "primary",
          }}
          secondaryAction={{
            label: "Limpar Filtros",
            onClick: handleResetFilters,
            variant: "secondary",
          }}
        />
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedWorks.map((work) => (
              <CatalogCard
                key={work.id}
                work={work}
                onSelectWork={handleOpenAddModal}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </Button>

              <span className={styles.pageInfo}>
                Página {currentPage} de {totalPages} ({filteredWorks.length} obras encontradas)
              </span>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <span>Próxima</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: INCORPORAR AO MEU CATÁLOGO */}
      {selectedWork && (
        <IncorporationModal
          work={selectedWork}
          isOpen={true}
          onClose={() => setSelectedWork(null)}
          onConfirm={handleConfirmIncorporation}
          isSubmitting={isAdding}
        />
      )}

      {/* MODAL 2: SUGERIR OBRA MANUAL */}
      <SuggestWorkModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onWorkCreated={fetchWorks}
      />
    </div>
  );
};

export default CatalogPage;
