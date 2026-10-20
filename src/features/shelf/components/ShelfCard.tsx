import React from "react";
import { Link } from "react-router-dom";
import styles from "../ShelfPage.module.css";
import { Button } from "../../../components/ui/Button/Button";
import {
  StatusBadge,
  UnlinkedBadge,
  NewChaptersNotificationBadge,
} from "./ShelfBadges";
import type { ItemCatalogoResponse } from "../../../types/catalog.types";
import {
  BookOpen,
  Star,
  Edit3,
  Unlink,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface ShelfCardProps {
  item: ItemCatalogoResponse;
  onQuickIncrement: (item: ItemCatalogoResponse) => void;
  onOpenCycle?: (item: ItemCatalogoResponse) => void;
  onOpenEdit: (item: ItemCatalogoResponse) => void;
  onUnlink: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onUpdateMeta: (itemId: number) => void;
}

export const ShelfCard: React.FC<ShelfCardProps> = ({
  item,
  onQuickIncrement,
  onOpenCycle: _onOpenCycle,
  onOpenEdit,
  onUnlink,
  onRemove,
  onUpdateMeta,
}) => {
  const tituloExibido = item.titulo || item.obraTitulo;
  const capaExibida = item.capaUrl || item.obraCapaUrl;
  const totalCaps = item.totalCapitulos !== undefined ? item.totalCapitulos : item.obraTotalCapitulos;
  const totalVols = item.totalVolumes !== undefined ? item.totalVolumes : item.obraTotalVolumes;
  const hasTotalCap = totalCaps !== undefined && totalCaps > 0;
  const percentCap = hasTotalCap
    ? Math.min(100, Math.round(((item.progressoAtual || 0) / (totalCaps || 1)) * 100))
    : 0;

  return (
    <div className={styles.shelfCard}>
      <Link to={`/minha-estante/${item.id}`} className={styles.coverWrapper} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {capaExibida ? (
          <img
            src={capaExibida}
            alt={tituloExibido}
            className={styles.coverImg}
            loading="lazy"
          />
        ) : (
          <BookOpen size={24} style={{ color: "var(--text-muted)" }} />
        )}
      </Link>

      <div className={styles.cardBody}>
        <div className={styles.cardHeaderRow}>
          <h3 className={styles.cardTitle} title={tituloExibido}>
            <Link to={`/minha-estante/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              {tituloExibido}
            </Link>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {item.desvinculado && <UnlinkedBadge />}
          </div>
        </div>

        <div className={styles.progressInfo}>
          <StatusBadge status={item.statusLeitura} />
          <span>
            {hasTotalCap
              ? `Cap. ${item.progressoAtual || 0} / ${totalCaps} (${percentCap}%)`
              : `Cap. ${item.progressoAtual || 0} lidos`}
          </span>
        </div>

        {/* Barra de Progresso Visual (apenas se o total for conhecido) */}
        {hasTotalCap && (
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${percentCap}%` }}
            />
          </div>
        )}

        {/* Notificação Sutil de Novos Capítulos Globais */}
        {item.temNovosCapitulos && (
          <div style={{ margin: "0.25rem 0" }}>
            <NewChaptersNotificationBadge onUpdateMeta={() => onUpdateMeta(item.id)} />
          </div>
        )}

        <div className={styles.cardMetaRow}>
          {totalVols ? (
            <span>Vol. {item.volumeAtual || 0} / {totalVols}</span>
          ) : null}
          {item.avaliacaoPessoal !== undefined && item.avaliacaoPessoal > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.2rem",
                color: "var(--accent-amber)",
              }}
            >
              <Star size={11} fill="currentColor" />
              {item.avaliacaoPessoal.toFixed(1)}
            </span>
          )}
        </div>

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.quickPlusBtn}
            onClick={() => onQuickIncrement(item)}
            title={`Incrementar +1 capítulo de ${tituloExibido}`}
            aria-label={`Incrementar +1 capítulo de ${tituloExibido}`}
          >
            +1
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenEdit(item)}
            title="Editar detalhes do progresso"
            aria-label="Editar progresso"
          >
            <Edit3 size={13} />
          </Button>

          {!item.desvinculado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnlink(item.id)}
              title="Desvincular do Catálogo Global (Tornar registro 100% local e independente)"
              aria-label="Desvincular obra"
            >
              <Unlink size={13} />
            </Button>
          )}

          {item.urlLeitura && (
            <a
              href={item.urlLeitura}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "inline-flex" }}
              title={`Abrir link privado de leitura em nova aba: ${item.urlLeitura}`}
              aria-label="Abrir link privado de leitura"
            >
              <Button
                variant="ghost"
                size="sm"
                style={{ color: "var(--brand-light)" }}
              >
                <ExternalLink size={13} />
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            title="Remover da estante"
            style={{ marginLeft: "auto", color: "var(--accent-rose)" }}
            aria-label="Remover obra da estante"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
};
