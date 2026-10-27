import React from "react";
import { TODOS_FORMATOS, TIPO_OBRA_LABELS, type TipoObra } from "../../types/work.types";
import {
  type FormatPreferenceState,
  type FormatPreferencesMap,
  FormatPreferencesRepository,
} from "../../services/storage/formatPreferencesRepository";
import { Check, EyeOff, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button/Button";

interface FormatPreferenceSelectorProps {
  preferences: FormatPreferencesMap;
  onChange: (updated: FormatPreferencesMap) => void;
  showHelpNotice?: boolean;
}

export const FormatPreferenceSelector: React.FC<FormatPreferenceSelectorProps> = ({
  preferences,
  onChange,
  showHelpNotice = true,
}) => {
  const handleToggle = (format: TipoObra) => {
    const currentState = preferences[format] || "NEUTRAL";
    let nextState: FormatPreferenceState;

    switch (currentState) {
      case "NEUTRAL":
        nextState = "INTEREST";
        break;
      case "INTEREST":
        nextState = "EXCLUDE";
        break;
      case "EXCLUDE":
      default:
        nextState = "NEUTRAL";
        break;
    }

    const updated = { ...preferences, [format]: nextState };
    FormatPreferencesRepository.savePreferences(updated);
    onChange(updated);
  };

  const handleReset = () => {
    const neutral = FormatPreferencesRepository.resetToNeutral();
    onChange(neutral);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {showHelpNotice && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.65rem",
            padding: "0.75rem 0.95rem",
            background: "rgba(99, 102, 241, 0.07)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--font-size-xs)",
            color: "var(--text-secondary)",
            lineHeight: 1.45,
          }}
        >
          <Sparkles size={16} style={{ color: "var(--brand-primary)", flexShrink: 0, marginTop: "0.15rem" }} />
          <div>
            <strong>Sistema de 3 estados por formato:</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" }}>
              <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                1º clique: Verde (Tenho interesse)
              </span>
              <span>•</span>
              <span style={{ color: "var(--accent-rose)", fontWeight: 600 }}>
                2º clique: Vermelho (Ignorar / Ocultar)
              </span>
              <span>•</span>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                3º clique: Neutro (Indiferente)
              </span>
            </div>
            <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Formatos ignorados serão ocultados das recomendações e do catálogo por padrão, mas continuarão acessíveis na busca manual por título.
            </p>
          </div>
        </div>
      )}

      {/* Grid de Formatos em 3 Estados */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
          gap: "0.5rem",
        }}
      >
        {TODOS_FORMATOS.map((format) => {
          const state = preferences[format] || "NEUTRAL";

          let border = "1px solid var(--border-light)";
          let bg = "var(--bg-surface)";
          let color = "var(--text-secondary)";
          let labelBadge = "Indiferente";
          let badgeColor = "var(--text-muted)";
          let icon = null;

          if (state === "INTEREST") {
            border = "1px solid rgba(16, 185, 129, 0.6)";
            bg = "rgba(16, 185, 129, 0.12)";
            color = "var(--text-primary)";
            labelBadge = "Tenho interesse";
            badgeColor = "var(--accent-emerald)";
            icon = <Check size={14} style={{ color: "var(--accent-emerald)" }} />;
          } else if (state === "EXCLUDE") {
            border = "1px solid rgba(244, 63, 94, 0.6)";
            bg = "rgba(244, 63, 94, 0.12)";
            color = "var(--text-primary)";
            labelBadge = "Ignorar";
            badgeColor = "var(--accent-rose)";
            icon = <EyeOff size={14} style={{ color: "var(--accent-rose)" }} />;
          }

          return (
            <button
              key={format}
              type="button"
              id={`format-toggle-${format.toLowerCase()}`}
              onClick={() => handleToggle(format)}
              title={`Clique para alternar: ${TIPO_OBRA_LABELS[format]} (${labelBadge})`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "0.25rem",
                padding: "0.65rem 0.85rem",
                borderRadius: "var(--radius-md)",
                border,
                background: bg,
                color,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "var(--font-size-xs)" }}>
                  {TIPO_OBRA_LABELS[format]}
                </span>
                {icon}
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: badgeColor,
                }}
              >
                {labelBadge}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          style={{ fontSize: "var(--font-size-xs)", gap: "0.4rem" }}
        >
          <RotateCcw size={12} />
          <span>Restaurar Todos para Neutro</span>
        </Button>
      </div>
    </div>
  );
};
