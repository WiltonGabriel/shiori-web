export interface LocalProfile {
  apelido: string;
  biografia?: string;
  avatarUrl?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export const LOCAL_PROFILE_STORAGE_KEY = "shiori_local_profile";

/**
 * Repositório Soberano de Perfil Pessoal Local (Uncle Bob - SRP).
 * Armazena a identidade independente do leitor no navegador sem depender de servidor remoto.
 */
export class LocalProfileRepository {
  public static getProfile(): LocalProfile | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    try {
      const data = localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed.apelido !== "string") return null;
      return parsed as LocalProfile;
    } catch (err) {
      console.error("Falha ao recuperar perfil local do LocalStorage:", err);
      return null;
    }
  }

  public static saveProfile(data: {
    apelido: string;
    biografia?: string;
    avatarUrl?: string;
  }): LocalProfile {
    const existing = this.getProfile();
    const now = new Date().toISOString();

    const cleanApelido = data.apelido.trim();
    if (!cleanApelido) {
      throw new Error("O apelido de leitor é obrigatório.");
    }

    const profile: LocalProfile = {
      apelido: cleanApelido,
      biografia: data.biografia?.trim() || undefined,
      avatarUrl: data.avatarUrl?.trim() || undefined,
      criadoEm: existing?.criadoEm || now,
      atualizadoEm: now,
    };

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }

    return profile;
  }

  public static hasProfile(): boolean {
    return Boolean(this.getProfile());
  }

  public static clearProfile(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(LOCAL_PROFILE_STORAGE_KEY);
    }
  }
}
