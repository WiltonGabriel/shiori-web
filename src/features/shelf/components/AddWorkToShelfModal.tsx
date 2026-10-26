import React, { useState, useEffect, useRef } from "react";
import styles from "./AddWorkToShelfModal.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { ReadingStatusSelect } from "../../../components/ui/ReadingStatusSelect";
import { CatalogService } from "../../../services/catalog.service";
import { WorkService } from "../../../services/work.service";
import { AuthService } from "../../../services/auth.service";
import { GenreService, type GeneroItem } from "../../../services/genre.service";
import { LocalShelfRepository } from "../../../services/storage/localShelfRepository";
import { isLocalMode } from "../../../services/api/httpClient";
import { toast } from "../../../store/toastStore";
import {
  TODOS_FORMATOS,
  TIPO_OBRA_LABELS,
  type TipoObra,
  type ObraResponse,
} from "../../../types/work.types";
import type { StatusLeitura } from "../../../types/catalog.types";
import { BookOpen, Search, Check } from "lucide-react";

interface AddWorkToShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkAdded: () => void;
}

export const AddWorkToShelfModal: React.FC<AddWorkToShelfModalProps> = ({
  isOpen,
  onClose,
  onWorkAdded,
}) => {
  if (!isOpen) return null;
  return (
    <AddWorkToShelfModalContent
      isOpen={isOpen}
      onClose={onClose}
      onWorkAdded={onWorkAdded}
    />
  );
};

const AddWorkToShelfModalContent: React.FC<AddWorkToShelfModalProps> = ({
  isOpen,
  onClose,
  onWorkAdded,
}) => {
  // Form fields
  const [titulo, setTitulo] = useState("");
  const [tipoObra, setTipoObra] = useState<TipoObra>("MANGA");
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [capituloAtual, setCapituloAtual] = useState<number>(0);
  const [volumeAtual, setVolumeAtual] = useState<string>("");
  const [totalCapitulos, setTotalCapitulos] = useState<string>("");
  const [totalVolumes, setTotalVolumes] = useState<string>("");
  const [capaUrl, setCapaUrl] = useState<string>("");
  const [urlLeitura, setUrlLeitura] = useState<string>("");
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<GeneroItem[]>([]);
  const [proporGlobal, setProporGlobal] = useState<boolean>(false);
  const [selectedGlobalObraId, setSelectedGlobalObraId] = useState<number | null>(null);

  // Search & Suggestions
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ObraResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load available genres
  useEffect(() => {
    GenreService.getGenres().then((res) => {
      setAvailableGenres(res);
    });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!titulo || titulo === searchQuery) {
      setTitulo(text);
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const results: ObraResponse[] = [];

      // 1. Busca no acervo local
      try {
        const localItems = LocalShelfRepository.getAll();
        localItems
          .filter((item) => {
            const t = (item.titulo || item.obraTitulo || "").toLowerCase();
            return t.includes(trimmed.toLowerCase());
          })
          .forEach((item) => {
            results.push({
              id: item.obraId || item.id,
              tituloPrincipal: item.titulo || item.obraTitulo,
              tipoObra: (item.tipoObra as TipoObra) || "MANGA",
              capaUrl: item.capaUrl || item.obraCapaUrl,
              totalCapitulosLancados: item.totalCapitulos || item.obraTotalCapitulos,
              totalVolumes: item.totalVolumes || item.obraTotalVolumes,
              statusCatalogo: "PRIVADO",
              generos: [],
              tags: [],
            });
          });
      } catch {
        // ignore
      }

      // 2. Busca na API remota se conectado
      if (!isLocalMode()) {
        try {
          const assisted = await WorkService.searchWorksAssisted(trimmed);
          if (assisted && Array.isArray(assisted.obras)) {
            assisted.obras.forEach((obra) => {
              if (!results.some((r) => r.id === obra.id)) {
                results.push(obra);
              }
            });
          }
        } catch {
          // ignore
        }
      }

      setSuggestions(results.slice(0, 8));
      setShowSuggestions(results.length > 0);
    }, 300);
  };

  const handleSelectSuggestion = (work: ObraResponse) => {
    setTitulo(work.tituloPrincipal);
    setSearchQuery(work.tituloPrincipal);
    if (work.tipoObra) setTipoObra(work.tipoObra);
    if (work.capaUrl) setCapaUrl(work.capaUrl);
    if (work.totalCapitulosLancados) setTotalCapitulos(String(work.totalCapitulosLancados));
    if (work.totalVolumes) setTotalVolumes(String(work.totalVolumes));
    if (Array.isArray(work.generos) && work.generos.length > 0) {
      setSelectedGeneros(work.generos);
    }
    setSelectedGlobalObraId(work.id);
    setShowSuggestions(false);
    toast.success("Metadados preenchidos. Você pode editar qualquer campo antes de salvar.");
  };

  const toggleGenre = (nome: string) => {
    setSelectedGeneros((prev) =>
      prev.includes(nome) ? prev.filter((g) => g !== nome) : [...prev, nome]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = titulo.trim();
    if (!cleanTitle) {
      toast.warning("O título da obra é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedTotalCaps = totalCapitulos.trim() ? Number(totalCapitulos) : undefined;
      const parsedTotalVols = totalVolumes.trim() ? Number(totalVolumes) : undefined;
      const parsedVolumeAtual = volumeAtual.trim() ? Number(volumeAtual) : undefined;

      // 1. A obra é SEMPRE salva na estante pessoal do usuário imediatamente
      await CatalogService.addItemToShelf({
        obraId: selectedGlobalObraId || undefined,
        titulo: cleanTitle,
        tipoObra,
        statusLeitura,
        capituloAtual,
        totalCapitulos: parsedTotalCaps && parsedTotalCaps > 0 ? parsedTotalCaps : undefined,
        volumeAtual: parsedVolumeAtual && parsedVolumeAtual > 0 ? parsedVolumeAtual : undefined,
        totalVolumes: parsedTotalVols && parsedTotalVols > 0 ? parsedTotalVols : undefined,
        capaUrl: capaUrl.trim() || undefined,
        urlLeitura: urlLeitura.trim() || undefined,
        visibilidade: "PRIVADO",
        generos: selectedGeneros.length > 0 ? selectedGeneros : undefined,
      });

      // 2. Proposta opcional para o Catálogo Global
      let proposalSent = false;
      if (proporGlobal && !isLocalMode()) {
        try {
          const user = AuthService.getStoredUser();
          const created = await WorkService.createWork({
            tituloPrincipal: cleanTitle,
            tipoObra,
            capaUrl: capaUrl.trim() || undefined,
            totalCapitulosLancados: parsedTotalCaps && parsedTotalCaps > 0 ? parsedTotalCaps : undefined,
          });
          if (created && created.id && user?.id) {
            try {
              await WorkService.submitToGlobalCatalog(created.id, user.id);
            } catch (subErr) {
              console.warn("Obra criada, mas submissão comunitária falhou:", subErr);
            }
          }
          proposalSent = true;
        } catch (proposalErr) {
          console.warn("Proposta ao catálogo global não pôde ser transmitida à API:", proposalErr);
        }
      }

      if (proporGlobal && !isLocalMode() && !proposalSent) {
        toast.info(
          `"${cleanTitle}" foi adicionada à sua estante pessoal. A proposta para o Catálogo Global não pôde ser enviada porque a API está indisponível ou você não está autenticado no momento.`,
          "Obra Salva na Estante"
        );
      } else if (proposalSent) {
        toast.success(
          `"${cleanTitle}" adicionada à sua estante e proposta enviada (pendente de revisão pela curadoria)!`,
          "Obra Salva na Estante"
        );
      } else {
        toast.success(
          `"${cleanTitle}" adicionada com sucesso à sua estante pessoal!`,
          "Obra Salva na Estante"
        );
      }

      onClose();
      onWorkAdded();
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível adicionar a obra à sua estante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Obra à Minha Estante"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* BUSCA POR TÍTULO COM AUTOCOMPLETAR */}
        <div className={styles.searchSection} ref={searchContainerRef}>
          <label htmlFor="search-title-input" className={styles.searchLabel}>
            Buscar por título existente ou digitar novo:
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              id="search-title-input"
              type="text"
              className={styles.fieldInput}
              style={{ width: "100%", paddingLeft: "2.25rem" }}
              placeholder="Digite o título da obra (ex.: Solo Leveling, Dom Casmurro)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoComplete="off"
            />
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.85rem",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* LISTA DE SUGESTÕES */}
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionsDropdown} role="listbox">
              {suggestions.map((sug) => (
                <button
                  type="button"
                  key={sug.id}
                  className={styles.suggestionItem}
                  onClick={() => handleSelectSuggestion(sug)}
                >
                  {sug.capaUrl ? (
                    <img src={sug.capaUrl} alt={sug.tituloPrincipal} className={styles.suggestionCover} />
                  ) : (
                    <div className={styles.suggestionCoverPlaceholder}>
                      <BookOpen size={14} />
                    </div>
                  )}
                  <div className={styles.suggestionInfo}>
                    <span className={styles.suggestionTitle}>{sug.tituloPrincipal}</span>
                    <span className={styles.suggestionMeta}>
                      {TIPO_OBRA_LABELS[sug.tipoObra] || sug.tipoObra}
                      {sug.totalCapitulosLancados ? ` • ${sug.totalCapitulosLancados} caps` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TÍTULO & FORMATO */}
        <div className={styles.twoCols}>
          <div className={styles.fieldGroup}>
            <label htmlFor="work-title" className={styles.fieldLabel}>
              Título Principal *
            </label>
            <input
              id="work-title"
              type="text"
              className={styles.fieldInput}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              placeholder="Nome da obra"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="work-format" className={styles.fieldLabel}>
              Formato / Categoria
            </label>
            <select
              id="work-format"
              className={styles.fieldInput}
              value={tipoObra}
              onChange={(e) => setTipoObra(e.target.value as TipoObra)}
            >
              {TODOS_FORMATOS.map((f) => (
                <option key={f} value={f}>
                  {TIPO_OBRA_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATUS DE LEITURA & CAPÍTULO ATUAL */}
        <div className={styles.twoCols}>
          <div className={styles.fieldGroup}>
            <label htmlFor="initial-reading-status" className={styles.fieldLabel}>
              Status na Minha Estante
            </label>
            <ReadingStatusSelect
              id="initial-reading-status"
              value={statusLeitura}
              onChange={setStatusLeitura}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="initial-chapter" className={styles.fieldLabel}>
              Capítulo Atual Lido
            </label>
            <input
              id="initial-chapter"
              type="number"
              min={0}
              step={0.1}
              className={styles.fieldInput}
              value={capituloAtual}
              onChange={(e) => setCapituloAtual(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* VOLUME ATUAL (OPCIONAL) */}
        <div className={styles.fieldGroup}>
          <label htmlFor="initial-volume" className={styles.fieldLabel}>
            Volume Atual Lido (opcional)
          </label>
          <input
            id="initial-volume"
            type="number"
            min={0}
            step={1}
            className={styles.fieldInput}
            value={volumeAtual}
            onChange={(e) => setVolumeAtual(e.target.value)}
            placeholder="Ex.: 1 (em branco se não aplicável)"
          />
        </div>

        {/* TOTAIS (OPCIONAIS — PERMITIDO EM BRANCO SE DESCONHECIDO) */}
        <div className={styles.twoCols}>
          <div className={styles.fieldGroup}>
            <label htmlFor="total-chapters" className={styles.fieldLabel}>
              Total de Capítulos (opcional)
            </label>
            <input
              id="total-chapters"
              type="number"
              min={1}
              step={1}
              className={styles.fieldInput}
              value={totalCapitulos}
              onChange={(e) => setTotalCapitulos(e.target.value)}
              placeholder="Em branco se desconhecido"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="total-volumes" className={styles.fieldLabel}>
              Total de Volumes (opcional)
            </label>
            <input
              id="total-volumes"
              type="number"
              min={1}
              step={1}
              className={styles.fieldInput}
              value={totalVolumes}
              onChange={(e) => setTotalVolumes(e.target.value)}
              placeholder="Em branco se desconhecido"
            />
          </div>
        </div>

        {/* URL DA CAPA & LINK PRIVADO */}
        <div className={styles.twoCols}>
          <div className={styles.fieldGroup}>
            <label htmlFor="cover-url" className={styles.fieldLabel}>
              URL da Imagem da Capa (opcional)
            </label>
            <input
              id="cover-url"
              type="url"
              className={styles.fieldInput}
              value={capaUrl}
              onChange={(e) => setCapaUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="private-url" className={styles.fieldLabel}>
              URL Privada de Leitura (opcional)
            </label>
            <input
              id="private-url"
              type="url"
              className={styles.fieldInput}
              value={urlLeitura}
              onChange={(e) => setUrlLeitura(e.target.value)}
              placeholder="Seu link pessoal confidencial"
            />
          </div>
        </div>

        {/* SELEÇÃO DE GÊNEROS POR CHIPS */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Gêneros (clique para selecionar)
          </label>
          <div className={styles.genresContainer} role="group" aria-label="Gêneros">
            {availableGenres.map((g) => {
              const isSelected = selectedGeneros.includes(g.nome);
              return (
                <button
                  type="button"
                  key={g.id}
                  className={`${styles.genreChip} ${
                    isSelected ? styles.genreChipSelected : ""
                  }`}
                  onClick={() => toggleGenre(g.nome)}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check size={12} style={{ marginRight: 4 }} />}
                  <span>{g.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROPOSTA OPCIONAL PARA O CATÁLOGO GLOBAL */}
        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={proporGlobal}
              onChange={(e) => setProporGlobal(e.target.checked)}
            />
            <span className={styles.checkboxLabel}>
              Também propor inclusão no Catálogo Global
            </span>
          </label>
          <span className={styles.checkboxAux}>
            Um gestor revisará os dados antes de a obra entrar no catálogo oficial. Sua cópia pessoal permanecerá na estante independentemente da aprovação.
          </span>
        </div>

        {/* AÇÕES */}
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Adicionar à Minha Estante
          </Button>
        </div>
      </form>
    </Modal>
  );
};
