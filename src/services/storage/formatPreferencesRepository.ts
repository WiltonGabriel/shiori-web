import { TODOS_FORMATOS, type TipoObra } from "../../types/work.types";

export type FormatPreferenceState = "INTEREST" | "EXCLUDE" | "NEUTRAL";

export type FormatPreferencesMap = Record<TipoObra, FormatPreferenceState>;

export const STORAGE_KEY_FORMAT_PREFERENCES = "shiori_format_preferences";

export const DEFAULT_FORMAT_PREFERENCES: FormatPreferencesMap = TODOS_FORMATOS.reduce(
  (acc, format) => {
    acc[format] = "NEUTRAL";
    return acc;
  },
  {} as FormatPreferencesMap
);

/**
 * Repositório Soberano de Preferências de Formato Literário (Uncle Bob - SRP).
 * Gerencia o sistema de 3 estados por formato:
 * - INTEREST: Verde (Tenho interesse / priorizar nas recomendações)
 * - EXCLUDE: Vermelho (Ignorar / ocultar da descoberta e recomendações)
 * - NEUTRAL: Neutro (Indiferente / comportamento padrão sem restrições)
 */
export class FormatPreferencesRepository {
  public static getPreferences(): FormatPreferencesMap {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ...DEFAULT_FORMAT_PREFERENCES };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_FORMAT_PREFERENCES);
      if (!raw) {
        return { ...DEFAULT_FORMAT_PREFERENCES };
      }
      const parsed = JSON.parse(raw) as Partial<FormatPreferencesMap>;
      const merged: FormatPreferencesMap = { ...DEFAULT_FORMAT_PREFERENCES };

      for (const format of TODOS_FORMATOS) {
        const val = parsed[format];
        if (val === "INTEREST" || val === "EXCLUDE" || val === "NEUTRAL") {
          merged[format] = val;
        }
      }

      return merged;
    } catch (err) {
      console.warn("Falha ao recuperar preferências de formato do localStorage:", err);
      return { ...DEFAULT_FORMAT_PREFERENCES };
    }
  }

  public static savePreferences(preferences: FormatPreferencesMap): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY_FORMAT_PREFERENCES, JSON.stringify(preferences));
      } catch (err) {
        console.warn("Falha ao salvar preferências de formato no localStorage:", err);
      }
    }
  }

  public static setFormatState(format: TipoObra, state: FormatPreferenceState): FormatPreferencesMap {
    const current = this.getPreferences();
    current[format] = state;
    this.savePreferences(current);
    return current;
  }

  /**
   * Cicla o estado do formato: NEUTRAL -> INTEREST -> EXCLUDE -> NEUTRAL
   */
  public static cycleFormatState(format: TipoObra): FormatPreferenceState {
    const current = this.getPreferences();
    const currentState = current[format] || "NEUTRAL";
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

    current[format] = nextState;
    this.savePreferences(current);
    return nextState;
  }

  public static getExcludedFormats(): TipoObra[] {
    const prefs = this.getPreferences();
    return TODOS_FORMATOS.filter((f) => prefs[f] === "EXCLUDE");
  }

  public static getInterestedFormats(): TipoObra[] {
    const prefs = this.getPreferences();
    return TODOS_FORMATOS.filter((f) => prefs[f] === "INTEREST");
  }

  public static hasAnyFilter(): boolean {
    const prefs = this.getPreferences();
    return TODOS_FORMATOS.some((f) => prefs[f] !== "NEUTRAL");
  }

  public static resetToNeutral(): FormatPreferencesMap {
    const neutral = { ...DEFAULT_FORMAT_PREFERENCES };
    this.savePreferences(neutral);
    return neutral;
  }

  /**
   * Avalia se uma obra de determinado formato deve ser exibida.
   * Regra estrita de produto:
   * 1. Se for busca manual por texto (isManualSearch = true), SEMPRE exibe (não impede busca direta).
   * 2. Se for descoberta / recomendação (isManualSearch = false):
   *    - Formatos em EXCLUDE são ocultados.
   *    - Todos os demais (INTEREST ou NEUTRAL) são visíveis.
   */
  public static shouldShowInDiscovery(tipoObra: TipoObra, isManualSearch: boolean = false): boolean {
    if (isManualSearch) {
      return true;
    }
    const prefs = this.getPreferences();
    return prefs[tipoObra] !== "EXCLUDE";
  }
}
