import React from "react";
import { Link } from "react-router-dom";
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
  Edit3,
  Unlink,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface ShelfTableProps {
  items: ItemCatalogoResponse[];
  onQuickIncrement: (item: ItemCatalogoResponse) => void;
  onOpenEdit: (item: ItemCatalogoResponse) => void;
  onUnlink: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onUpdateMeta: (itemId: number) => void;
}

export const ShelfTable: React.FC<ShelfTableProps> = ({
  items,
  onQuickIncrement,
  onOpenEdit,
  onUnlink,
  onRemove,
  onUpdateMeta,
}) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 50 }}>Capa</th>
            <th>Obra</th>
            <th style={{ width: 110 }}>Status</th>
            <th style={{ width: 160 }}>Progresso</th>
            <th style={{ width: 110 }}>Visibilidade</th>
            <th style={{ textAlign: "right", width: 220 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const tituloExibido = item.titulo || item.obraTitulo;
            const capaExibida = item.capaUrl || item.obraCapaUrl;
            const totalCaps = item.totalCapitulos !== undefined ? item.totalCapitulos : item.obraTotalCapitulos;
            const hasTotalCap = totalCaps !== undefined && totalCaps > 0;
            const percentCap = hasTotalCap
              ? Math.min(100, Math.round(((item.progressoAtual || 0) / (totalCaps || 1)) * 100))
              : 0;

            return (
              <tr key={item.id}>
                <td>
                  <Link to={`/minha-estante/${item.id}`} style={{ textDecoration: "none", color: "inherit", display: "inline-block" }}>
                    {capaExibida ? (
                      <img
                        src={capaExibida}
                        alt={tituloExibido}
                        className={styles.tableCover}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 48,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen size={16} style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}
                  </Link>
                </td>
                <td>
                  <div className={styles.tableObraCell}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Link to={`/minha-estante/${item.id}`} className={styles.tableTitle} style={{ textDecoration: "none", color: "inherit" }}>
                          {tituloExibido}
                        </Link>
                        {item.desvinculado && <UnlinkedBadge />}
                      </div>
                      {item.avaliacaoPessoal !== undefined && item.avaliacaoPessoal > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color: "var(--accent-amber)",
                            fontSize: "0.7rem",
                            marginTop: "0.15rem",
                          }}
                        >
                          <Star size={11} fill="currentColor" />
                          Nota: {item.avaliacaoPessoal.toFixed(1)}
                        </span>
                      )}
                      {item.temNovosCapitulos && (
                        <div style={{ marginTop: "0.25rem" }}>
                          <NewChaptersNotificationBadge onUpdateMeta={() => onUpdateMeta(item.id)} />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <StatusBadge status={item.statusLeitura} />
                </td>
                <td>
                  <div className={styles.tableProgress}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      {hasTotalCap
                        ? `Cap. ${item.progressoAtual || 0} / ${totalCaps}`
                        : `Cap. ${item.progressoAtual || 0}`}
                    </span>
                    {hasTotalCap && (
                      <div className={styles.progressBarContainer} style={{ height: 4 }}>
                        <div
                          className={styles.progressBarFill}
                          style={{ width: `${percentCap}%` }}
                        />
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <VisibilityBadge visibility="PRIVADO" />
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <button
                      type="button"
                      className={styles.quickPlusBtn}
                      onClick={() => onQuickIncrement(item)}
                      title="Avançar +1 capítulo"
                      aria-label={`Incrementar +1 capítulo de ${tituloExibido}`}
                    >
                      +1
                    </button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEdit(item)}
                      title="Editar progresso"
                      aria-label="Editar"
                    >
                      <Edit3 size={13} />
                    </Button>

                    {!item.desvinculado && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUnlink(item.id)}
                        title="Desvincular do Catálogo Global (Tornar registro 100% local)"
                        aria-label="Desvincular"
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
                      title="Remover"
                      style={{ color: "var(--accent-rose)" }}
                      aria-label="Remover"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
