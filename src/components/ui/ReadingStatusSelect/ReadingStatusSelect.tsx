import React from "react";
import styles from "./ReadingStatusSelect.module.css";
import type { StatusLeitura } from "../../../types/catalog.types";
import { ChevronDown } from "lucide-react";

import {
  READING_STATUS_OPTIONS,
  type ReadingStatusOption,
} from "./readingStatus.constants";

export type { ReadingStatusOption };

export interface ReadingStatusSelectProps {
  value: StatusLeitura;
  onChange: (value: StatusLeitura) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

export const ReadingStatusSelect: React.FC<ReadingStatusSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  id,
  name,
  "aria-label": ariaLabel = "Selecionar status de leitura",
}) => {
  // Mapeia DROPOU para ABDICOU na seleção caso venha de dados legados
  const normalizedValue = value === "DROPOU" ? "ABDICOU" : value;

  return (
    <div className={`${styles.selectWrapper} ${className || ""}`.trim()}>
      <select
        id={id}
        name={name}
        className={styles.select}
        value={normalizedValue}
        onChange={(e) => onChange(e.target.value as StatusLeitura)}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {READING_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className={styles.iconWrapper} aria-hidden="true">
        <ChevronDown size={16} />
      </div>
    </div>
  );
};
