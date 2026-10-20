import type { StatusLeitura } from "../../../types/catalog.types";

export interface ReadingStatusOption {
  value: StatusLeitura;
  label: string;
}

export const READING_STATUS_OPTIONS: ReadingStatusOption[] = [
  { value: "LENDO", label: "Lendo" },
  { value: "PLANEJADO", label: "Quero ler" },
  { value: "PAUSADO", label: "Em pausa" },
  { value: "TERMINOU", label: "Concluído" },
  { value: "ENGAVETADO", label: "Engavetado" },
  { value: "ABDICOU", label: "Abandonado" },
];

export const getReadingStatusLabel = (status: StatusLeitura): string => {
  switch (status) {
    case "LENDO":
      return "Lendo";
    case "PLANEJADO":
      return "Quero ler";
    case "PAUSADO":
      return "Em pausa";
    case "TERMINOU":
      return "Concluído";
    case "ENGAVETADO":
      return "Engavetado";
    case "DROPOU":
    case "ABDICOU":
      return "Abandonado";
    default:
      return status;
  }
};
