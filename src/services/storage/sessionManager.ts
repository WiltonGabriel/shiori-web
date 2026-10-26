import type { AuthenticatedUser } from "../../types/auth.types";

export const AUTH_USER_STORAGE_KEY = "auth_session_user";
export const AUTH_REMEMBER_ME_KEY = "shiori_auth_remember_me";
export const INSTANCE_LOCK_HASH_KEY = "shiori_instance_lock_hash";
export const INSTANCE_LOCK_SALT_KEY = "shiori_instance_lock_salt";
export const INSTANCE_SESSION_UNLOCKED_KEY = "shiori_instance_session_unlocked";

const COOKIE_TOKEN_KEY = "shiori_session_token";
const COOKIE_MAX_AGE_PERSISTENT = 30 * 24 * 60 * 60; // 30 dias em segundos

/**
 * Utilitário nativo de gerenciamento de Cookies seguros (Nextcloud / Netflix-style).
 */
export class CookieHelper {
  public static setCookie(name: string, value: string, persistent: boolean): void {
    if (typeof document === "undefined") return;

    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
    if (persistent) {
      cookieStr += `; Max-Age=${COOKIE_MAX_AGE_PERSISTENT}`;
    }
    if (window.location.protocol === "https:") {
      cookieStr += "; Secure";
    }
    document.cookie = cookieStr;
  }

  public static getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    const prefix = `${encodeURIComponent(name)}=`;

    for (const c of cookies) {
      if (c.startsWith(prefix)) {
        return decodeURIComponent(c.substring(prefix.length));
      }
    }
    return null;
  }

  public static deleteCookie(name: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

/**
 * Gerenciador de Sessão Soberana e Autenticação de Instância (Uncle Bob - SRP).
 * Controla a persistência da sessão de acordo com o parâmetro "Lembrar de mim":
 * - Lembrar de mim marcado: Persistência de 30 dias via localStorage e cookie seguro.
 * - Lembrar de mim desmarcado: Sessão volátil em sessionStorage e session cookie (expira ao fechar navegador).
 */
export class SessionManager {
  public static saveUserSession(user: AuthenticatedUser, rememberMe: boolean): void {
    const serialized = JSON.stringify(user);

    if (rememberMe) {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, serialized);
        localStorage.setItem(AUTH_REMEMBER_ME_KEY, "true");
      }
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
      }
      CookieHelper.setCookie(COOKIE_TOKEN_KEY, user.token, true);
    } else {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(AUTH_USER_STORAGE_KEY, serialized);
      }
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        localStorage.removeItem(AUTH_REMEMBER_ME_KEY);
      }
      CookieHelper.setCookie(COOKIE_TOKEN_KEY, user.token, false);
    }
  }

  public static getStoredUserSession(): { user: AuthenticatedUser | null; isPersistent: boolean } {
    // 1. Prioridade: verificar sessionStorage (sessão ativa na janela/aba atual)
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const raw = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
        if (raw) {
          const user = JSON.parse(raw) as AuthenticatedUser;
          if (user?.token) {
            return { user, isPersistent: false };
          }
        }
      } catch (err) {
        console.warn("Falha ao recuperar sessão temporária do sessionStorage:", err);
      }
    }

    // 2. Segunda verificação: localStorage com Lembrar de Mim ativo
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const isRemembered = localStorage.getItem(AUTH_REMEMBER_ME_KEY) === "true";
        const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
        if (raw && isRemembered) {
          const user = JSON.parse(raw) as AuthenticatedUser;
          if (user?.token) {
            return { user, isPersistent: true };
          }
        }
      } catch (err) {
        console.warn("Falha ao recuperar sessão persistente do localStorage:", err);
      }
    }

    return { user: null, isPersistent: false };
  }

  public static updateUserSession(partial: Partial<AuthenticatedUser>): void {
    const { user, isPersistent } = this.getStoredUserSession();
    if (user) {
      const updated = { ...user, ...partial };
      this.saveUserSession(updated, isPersistent);
    }
  }

  public static clearSession(): void {
    if (typeof window !== "undefined") {
      if (window.localStorage) {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        localStorage.removeItem(AUTH_REMEMBER_ME_KEY);
        localStorage.removeItem(INSTANCE_SESSION_UNLOCKED_KEY);
      }
      if (window.sessionStorage) {
        sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
        sessionStorage.removeItem(INSTANCE_SESSION_UNLOCKED_KEY);
      }
    }
    CookieHelper.deleteCookie(COOKIE_TOKEN_KEY);
  }

  // =========================================================================
  // PROTEÇÃO DE INSTÂNCIA / SENHA MESTRE LOCAL (Nextcloud-like sem servidor)
  // =========================================================================

  public static async hashPassword(password: string, salt: string): Promise<string> {
    if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
      return btoa(`${salt}:${password}`);
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}`);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  public static async setInstanceMasterPassword(password: string): Promise<void> {
    if (!password.trim()) {
      throw new Error("A senha da instância não pode ser vazia.");
    }
    const salt = Array.from(
      typeof window !== "undefined" && window.crypto
        ? window.crypto.getRandomValues(new Uint8Array(16))
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const hash = await this.hashPassword(password.trim(), salt);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(INSTANCE_LOCK_SALT_KEY, salt);
      localStorage.setItem(INSTANCE_LOCK_HASH_KEY, hash);
    }
    this.unlockInstanceSession(true);
  }

  public static hasInstanceMasterPassword(): boolean {
    if (typeof window === "undefined" || !window.localStorage) return false;
    return Boolean(localStorage.getItem(INSTANCE_LOCK_HASH_KEY));
  }

  public static removeInstanceMasterPassword(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(INSTANCE_LOCK_HASH_KEY);
      localStorage.removeItem(INSTANCE_LOCK_SALT_KEY);
      localStorage.removeItem(INSTANCE_SESSION_UNLOCKED_KEY);
    }
  }

  public static async verifyInstanceMasterPassword(password: string): Promise<boolean> {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const salt = localStorage.getItem(INSTANCE_LOCK_SALT_KEY);
    const expectedHash = localStorage.getItem(INSTANCE_LOCK_HASH_KEY);
    if (!salt || !expectedHash) return false;

    const computedHash = await this.hashPassword(password.trim(), salt);
    return computedHash === expectedHash;
  }

  public static unlockInstanceSession(rememberMe: boolean): void {
    if (rememberMe) {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(INSTANCE_SESSION_UNLOCKED_KEY, "true");
      }
    } else {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(INSTANCE_SESSION_UNLOCKED_KEY, "true");
      }
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(INSTANCE_SESSION_UNLOCKED_KEY);
      }
    }
  }

  public static isInstanceSessionUnlocked(): boolean {
    if (!this.hasInstanceMasterPassword()) return true;
    if (typeof window !== "undefined") {
      if (window.sessionStorage && sessionStorage.getItem(INSTANCE_SESSION_UNLOCKED_KEY) === "true") {
        return true;
      }
      if (window.localStorage && localStorage.getItem(INSTANCE_SESSION_UNLOCKED_KEY) === "true") {
        return true;
      }
    }
    return false;
  }

  public static lockInstanceSession(): void {
    if (typeof window !== "undefined") {
      if (window.sessionStorage) sessionStorage.removeItem(INSTANCE_SESSION_UNLOCKED_KEY);
      if (window.localStorage) localStorage.removeItem(INSTANCE_SESSION_UNLOCKED_KEY);
    }
  }
}
