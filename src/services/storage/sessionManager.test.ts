import { describe, it, expect, beforeEach } from "vitest";
import {
  SessionManager,
  AUTH_USER_STORAGE_KEY,
  AUTH_REMEMBER_ME_KEY,
} from "./sessionManager";
import type { AuthenticatedUser } from "../../types/auth.types";

const mockUser: AuthenticatedUser = {
  id: 1,
  email: "leitor@shiori.app",
  apelido: "LeitorShiori",
  role: "ROLE_USER",
  onboardingConcluido: true,
  token: "jwt-test-token-12345",
};

describe("SessionManager - Lembrar de Mim e Sessão Segura (Nextcloud-style)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("deve salvar a sessão em localStorage e persistir cookie quando Lembrar de Mim for true", () => {
    SessionManager.saveUserSession(mockUser, true);

    expect(localStorage.getItem(AUTH_REMEMBER_ME_KEY)).toBe("true");
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toContain("leitor@shiori.app");
    expect(sessionStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();

    const stored = SessionManager.getStoredUserSession();
    expect(stored.user).not.toBeNull();
    expect(stored.user?.email).toBe("leitor@shiori.app");
    expect(stored.isPersistent).toBe(true);
  });

  it("deve salvar a sessão apenas em sessionStorage quando Lembrar de Mim for false", () => {
    SessionManager.saveUserSession(mockUser, false);

    expect(localStorage.getItem(AUTH_REMEMBER_ME_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_USER_STORAGE_KEY)).toContain("leitor@shiori.app");

    const stored = SessionManager.getStoredUserSession();
    expect(stored.user).not.toBeNull();
    expect(stored.user?.email).toBe("leitor@shiori.app");
    expect(stored.isPersistent).toBe(false);
  });

  it("deve limpar a sessão em todos os storages ao fazer logout", () => {
    SessionManager.saveUserSession(mockUser, true);
    SessionManager.clearSession();

    expect(localStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_REMEMBER_ME_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_USER_STORAGE_KEY)).toBeNull();

    const stored = SessionManager.getStoredUserSession();
    expect(stored.user).toBeNull();
  });

  it("deve configurar e validar senha mestre de proteção da instância", async () => {
    expect(SessionManager.hasInstanceMasterPassword()).toBe(false);

    await SessionManager.setInstanceMasterPassword("minhaSenha123");
    expect(SessionManager.hasInstanceMasterPassword()).toBe(true);

    const valida = await SessionManager.verifyInstanceMasterPassword("minhaSenha123");
    expect(valida).toBe(true);

    const invalida = await SessionManager.verifyInstanceMasterPassword("senhaErrada");
    expect(invalida).toBe(false);
  });

  it("deve controlar desbloqueio e bloqueio de instância com Lembrar de Mim", () => {
    SessionManager.unlockInstanceSession(false);
    expect(SessionManager.isInstanceSessionUnlocked()).toBe(true);

    SessionManager.lockInstanceSession();
    // Como foi configurada senha anteriormente, após lock deve ficar bloqueado
    expect(sessionStorage.getItem("shiori_instance_session_unlocked")).toBeNull();
  });
});
