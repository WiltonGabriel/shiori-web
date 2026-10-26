import { describe, it, expect, beforeEach } from "vitest";
import { FormatPreferencesRepository } from "./formatPreferencesRepository";

describe("FormatPreferencesRepository - Sistema de 3 Estados de Formato", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("deve iniciar com todos os formatos em estado neutro (NEUTRAL)", () => {
    const prefs = FormatPreferencesRepository.getPreferences();
    expect(prefs.MANGA).toBe("NEUTRAL");
    expect(prefs.LIVRO).toBe("NEUTRAL");
    expect(prefs.COMIC).toBe("NEUTRAL");
    expect(FormatPreferencesRepository.hasAnyFilter()).toBe(false);
  });

  it("deve ciclar corretamente de NEUTRAL -> INTEREST -> EXCLUDE -> NEUTRAL", () => {
    // 1º clique: NEUTRAL -> INTEREST
    const st1 = FormatPreferencesRepository.cycleFormatState("MANGA");
    expect(st1).toBe("INTEREST");
    expect(FormatPreferencesRepository.getPreferences().MANGA).toBe("INTEREST");

    // 2º clique: INTEREST -> EXCLUDE
    const st2 = FormatPreferencesRepository.cycleFormatState("MANGA");
    expect(st2).toBe("EXCLUDE");
    expect(FormatPreferencesRepository.getPreferences().MANGA).toBe("EXCLUDE");

    // 3º clique: EXCLUDE -> NEUTRAL
    const st3 = FormatPreferencesRepository.cycleFormatState("MANGA");
    expect(st3).toBe("NEUTRAL");
    expect(FormatPreferencesRepository.getPreferences().MANGA).toBe("NEUTRAL");
  });

  it("deve listar formatos excluídos e interessados", () => {
    FormatPreferencesRepository.setFormatState("MANGA", "EXCLUDE");
    FormatPreferencesRepository.setFormatState("MANHWA", "EXCLUDE");
    FormatPreferencesRepository.setFormatState("LIVRO", "INTEREST");

    expect(FormatPreferencesRepository.getExcludedFormats()).toEqual(["MANGA", "MANHWA"]);
    expect(FormatPreferencesRepository.getInterestedFormats()).toEqual(["LIVRO"]);
    expect(FormatPreferencesRepository.hasAnyFilter()).toBe(true);
  });

  it("deve ocultar obras excluídas na descoberta, mas permitir em busca manual", () => {
    FormatPreferencesRepository.setFormatState("MANGA", "EXCLUDE");
    FormatPreferencesRepository.setFormatState("LIVRO", "INTEREST");

    // Descoberta sem busca manual: MANGA deve ser ocultado, LIVRO visível
    expect(FormatPreferencesRepository.shouldShowInDiscovery("MANGA", false)).toBe(false);
    expect(FormatPreferencesRepository.shouldShowInDiscovery("LIVRO", false)).toBe(true);
    expect(FormatPreferencesRepository.shouldShowInDiscovery("LIGHT_NOVEL", false)).toBe(true); // Neutro é visível

    // Busca manual: MANGA deve ser exibido mesmo estando em EXCLUDE
    expect(FormatPreferencesRepository.shouldShowInDiscovery("MANGA", true)).toBe(true);
  });

  it("deve redefinir todos os formatos para neutro com resetToNeutral", () => {
    FormatPreferencesRepository.setFormatState("MANGA", "EXCLUDE");
    FormatPreferencesRepository.setFormatState("LIVRO", "INTEREST");
    expect(FormatPreferencesRepository.hasAnyFilter()).toBe(true);

    FormatPreferencesRepository.resetToNeutral();
    expect(FormatPreferencesRepository.hasAnyFilter()).toBe(false);
    expect(FormatPreferencesRepository.getExcludedFormats()).toEqual([]);
  });
});
