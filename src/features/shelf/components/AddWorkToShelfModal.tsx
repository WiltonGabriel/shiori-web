import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./AddWorkToShelfModal.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { ReadingStatusSelect } from "../../../components/ui/ReadingStatusSelect";
import { CatalogService } from "../../../services/catalog.service";
import { WorkService } from "../../../services/work.service";
import { AuthService } from "../../../services/auth.service";
import { GenreService, type GeneroItem } from "../../../services/genre.service";
import { LocalShelfRepository } from "../../../services/storage/localShelfRepository";
import { FormatPreferencesRepository } from "../../../services/storage/formatPreferencesRepository";
import { isLocalMode } from "../../../services/api/httpClient";
import { toast } from "../../../store/toastStore";
import {
  TODOS_FORMATOS,
  TIPO_OBRA_LABELS,
  type TipoObra,
  type ObraResponse,
} from "../../../types/work.types";
import type { StatusLeitura } from "../../../types/catalog.types";
import {
  BookOpen,
  Search,
  Check,
  Crop,
  Upload,
  Tag,
  Plus,
  X,
  Bookmark,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  ImageWebpCropModal,
  type CropTargetMode,
} from "../../../components/ui/ImageWebpCropModal/ImageWebpCropModal";

export interface AddWorkToShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkAdded: () => void;
  initialFormat?: TipoObra;
}

const FORMAT_CARDS_DATA: Record<
  TipoObra,
  { icon: string; title: string; desc: string }
> = {
  MANGA: {
    icon: "🇯🇵",
    title: "Mangá",
    desc: "Quadrinho japonês tradicional (leitura orientada da direita para esquerda).",
  },
  MANHWA: {
    icon: "🇰🇷",
    title: "Manhwa",
    desc: "Quadrinho coreano colorido em formato de rolagem vertical (webtoon / portais).",
  },
  MANHUA: {
    icon: "🇨🇳",
    title: "Manhua",
    desc: "Quadrinho chinês focado em cultivação (Xianxia/Wuxia) e fantasia oriental.",
  },
  LIGHT_NOVEL: {
    icon: "📖",
    title: "Light Novel",
    desc: "Romance ilustrado japonês em prosa com ilustrações ocasionais estilo anime.",
  },
  WEB_NOVEL: {
    icon: "💻",
    title: "Web Novel",
    desc: "Literatura seriada online com foco em sistemas, LitRPG, transmigração e progressão.",
  },
  LIVRO: {
    icon: "📚",
    title: "Livro / Romance",
    desc: "Literatura ocidental, ficção clássica, ensaios, não-ficção, fantasia e poesia.",
  },
  COMIC: {
    icon: "🦸",
    title: "Comic / HQ",
    desc: "História em quadrinhos ocidental (graphic novels, super-heróis e tiras).",
  },
};

export const AddWorkToShelfModal: React.FC<AddWorkToShelfModalProps> = ({
  isOpen,
  onClose,
  onWorkAdded,
  initialFormat,
}) => {
  if (!isOpen) return null;
  return (
    <AddWorkToShelfModalContent
      isOpen={isOpen}
      onClose={onClose}
      onWorkAdded={onWorkAdded}
      initialFormat={initialFormat}
    />
  );
};

const AddWorkToShelfModalContent: React.FC<AddWorkToShelfModalProps> = ({
  isOpen,
  onClose,
  onWorkAdded,
  initialFormat,
}) => {
  const currentUser = AuthService.getStoredUser();
  const formatPreferencesKey = currentUser?.formatosPreferidos?.join(",") || "";

  // Formatos permitidos pelas preferências do usuário (excluindo os desativados/EXCLUDE)
  const allowedFormats = useMemo(() => {
    return FormatPreferencesRepository.getAllowedFormatsForCreation(currentUser?.formatosPreferidos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatPreferencesKey]);

  // Fluxo em 2 etapas: Passo 1 (Escolha do Formato) -> Passo 2 (Formulário Detalhado Contextualizado)
  const [step, setStep] = useState<"CHOOSE_FORMAT" | "FORM">(
    initialFormat ? "FORM" : "CHOOSE_FORMAT"
  );

  // Form fields
  const [titulo, setTitulo] = useState("");
  const [tituloOriginal, setTituloOriginal] = useState("");
  const [sinopse, setSinopse] = useState("");
  const [tipoObra, setTipoObra] = useState<TipoObra>(
    initialFormat || allowedFormats[0] || "MANGA"
  );
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [capituloAtual, setCapituloAtual] = useState<number>(0);
  const [volumeAtual, setVolumeAtual] = useState<string>("");
  const [totalCapitulos, setTotalCapitulos] = useState<string>("");
  const [totalVolumes, setTotalVolumes] = useState<string>("");
  const [marcadorOndeParou, setMarcadorOndeParou] = useState<string>("");
  const [dataInicioLeitura, setDataInicioLeitura] = useState<string>("");
  const [ultimaDataLida, setUltimaDataLida] = useState<string>("");
  const [capaUrl, setCapaUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [urlLeitura, setUrlLeitura] = useState<string>("");
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<GeneroItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [existingShelfTags] = useState<string[]>(() => {
    try {
      return LocalShelfRepository.getAllTags();
    } catch {
      return [];
    }
  });
  const [proporGlobal, setProporGlobal] = useState<boolean>(false);
  const [selectedGlobalObraId, setSelectedGlobalObraId] = useState<number | null>(null);

  // Sincroniza estado inicial ao abrir modal
  useEffect(() => {
    if (isOpen) {
      if (initialFormat) {
        setTipoObra(initialFormat);
        setStep("FORM");
      } else {
        setStep("CHOOSE_FORMAT");
        const allowed = FormatPreferencesRepository.getAllowedFormatsForCreation(
          AuthService.getStoredUser()?.formatosPreferidos
        );
        setTipoObra((curr) => (allowed.includes(curr) ? curr : allowed[0] || "MANGA"));
      }
    }
  }, [isOpen, initialFormat]);

  // Gêneros filtrados dinamicamente para o formato selecionado (ex.: LIVRO nunca recebe Shonen/Isekai)
  const contextualGenres = useMemo(() => {
    return GenreService.getGenresForFormat(tipoObra, availableGenres);
  }, [tipoObra, availableGenres]);

  // Crop & WebP Studio state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropInitialImage, setCropInitialImage] = useState<string>("");
  const [cropInitialMode, setCropInitialMode] = useState<CropTargetMode>("AMBOS");
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Selecionar formato no passo 1 e avançar para o formulário contextualizado
  const handleSelectFormat = (selectedFormat: TipoObra) => {
    setTipoObra(selectedFormat);
    // Limpa gêneros previamente selecionados que não sejam compatíveis com o novo formato
    const validGenreNames = new Set(
      GenreService.getGenresForFormat(selectedFormat, availableGenres).map((g) =>
        g.nome.toLowerCase().trim()
      )
    );
    setSelectedGeneros((prev) =>
      prev.filter((g) => validGenreNames.has(g.toLowerCase().trim()))
    );
    setStep("FORM");
  };

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
    if (work.tituloOriginal) setTituloOriginal(work.tituloOriginal);
    if (work.sinopse) setSinopse(work.sinopse);
    if (work.tipoObra) setTipoObra(work.tipoObra);
    if (work.capaUrl) setCapaUrl(work.capaUrl);
    if (work.totalCapitulosLancados) setTotalCapitulos(String(work.totalCapitulosLancados));
    if (work.totalVolumes) setTotalVolumes(String(work.totalVolumes));
    if (Array.isArray(work.generos) && work.generos.length > 0) {
      setSelectedGeneros(work.generos);
    }
    if (Array.isArray(work.tags) && work.tags.length > 0) {
      setTags(work.tags);
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

  const handleAddTag = (rawTag?: string) => {
    const candidate = (rawTag ?? tagInput).trim();
    if (!candidate) return;
    if (!tags.some((t) => t.toLowerCase() === candidate.toLowerCase())) {
      setTags((prev) => [...prev, candidate]);
    }
    if (rawTag === undefined) {
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleQuickImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropInitialImage(reader.result);
        setCropInitialMode("AMBOS");
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

      // 1. A obra é SEMPRE salva na estante pessoal do usuário imediatamente (Local-First IndexedDB)
      const addedShelfItem = await CatalogService.addItemToShelf({
        obraId: selectedGlobalObraId || undefined,
        titulo: cleanTitle,
        tituloOriginal: tituloOriginal.trim() || undefined,
        sinopse: sinopse.trim() || undefined,
        tipoObra,
        statusLeitura,
        capituloAtual,
        totalCapitulos: parsedTotalCaps && parsedTotalCaps > 0 ? parsedTotalCaps : undefined,
        volumeAtual: parsedVolumeAtual && parsedVolumeAtual > 0 ? parsedVolumeAtual : undefined,
        totalVolumes: parsedTotalVols && parsedTotalVols > 0 ? parsedTotalVols : undefined,
        capaUrl: capaUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        urlLeitura: urlLeitura.trim() || undefined,
        visibilidade: "PRIVADO",
        generos: selectedGeneros.length > 0 ? selectedGeneros : undefined,
        tags: tags.length > 0 ? tags : undefined,
        marcadorOndeParou: marcadorOndeParou.trim() || undefined,
        dataInicioLeitura: dataInicioLeitura ? new Date(dataInicioLeitura).toISOString() : undefined,
        ultimaDataLida: ultimaDataLida ? new Date(ultimaDataLida).toISOString() : undefined,
      });

      // 2. Proposta opcional para o Catálogo Global (vinculando automaticamente o item da estante)
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
          if (created && created.id) {
            if (addedShelfItem?.id && !selectedGlobalObraId) {
              try {
                await CatalogService.vincularObra(addedShelfItem.id, created.id, true);
              } catch {
                // Vínculo local não bloqueante
              }
            }
            if (user?.id) {
              try {
                await WorkService.submitToGlobalCatalog(created.id, user.id);
              } catch (subErr) {
                console.warn("Obra criada, mas submissão comunitária falhou:", subErr);
              }
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

  const modalTitle =
    step === "CHOOSE_FORMAT"
      ? "Adicionar Obra — Escolha o Formato"
      : `Adicionar ${FORMAT_CARDS_DATA[tipoObra]?.title || TIPO_OBRA_LABELS[tipoObra]} à Minha Estante`;

  const isLivro = tipoObra === "LIVRO";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {step === "CHOOSE_FORMAT" ? (
        /* ========================================================================= */
        /* PASSO 1: ESCOLHA DO FORMATO LITERÁRIO BASEADO NAS PREFERÊNCIAS DO USUÁRIO */
        /* ========================================================================= */
        <div className="flex flex-col gap-4 py-1">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              1. Qual é a categoria da obra que você está adicionando?
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Selecione o formato da obra. O catálogo adaptará automaticamente os gêneros,
              as marcações de leitura e a terminologia para este tipo de publicação.
              {allowedFormats.length < TODOS_FORMATOS.length && (
                <span className="block mt-1 text-[11px] text-[var(--accent-primary)] font-medium">
                  * Exibindo apenas os formatos ativos de acordo com suas preferências de leitura.
                </span>
              )}
            </p>
          </div>

          <div
            className={styles.formatPickerGrid}
            role="group"
            aria-label="Formatos disponíveis"
          >
            {allowedFormats.map((f) => {
              const info = FORMAT_CARDS_DATA[f] || {
                icon: "📖",
                title: TIPO_OBRA_LABELS[f] || f,
                desc: "",
              };
              const isSelected = tipoObra === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleSelectFormat(f)}
                  className={`${styles.formatCard} ${
                    isSelected ? styles.formatCardActive : ""
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className={styles.formatCardIcon}>{info.icon}</span>
                  <span className={styles.formatCardTitle}>{info.title}</span>
                  <span className={styles.formatCardDesc}>{info.desc}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* PASSO 2: FORMULÁRIO DETALHADO ADAPTADO CONTEXTUALMENTE AO FORMATO         */
        /* ========================================================================= */
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* BARRA DO FORMATO SELECIONADO COM BOTÃO DE TROCA RÁPIDA */}
          <div className={styles.selectedFormatBar}>
            <div className={styles.selectedFormatBadge}>
              <span>
                {FORMAT_CARDS_DATA[tipoObra]?.icon} Formato Selecionado:{" "}
                <strong>{TIPO_OBRA_LABELS[tipoObra]}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep("CHOOSE_FORMAT")}
              className={styles.changeFormatBtn}
              aria-label="Trocar formato da obra"
            >
              Trocar Formato ⇄
            </button>
          </div>

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
                placeholder={`Digite o título do ${FORMAT_CARDS_DATA[tipoObra]?.title || "obra"}...`}
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
                      <img
                        src={sug.capaUrl}
                        alt={sug.tituloPrincipal}
                        className={styles.suggestionCover}
                      />
                    ) : (
                      <div className={styles.suggestionCoverPlaceholder}>
                        <BookOpen size={14} />
                      </div>
                    )}
                    <div className={styles.suggestionInfo}>
                      <span className={styles.suggestionTitle}>{sug.tituloPrincipal}</span>
                      <span className={styles.suggestionMeta}>
                        {TIPO_OBRA_LABELS[sug.tipoObra] || sug.tipoObra}
                        {sug.totalCapitulosLancados
                          ? ` • ${sug.totalCapitulosLancados} caps`
                          : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TÍTULO PRINCIPAL & TÍTULO ORIGINAL */}
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
                placeholder={isLivro ? "Ex.: Dom Casmurro, Duna" : "Nome principal da obra"}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="work-original-title" className={styles.fieldLabel}>
                Título Original (opcional)
              </label>
              <input
                id="work-original-title"
                type="text"
                className={styles.fieldInput}
                value={tituloOriginal}
                onChange={(e) => setTituloOriginal(e.target.value)}
                placeholder="Opcional se o principal já for o original"
              />
            </div>
          </div>

          {/* SINOPSE / DESCRIÇÃO DA OBRA */}
          <div className={styles.fieldGroup}>
            <label htmlFor="work-synopsis" className={styles.fieldLabel}>
              Sinopse / Descrição da Obra (opcional)
            </label>
            <textarea
              id="work-synopsis"
              rows={2}
              className={styles.fieldInput}
              style={{ resize: "vertical", minHeight: "58px" }}
              value={sinopse}
              onChange={(e) => setSinopse(e.target.value)}
              placeholder="Resumo da história, premissa ou notas sobre a obra..."
            />
          </div>

          {/* STATUS DE LEITURA & CAPÍTULO/PÁGINA ATUAL */}
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
                {isLivro ? "Capítulo / Página Atual" : "Capítulo Atual Lido"}
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

          {/* VOLUME ATUAL & MARCADOR EXATO DE ONDE PAROU */}
          <div className={styles.twoCols}>
            <div className={styles.fieldGroup}>
              <label htmlFor="initial-volume" className={styles.fieldLabel}>
                {isLivro ? "Livro / Volume na Série (opcional)" : "Volume Atual Lido (opcional)"}
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

            <div className={styles.fieldGroup}>
              <label htmlFor="exact-bookmark" className={styles.fieldLabel}>
                <span className="inline-flex items-center gap-1">
                  <Bookmark size={13} className="text-[var(--accent-primary)]" /> Onde Parou Exatamente (opcional)
                </span>
              </label>
              <input
                id="exact-bookmark"
                type="text"
                className={styles.fieldInput}
                value={marcadorOndeParou}
                onChange={(e) => setMarcadorOndeParou(e.target.value)}
                placeholder="Ex.: Pág. 142, Meio do cap. 15, 38%, Arco do Torneio..."
              />
            </div>
          </div>

          {/* TOTAIS (OPCIONAIS — PERMITIDO EM BRANCO SE DESCONHECIDO) */}
          <div className={styles.twoCols}>
            <div className={styles.fieldGroup}>
              <label htmlFor="total-chapters" className={styles.fieldLabel}>
                {isLivro ? "Total de Capítulos / Páginas (opcional)" : "Total de Capítulos (opcional)"}
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
                Total de Volumes / Livros (opcional)
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

          {/* DATAS DE LEITURA (INÍCIO & ÚLTIMA LEITURA) */}
          <div className={styles.twoCols}>
            <div className={styles.fieldGroup}>
              <label htmlFor="start-reading-date" className={styles.fieldLabel}>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} /> Data em que Começou a Ler (opcional)
                </span>
              </label>
              <input
                id="start-reading-date"
                type="date"
                className={styles.fieldInput}
                value={dataInicioLeitura}
                onChange={(e) => setDataInicioLeitura(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="last-reading-date" className={styles.fieldLabel}>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={13} /> Data da Última Leitura (opcional)
                </span>
              </label>
              <input
                id="last-reading-date"
                type="date"
                className={styles.fieldInput}
                value={ultimaDataLida}
                onChange={(e) => setUltimaDataLida(e.target.value)}
              />
            </div>
          </div>

          {/* CAPA (2:3) + BANNER (16:9) COM CONVERSÃO WEBP E RECORTE + LINK PRIVADO */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/45 border border-[var(--border-subtle)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  Capa (2:3) &amp; Banner (16:9) com Recorte e Conversão WebP
                </span>
                <span className="text-[11px] text-[var(--text-muted)] block">
                  Faça upload de uma imagem para abrir o pop-up de recorte e converter automaticamente para WebP leve.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={quickFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => quickFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
                >
                  <Upload size={13} /> Upload &amp; Recortar WebP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropInitialImage(capaUrl || bannerUrl || "");
                    setCropInitialMode("AMBOS");
                    setIsCropModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold hover:bg-[var(--bg-elevated)] transition-all"
                >
                  <Crop size={13} /> Abrir Estúdio de Recorte
                </button>
              </div>
            </div>

            {(capaUrl || bannerUrl) && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {capaUrl && (
                  <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-subtle)]">
                    <img
                      src={capaUrl}
                      alt="Preview Capa"
                      className="w-10 h-14 object-cover rounded border border-[var(--border-subtle)]"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-[var(--text-primary)] block">Capa (2:3) Pronta</span>
                      <span className="text-emerald-400">
                        {capaUrl.startsWith("data:image/webp") ? "Formato WebP Otimizado" : "Imagem definida"}
                      </span>
                    </div>
                  </div>
                )}
                {bannerUrl && (
                  <div className="flex items-center gap-2 bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-subtle)]">
                    <img
                      src={bannerUrl}
                      alt="Preview Banner"
                      className="w-24 h-14 object-cover rounded border border-[var(--border-subtle)]"
                    />
                    <div className="text-[11px]">
                      <span className="font-bold text-[var(--text-primary)] block">Banner (16:9) Pronto</span>
                      <span className="text-emerald-400">
                        {bannerUrl.startsWith("data:image/webp") ? "Formato WebP Otimizado" : "Banner definido"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  placeholder="https://... ou gerado em WebP acima"
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
                  placeholder="Ex.: https://leitor.com/obra/capitulo-{cap}"
                />
              </div>
            </div>
          </div>

          {/* SELEÇÃO DE GÊNEROS CONTEXTUAIS DO FORMATO SELECIONADO */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Gêneros Aplicáveis a {FORMAT_CARDS_DATA[tipoObra]?.title || TIPO_OBRA_LABELS[tipoObra]} (clique para marcar)
            </label>
            <div className={styles.genresContainer} role="group" aria-label="Gêneros">
              {contextualGenres.map((g) => {
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

          {/* TAGS PERSONALIZADAS / TEMÁTICAS */}
          <div className={styles.fieldGroup}>
            <label htmlFor="custom-tag-input" className={styles.fieldLabel}>
              <span className="inline-flex items-center gap-1">
                <Tag size={13} className="text-[var(--accent-primary)]" /> Tags Personalizadas &amp; Temas (opcional)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-tag-input"
                type="text"
                className={styles.fieldInput}
                style={{ flex: 1 }}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Digite uma tag (ex.: Protagonista OP, Reencarnação, Favorito) e aperte Enter..."
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddTag()}>
                <Plus size={14} /> Adicionar Tag
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white"
                      aria-label={`Remover tag ${t}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {existingShelfTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">Suas tags recentes:</span>
                {existingShelfTags
                  .filter((t) => !tags.includes(t))
                  .slice(0, 8)
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddTag(t)}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                    >
                      + #{t}
                    </button>
                  ))}
              </div>
            )}
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
      )}

      <ImageWebpCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        initialImageUrl={cropInitialImage}
        initialMode={cropInitialMode}
        onApply={({ capaWebp, bannerWebp }) => {
          if (capaWebp) setCapaUrl(capaWebp);
          if (bannerWebp) setBannerUrl(bannerWebp);
          toast.success("Imagem recortada e convertida automaticamente para WebP!");
        }}
      />
    </Modal>
  );
};

