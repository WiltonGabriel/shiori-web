import React from "react";
import styles from "../CatalogPage.module.css";
import { Badge } from "../../../components/ui/Badge/Badge";
import { Button } from "../../../components/ui/Button/Button";
import type { ObraResponse } from "../../../types/work.types";
import { TIPO_OBRA_LABELS } from "../../../types/work.types";
import { Star, Plus } from "lucide-react";

interface CatalogCardProps {
  work: ObraResponse;
  onSelectWork: (work: ObraResponse) => void;
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ work, onSelectWork }) => {
  const renderSourceBadge = (item: ObraResponse) => {
    const fonte = (item.origemFonte || "").toUpperCase();
    if (fonte === "MANGADEX" || item.mangadexId) {
      return <span className={styles.sourceBadgeMangaDex}>[MangaDex]</span>;
    }
    if (fonte === "KITSU" || item.kitsuId) {
      return <span className={styles.sourceBadgeKitsu}>[Kitsu]</span>;
    }
    if (fonte === "OPEN_LIBRARY" || item.isbn) {
      return <span className={styles.sourceBadgeOpenLib}>[Open Library]</span>;
    }
    if (fonte === "ANILIST" || item.anilistId) {
      return <span className={styles.sourceBadgeAniList}>[AniList]</span>;
    }
    if (fonte === "FEDERACAO") {
      return <span className={styles.sourceBadgeFederacao}>[Federação Mesh]</span>;
    }
    return <span className={styles.sourceBadgeShiori}>[Base Interna Shiori]</span>;
  };

  return (
    <article className={styles.workCard}>
      <div className={styles.coverWrapper}>
        {work.capaUrl ? (
          <img
            src={work.capaUrl}
            alt={work.tituloPrincipal}
            className={styles.coverImg}
            loading="lazy"
          />
        ) : (
          <div className={styles.coverPlaceholder}>Sem Capa</div>
        )}
        {work.statusCatalogo === "OFICIAL" && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <Badge variant="brand">Oficial</Badge>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardBadges}>
          <Badge variant="neutral">{TIPO_OBRA_LABELS[work.tipoObra] || work.tipoObra}</Badge>
          {renderSourceBadge(work)}
          {work.notaGeral !== undefined && work.notaGeral > 0 && (
            <span className={styles.ratingBadge}>
              <Star size={11} fill="currentColor" />
              {work.notaGeral.toFixed(1)}
            </span>
          )}
        </div>

        <h3 className={styles.workTitle} title={work.tituloPrincipal}>
          {work.tituloPrincipal}
        </h3>

        <div className={styles.workMeta}>
          {work.totalCapitulosLancados ? (
            <span>{work.totalCapitulosLancados} capítulos</span>
          ) : (
            <span>Capítulos em atualização</span>
          )}
        </div>

        <div className={styles.cardActionArea}>
          <Button
            variant="primary"
            size="sm"
            className={styles.addBtn}
            onClick={() => onSelectWork(work)}
          >
            <Plus size={14} />
            <span>Adicionar ao Meu Catálogo</span>
          </Button>
        </div>
      </div>
    </article>
  );
};
