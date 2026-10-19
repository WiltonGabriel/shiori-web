import React from "react";
import styles from "./TriStateChip.module.css";
import type { TriState } from "../../../types/filter.types";

interface TriStateChipProps {
  label: string;
  state: TriState; // 0, 1, -1
  onChange: (nextState: TriState) => void;
}

export const TriStateChip: React.FC<TriStateChipProps> = ({
  label,
  state,
  onChange,
}) => {
  const handleClick = () => {
    // Ciclo: 0 (Neutro) -> 1 (Incluir +) -> -1 (Excluir -) -> 0 (Neutro)
    if (state === 0) {
      onChange(1);
    } else if (state === 1) {
      onChange(-1);
    } else {
      onChange(0);
    }
  };

  const styleClass =
    state === 1
      ? styles.include
      : state === -1
      ? styles.exclude
      : styles.neutral;

  const symbol = state === 1 ? "+" : state === -1 ? "-" : "";

  return (
    <button
      type="button"
      className={`${styles.chip} ${styleClass}`}
      onClick={handleClick}
      title={`${label}: clique para alternar entre Neutro, Incluir (+) e Excluir (-)`}
    >
      {symbol && <span className={styles.icon}>{symbol}</span>}
      <span>{label}</span>
    </button>
  );
};
