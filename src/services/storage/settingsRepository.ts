export const STORAGE_KEY_DEFAULT_SYNC_METADATA = "shiori_default_sync_metadata";

/**
 * Repositório Soberano de Configurações do Leitor (Uncle Bob - SRP).
 * Gerencia preferências globais como a sincronização padrão de novas obras.
 */
export class SettingsRepository {
  /**
   * Retorna a preferência global de sincronização de metadados para novas obras.
   * Por padrão, é verdadeira (true) até ser explicitamente alterada pelo usuário.
   */
  public static getDefaultSyncMetadata(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
      return true;
    }
    const val = localStorage.getItem(STORAGE_KEY_DEFAULT_SYNC_METADATA);
    if (val === null) return true;
    return val === "true";
  }

  /**
   * Salva a preferência global de sincronização de metadados para novas obras.
   */
  public static setDefaultSyncMetadata(enabled: boolean): void {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_DEFAULT_SYNC_METADATA, String(enabled));
    }
  }
}
