import React from "react";
import styles from "../ShelfPage.module.css";
import { Button } from "../../../components/ui/Button/Button";
import {
  StatusBadge,
  VisibilityBadge,
  UnlinkedBadge,
  NewChaptersNotificationBadge,
} from "./ShelfBadges";
import type { ItemCatalogoResponse } from "../../../types/catalog.types";
import {
  BookOpen,
  Star,
  CheckCircle,
  Edit3,
  Unlink,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface ShelfCardProps {
  item: ItemCatalogoResponse;
  onQuickIncrement: (item: ItemCatalogoResponse) => void;
  onOpenCycle: (item: ItemCatalogoResponse) => void;
  onOpenEdit: (item: ItemCatalogoResponse) => void;
  onUnlink: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onUpdateMeta: (itemId: number) => void;
}

export const ShelfCard: React.FC<ShelfCardProps> = ({
  item,
  onQuickIncrement,
  onOpenCycle,
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
      <div className={styles.coverWrapper}>
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
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeaderRow}>
          <h3 className={styles.cardTitle} title={tituloExibido}>
            {tituloExibido}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {item.desvinculado && <UnlinkedBadge />}
            <VisibilityBadge visibility={item.visibilidade} />
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

        {/* Barra de Progresso Visual */}
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBarFill}
            style={{ width: hasTotalCap ? `${percentCap}%` : "100%" }}
          />
        </div>

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

          <button
            type="button"
            className={styles.cycleBtn}
            onClick={() => onOpenCycle(item)}
            title="Registrar conclusão de ciclo com nota e anotação"
          >
            <CheckCircle size={13} />
            <span>Registro de Ciclo</span>
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
              title="Desvincular do Catálogo Global (Tornar 100% local e soberano)"
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
