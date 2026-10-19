import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./HomePage.module.css";
import { WorkService } from "../../services/work.service";
import { SocialService } from "../../services/social.service";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { HorizontalScroller } from "../../components/ui/HorizontalScroller/HorizontalScroller";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Avatar } from "../../components/ui/Avatar/Avatar";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { TIPO_OBRA_LABELS, type ObraResponse } from "../../types/work.types";
import type { AtividadeFeedResponse } from "../../types/social.types";
import type { ItemCatalogoResponse } from "../../types/catalog.types";
import {
  Compass,
  Bookmark,
  Star,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Plus,
  Heart,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";

export const HomePage: React.FC = () => {
  useDocumentTitle(
    "Shiori — Seu Catálogo e Diário Pessoal de Leituras",
    "Gerencie sua estante pessoal de mangás, novels, manhwas e livros. Acompanhe seu progresso de leitura e interaja com conexões no feed social."
  );

  const { isAuthenticated, openAuthModal } = useAuthStore();
  const navigate = useNavigate();

  // Estados dos Destaques (Hero)
  const [highlightWorks, setHighlightWorks] = useState<ObraResponse[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);

  // Estados do Bloco Continuar Lendo
  const [readingItems, setReadingItems] = useState<ItemCatalogoResponse[]>([]);
  const [isLoadingReading, setIsLoadingReading] = useState(false);

  // Estados do Feed Social
  const [feedItems, setFeedItems] = useState<AtividadeFeedResponse[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  // Reações locais do feed (curtidas interativas)
  const [likedActivities, setLikedActivities] = useState<Record<number, boolean>>({});

  // 1. Carregar Obras em Destaque do Servidor
  useEffect(() => {
    let isMounted = true;
    const fetchHighlights = async () => {
      try {
        setIsLoadingHighlights(true);
        const data = await WorkService.listHomeWorks();
        if (isMounted) {
          setHighlightWorks(data || []);
        }
      } catch (err) {
        console.error("Falha ao carregar destaques da Home:", err);
      } finally {
        if (isMounted) setIsLoadingHighlights(false);
      }
    };

    fetchHighlights();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Carregar Continuar Lendo (quando autenticado)
  useEffect(() => {
    if (!isAuthenticated) {
      setReadingItems([]);
      return;
    }

    let isMounted = true;
    const fetchReading = async () => {
      try {
        setIsLoadingReading(true);
        const shelf = await CatalogService.getMyShelf(0, 40);
        if (isMounted) {
          const lendo = (shelf || []).filter(
            (item) => item.statusLeitura === "LENDO" || item.progressoAtual > 0
          );
          setReadingItems(lendo);
        }
      } catch (err) {
        console.error("Falha ao carregar bloco Continuar Lendo:", err);
      } finally {
        if (isMounted) setIsLoadingReading(false);
      }
    };

    fetchReading();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // 3. Carregar Feed Social
  useEffect(() => {
    let isMounted = true;
    const fetchFeed = async () => {
      if (!isAuthenticated) {
        setFeedItems([]);
        return;
      }

      try {
        setIsLoadingFeed(true);
        const data = await SocialService.getFeed();
        if (isMounted) {
          const list = Array.isArray(data) ? data : (data as any)?.content || [];
          setFeedItems(list);
        }
      } catch (err) {
        console.error("Falha ao carregar feed social:", err);
      } finally {
        if (isMounted) setIsLoadingFeed(false);
      }
    };

    fetchFeed();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Navegação do Carrossel Hero
  const nextSlide = () => {
    if (highlightWorks.length === 0) return;
    setActiveSlide((prev) => (prev + 1) % highlightWorks.length);
  };

  const prevSlide = () => {
    if (highlightWorks.length === 0) return;
    setActiveSlide((prev) => (prev - 1 + highlightWorks.length) % highlightWorks.length);
  };

  // Botão +1 no Bloco Continuar Lendo (Otimista)
  const handleQuickIncrement = async (item: ItemCatalogoResponse) => {
    const proximoCap = (item.progressoAtual || 0) + 1;
    const progressoAnterior = item.progressoAtual;

    // Atualização otimista
    setReadingItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, progressoAtual: proximoCap } : i))
    );

    try {
      const atualizado = await CatalogService.updateProgress(item.id, {
        capituloAtual: proximoCap,
        volumeAtual: item.volumeAtual,
        statusLeitura: item.statusLeitura,
      });

      setReadingItems((prev) => prev.map((i) => (i.id === item.id ? atualizado : i)));
      toast.success(`Capítulo ${proximoCap} registrado para ${item.obraTitulo}!`);
    } catch (err: any) {
      // Reverter em caso de falha
      setReadingItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, progressoAtual: progressoAnterior } : i))
      );
      toast.error(err, "Falha ao Avançar Capítulo");
    }
  };

  const toggleLike = (activityId: number) => {
    setLikedActivities((prev) => {
      const next = !prev[activityId];
      if (next) {
        toast.info("Você curtiu esta atualização de leitura!");
      }
      return { ...prev, [activityId]: next };
    });
  };

  const currentHighlight = highlightWorks[activeSlide] || null;

  return (
    <div className={styles.pageContainer}>
      {/* ===================================================================
       * 1. HERO / DESTAQUES DO SERVIDOR (Carrossel Limpo e Elegante)
       * =================================================================== */}
      {isLoadingHighlights ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      ) : highlightWorks.length > 0 && currentHighlight ? (
        <section className={styles.heroCarouselWrapper} aria-label="Obras em Destaque no Shiori">
          <div className={styles.heroSlide}>
            <div className={styles.heroCoverWrapper}>
              {currentHighlight.capaUrl ? (
                <img
                  src={currentHighlight.capaUrl}
                  alt={`Capa de ${currentHighlight.tituloPrincipal}`}
                  className={styles.heroCoverImg}
                />
              ) : (
                <div className={styles.heroCoverPlaceholder}>Sem capa disponível</div>
              )}
            </div>

            <div className={styles.heroDetails}>
              <div className={styles.heroBadgesRow}>
                <span className={styles.heroHighlightBadge}>
                  <Sparkles size={12} />
                  Destaque da Curadoria
                </span>
                <Badge variant="brand">{TIPO_OBRA_LABELS[currentHighlight.tipoObra] || currentHighlight.tipoObra}</Badge>
                {currentHighlight.notaGeral !== undefined && (
                  <span className={styles.heroRatingBadge}>
                    <Star size={12} fill="currentColor" />
                    {currentHighlight.notaGeral.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className={styles.heroTitle}>{currentHighlight.tituloPrincipal}</h1>

              <p className={styles.heroSynopsis}>
                {currentHighlight.sinopse ||
                  "Acompanhe o progresso de leitura, registre avaliações capítulo a capítulo e gerencie sua estante na nuvem com o Shiori."}
              </p>

              <div className={styles.heroMetaInfo}>
                {currentHighlight.totalCapitulosLancados ? (
                  <span className={styles.heroMetaItem}>
                    <BookOpen size={14} />
                    {currentHighlight.totalCapitulosLancados} capítulos lançados
                  </span>
                ) : null}
                {currentHighlight.generos && currentHighlight.generos.length > 0 ? (
                  <span className={styles.heroMetaItem}>
                    Gêneros: {currentHighlight.generos.slice(0, 3).join(", ")}
                  </span>
                ) : null}
              </div>

              <div className={styles.heroActions}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/catalogo")}
                >
                  <Compass size={18} />
                  <span>Explorar no Catálogo</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/meu-catalogo")}
                >
                  <Bookmark size={18} />
                  <span>Minha Estante</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Navegação Manual Lateral (< e >) */}
          {highlightWorks.length > 1 && (
            <div className={styles.carouselControls}>
              <button
                type="button"
                className={styles.carouselNavBtn}
                onClick={prevSlide}
                aria-label="Destaque anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className={styles.carouselNavBtn}
                onClick={nextSlide}
                aria-label="Próximo destaque"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Indicadores Manuais (Dots) */}
          {highlightWorks.length > 1 && (
            <div className={styles.carouselDots} role="tablist" aria-label="Slides do carrossel">
              {highlightWorks.map((work, idx) => (
                <button
                  key={work.id}
                  type="button"
                  className={`${styles.carouselDot} ${
                    idx === activeSlide ? styles.carouselDotActive : ""
                  }`}
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Ir para destaque ${idx + 1}: ${work.tituloPrincipal}`}
                  aria-selected={idx === activeSlide}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* ===================================================================
       * 2. BLOCO "CONTINUAR LENDO" (Exclusivo para Usuários Autenticados)
       * =================================================================== */}
      {isAuthenticated && (
        <section className={styles.section} aria-label="Continuar lendo">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Continuar Lendo</h2>
              <Badge variant="neutral">{readingItems.length}</Badge>
            </div>
            <Link to="/meu-catalogo" className={styles.sectionLink}>
              <span>Ver estante completa</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {isLoadingReading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <Spinner size="md" />
            </div>
          ) : readingItems.length > 0 ? (
            <HorizontalScroller
              step={300}
              ariaLabel="Trilha de obras em andamento"
              enableMouseDrag
            >
              {readingItems.map((item) => {
                const totalCap = item.obraTotalCapitulos || 0;
                const progresso = item.progressoAtual || 0;
                const percent =
                  totalCap > 0 ? Math.min(100, Math.round((progresso / totalCap) * 100)) : 0;

                return (
                  <div key={item.id} className={styles.readingCard}>
                    <div className={styles.readingCoverWrapper}>
                      {item.obraCapaUrl ? (
                        <img
                          src={item.obraCapaUrl}
                          alt={item.obraTitulo}
                          className={styles.readingCoverImg}
                          loading="lazy"
                        />
                      ) : (
                        <BookOpen size={20} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>

                    <div className={styles.readingInfo}>
                      <h3 className={styles.readingTitle} title={item.obraTitulo}>
                        {item.obraTitulo}
                      </h3>

                      <div className={styles.readingProgressRow}>
                        <span>
                          {totalCap > 0
                            ? `Cap. ${progresso} / ${totalCap}`
                            : `Cap. ${progresso} lidos`}
                        </span>
                        {totalCap > 0 && <span>{percent}%</span>}
                      </div>

                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: totalCap > 0 ? `${percent}%` : "100%" }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.readingPlusBtn}
                      onClick={() => handleQuickIncrement(item)}
                      title={`Incrementar +1 capítulo de ${item.obraTitulo}`}
                      aria-label={`Incrementar capítulo de ${item.obraTitulo}`}
                    >
                      <Plus size={14} />
                      <span>1</span>
                    </button>
                  </div>
                );
              })}
            </HorizontalScroller>
          ) : (
            <div className={styles.emptyStateCard}>
              <BookOpen size={32} style={{ color: "var(--brand-light)" }} />
              <h3 className={styles.emptyStateTitle}>Nenhuma leitura em andamento</h3>
              <p className={styles.emptyStateDesc}>
                Explore o catálogo global para adicionar mangás, manhwas ou livros à sua estante pessoal.
              </p>
              <Link to="/catalogo">
                <Button variant="primary" size="sm">
                  <Compass size={16} />
                  <span>Explorar Catálogo</span>
                </Button>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ===================================================================
       * 3. FEED SOCIAL (Timeline de Conexões)
       * =================================================================== */}
      <section className={styles.section} aria-label="Feed de atividades recentes">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Users size={20} style={{ color: "var(--brand-primary)" }} />
            <h2 className={styles.sectionTitle}>Feed Social de Conexões</h2>
          </div>
          {isAuthenticated && (
            <Link to="/catalogo" className={styles.sectionLink}>
              <span>Descobrir novas obras</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {isLoadingFeed ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Spinner size="md" />
          </div>
        ) : !isAuthenticated ? (
          <div className={styles.emptyStateCard}>
            <Users size={36} style={{ color: "var(--brand-light)" }} />
            <h3 className={styles.emptyStateTitle}>Conecte-se com outros leitores</h3>
            <p className={styles.emptyStateDesc}>
              Faça login para acompanhar o progresso de leitura em tempo real dos seus amigos,
              ver notas avaliadas e trocar impressões sobre obras.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={openAuthModal}
            >
              <span>Entrar com Minha Conta</span>
            </Button>
          </div>
        ) : (!Array.isArray(feedItems) || feedItems.length === 0) ? (
          <div className={styles.emptyStateCard}>
            <Users size={32} style={{ color: "var(--text-muted)" }} />
            <h3 className={styles.emptyStateTitle}>Seu feed está silencioso</h3>
            <p className={styles.emptyStateDesc}>
              Conecte-se com amigos ou adicione novas obras para acompanhar o ritmo e avaliações da comunidade!
            </p>
            <Link to="/catalogo">
              <Button variant="secondary" size="sm">
                <Compass size={16} />
                <span>Explorar Catálogo</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className={styles.feedList}>
            {(Array.isArray(feedItems) ? feedItems : []).map((item) => {
              const isLiked = Boolean(likedActivities[item.id]);

              return (
                <article key={item.id} className={styles.feedCard}>
                  <div className={styles.feedAvatarWrapper}>
                    <Avatar
                      name={item.usuarioApelido || "Leitor"}
                      src={item.usuarioFotoUrl}
                      size="md"
                    />
                  </div>

                  <div className={styles.feedMain}>
                    <div className={styles.feedHeaderRow}>
                      <div className={styles.feedUserLine}>
                        <span className={styles.feedUsername}>@{item.usuarioApelido}</span>{" "}
                        <span className={styles.feedActionText}>
                          {item.descricao || "atualizou sua estante de leituras"}
                        </span>
                      </div>
                      <time className={styles.feedTime} dateTime={item.dataCriacao}>
                        {new Date(item.dataCriacao).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    {item.obraTitulo && (
                      <div className={styles.feedWorkSnippet}>
                        {item.obraCapaUrl && (
                          <img
                            src={item.obraCapaUrl}
                            alt={item.obraTitulo}
                            className={styles.feedSnippetCover}
                            loading="lazy"
                          />
                        )}
                        <div className={styles.feedSnippetDetails}>
                          <span className={styles.feedSnippetTitle}>{item.obraTitulo}</span>
                        </div>
                      </div>
                    )}

                    <div className={styles.feedActionsRow}>
                      <button
                        type="button"
                        className={`${styles.feedActionBtn} ${
                          isLiked ? styles.feedActionBtnLiked : ""
                        }`}
                        onClick={() => toggleLike(item.id)}
                        aria-label="Curtir atividade"
                      >
                        <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                        <span>{isLiked ? 1 : 0}</span>
                      </button>

                      <button
                        type="button"
                        className={styles.feedActionBtn}
                        onClick={() =>
                          toast.info("A funcionalidade de comentários na timeline está ativa!")
                        }
                        aria-label="Comentar atividade"
                      >
                        <MessageSquare size={14} />
                        <span>Comentar</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
