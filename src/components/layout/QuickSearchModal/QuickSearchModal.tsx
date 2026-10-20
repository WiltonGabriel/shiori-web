import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./QuickSearchModal.module.css";
import { WorkService } from "../../../services/work.service";
import type { ObraResponse } from "../../../types/work.types";
import { Badge } from "../../ui/Badge/Badge";
import { Search, X, BookOpen, Loader2 } from "lucide-react";

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <QuickSearchModalContent onClose={onClose} />;
};

interface QuickSearchModalContentProps {
  onClose: () => void;
}

const QuickSearchModalContent: React.FC<QuickSearchModalContentProps> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Foco automático no input ao abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fechar com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Busca assistida com debounce
  useEffect(() => {
    if (query.trim().length < 2) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await WorkService.searchWorksAssisted(query.trim());
        if (isMounted) setResults(data.obras || []);
      } catch {
        if (isMounted) setResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const displayedResults = query.trim().length >= 2 ? results : [];

  const handleSelectWork = useCallback(
    (work: ObraResponse) => {
      onClose();
      navigate(`/catalogo?q=${encodeURIComponent(work.tituloPrincipal)}`);
    },
    [navigate, onClose]
  );

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Busca Rápida de Obras Shiori"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          {isLoading ? (
            <Loader2 size={18} className={`${styles.searchIcon} animate-spin`} />
          ) : (
            <Search size={18} className={styles.searchIcon} />
          )}
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por título, autor ou gênero..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Campo de busca rápida"
          />
          {query ? (
            <button
              type="button"
              className={styles.kbd}
              onClick={() => setQuery("")}
              aria-label="Limpar termo de busca"
            >
              <X size={12} />
            </button>
          ) : (
            <span className={styles.kbd}>ESC</span>
          )}
        </div>

        <div className={styles.resultsList}>
          {query.trim().length >= 2 && displayedResults.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              Nenhuma obra encontrada para "{query}". Pressione Enter para buscar nas fontes externas.
            </div>
          )}

          {query.trim().length < 2 && (
            <div className={styles.emptyState}>
              Digite ao menos 2 caracteres para pesquisar no acervo global...
            </div>
          )}

          {displayedResults.map((work) => (
            <button
              key={work.id}
              type="button"
              className={styles.resultItem}
              onClick={() => handleSelectWork(work)}
            >
              {work.capaUrl ? (
                <img src={work.capaUrl} alt={work.tituloPrincipal} className={styles.resultCover} />
              ) : (
                <div className={styles.resultCoverPlaceholder}>
                  <BookOpen size={18} />
                </div>
              )}
              <div className={styles.resultInfo}>
                <div className={styles.resultTitle}>{work.tituloPrincipal}</div>
                <div className={styles.resultMeta}>
                  <Badge variant="brand">{work.tipoObra}</Badge>
                  {work.totalCapitulosLancados ? (
                    <span>{work.totalCapitulosLancados} capítulos</span>
                  ) : null}
                  {work.statusCatalogo && <span>• {work.statusCatalogo}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <span>Dica: Use as setas para navegar e Enter para selecionar</span>
          <div className={styles.shortcuts}>
            <span>
              <span className={styles.kbd}>↵</span> Acessar
            </span>
            <span>
              <span className={styles.kbd}>ESC</span> Fechar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
