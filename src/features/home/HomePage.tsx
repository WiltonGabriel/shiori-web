import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./HomePage.module.css";
import { WorkService } from "../../services/work.service";
import { SocialService } from "../../services/social.service";
import { Card } from "../../components/ui/Card/Card";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Avatar } from "../../components/ui/Avatar/Avatar";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import type { ObraResponse } from "../../types/work.types";
import type { AtividadeFeedResponse } from "../../types/social.types";
import { Compass, Bookmark, Star, ArrowRight } from "lucide-react";

export const HomePage: React.FC = () => {
  const [works, setWorks] = useState<ObraResponse[]>([]);
  const [feed, setFeed] = useState<AtividadeFeedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [worksRes, feedRes] = await Promise.allSettled([
          WorkService.listHomeWorks(),
          SocialService.getFeed(),
        ]);
        if (isMounted) {
          if (worksRes.status === "fulfilled") setWorks(worksRes.value);
          if (feedRes.status === "fulfilled") setFeed(feedRes.value);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badgeHighlight}>
            <Badge variant="brand">Shiori v2.0 • Acervo & Comunidade</Badge>
          </div>
          <h1 className={styles.title}>
            A sua estante definitiva para <span className={styles.titleGradient}>Mangás, Novels e Livros</span>.
          </h1>
          <p className={styles.subtitle}>
            Acompanhe cada capítulo lido, registre notas pessoais criptografadas,
            guarde seus links privados de leitura com segurança e compartilhe sua paixão com amigos.
          </p>
          <div className={styles.actions}>
            <Link to="/explorar">
              <Button variant="primary" size="md">
                <Compass size={18} />
                <span>Explorar Catálogo</span>
              </Button>
            </Link>
            <Link to="/estante">
              <Button variant="secondary" size="md">
                <Bookmark size={18} />
                <span>Minha Estante</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Obras em Destaque</h2>
          <Link to="/explorar" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--brand-light)", fontSize: "var(--text-sm)" }}>
            <span>Ver todas</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Spinner size="lg" />
          </div>
        ) : works.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            Nenhuma obra em destaque no momento.
          </Card>
        ) : (
          <div className={styles.worksGrid}>
            {works.slice(0, 6).map((obra) => (
              <Card key={obra.id} interactive style={{ padding: "0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "2/3", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-elevated)", marginBottom: "0.75rem" }}>
                  {obra.capaUrl ? (
                    <img src={obra.capaUrl} alt={obra.tituloPrincipal} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                      Sem capa
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {obra.tituloPrincipal}
                </h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <Badge variant="neutral">{obra.tipoObra}</Badge>
                  {obra.notaGeral !== undefined && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-amber)", fontSize: "var(--text-xs)", fontWeight: 700 }}>
                      <Star size={12} fill="currentColor" />
                      {obra.notaGeral.toFixed(1)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {feed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "1rem" }}>Atividades Recentes da Comunidade</h2>
          <div className={styles.feedList}>
            {feed.slice(0, 5).map((item) => (
              <Card key={item.id} className={styles.feedItem}>
                <Avatar name={item.usuarioApelido || "Leitor"} size="sm" src={item.usuarioFotoUrl} />
                <div className={styles.feedBody}>
                  <div>
                    <span className={styles.feedUser}>@{item.usuarioApelido}</span>{" "}
                    <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                      {item.descricao || "atualizou sua leitura"}
                    </span>
                  </div>
                  {item.obraTitulo && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Obra: <strong>{item.obraTitulo}</strong>
                    </div>
                  )}
                </div>
                <span className={styles.feedTime}>
                  {new Date(item.dataCriacao).toLocaleDateString("pt-BR")}
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
