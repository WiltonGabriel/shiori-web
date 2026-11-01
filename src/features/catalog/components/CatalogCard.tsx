import React from "react";
import { Link } from "react-router-dom";
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
    if (fonte && fonte !== "COMUNIDADE" && fonte !== "MANUAL" && fonte !== "SHIORI") {
      return <span className={styles.sourceBadgeShiori}>[Conector Externo]</span>;
    }
    return <span className={styles.sourceBadgeShiori}>[Acervo Shiori]</span>;
  };

  return (
    <article className={styles.workCard}>
      <Link to={`/catalogo/${work.id}`} className={styles.coverWrapper} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
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
      </Link>

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
          <Link to={`/catalogo/${work.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            {work.tituloPrincipal}
          </Link>
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
            <span>Incorporar à Minha Estante</span>
          </Button>
        </div>
      </div>
    </article>
  );
};
