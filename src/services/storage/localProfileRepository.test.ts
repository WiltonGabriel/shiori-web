import { beforeEach, describe, expect, it } from "vitest";
import { LocalProfileRepository, LOCAL_PROFILE_STORAGE_KEY } from "./localProfileRepository";

describe("LocalProfileRepository (Identidade Local Independente)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("retorna null quando nenhum perfil local foi configurado", () => {
    expect(LocalProfileRepository.getProfile()).toBeNull();
    expect(LocalProfileRepository.hasProfile()).toBe(false);
  });

  it("salva o apelido obrigatório e persiste no LocalStorage", () => {
    const profile = LocalProfileRepository.saveProfile({
      apelido: "Leitor Curioso",
      biografia: "Apaixonado por fantasia e ficção científica.",
      avatarUrl: "https://exemplo.com/avatar.jpg",
    });

    expect(profile.apelido).toBe("Leitor Curioso");
    expect(profile.biografia).toBe("Apaixonado por fantasia e ficção científica.");
    expect(profile.avatarUrl).toBe("https://exemplo.com/avatar.jpg");
    expect(profile.criadoEm).toBeTruthy();
    expect(LocalProfileRepository.hasProfile()).toBe(true);

    const stored = JSON.parse(localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY)!);
    expect(stored.apelido).toBe("Leitor Curioso");
  });

  it("permite biografia e avatar vazios (campos opcionais)", () => {
    const profile = LocalProfileRepository.saveProfile({
      apelido: "ApenasApelido",
    });

    expect(profile.apelido).toBe("ApenasApelido");
    expect(profile.biografia).toBeUndefined();
    expect(profile.avatarUrl).toBeUndefined();
  });

  it("rejeita apelido em branco com erro explicativo", () => {
    expect(() => {
      LocalProfileRepository.saveProfile({
        apelido: "   ",
      });
    }).toThrow("O apelido de leitor é obrigatório.");
  });

  it("preserva a data de criação ao atualizar o perfil existente", () => {
    const original = LocalProfileRepository.saveProfile({ apelido: "PrimeiroNome" });
    const dataCriacao = original.criadoEm;

    const atualizado = LocalProfileRepository.saveProfile({
      apelido: "NovoNome",
      biografia: "Nova Bio",
    });

    expect(atualizado.apelido).toBe("NovoNome");
    expect(atualizado.criadoEm).toBe(dataCriacao);
  });

  it("limpa o perfil corretamente", () => {
    LocalProfileRepository.saveProfile({ apelido: "UsuarioTeste" });
    expect(LocalProfileRepository.hasProfile()).toBe(true);

    LocalProfileRepository.clearProfile();
    expect(LocalProfileRepository.hasProfile()).toBe(false);
    expect(LocalProfileRepository.getProfile()).toBeNull();
  });
});
