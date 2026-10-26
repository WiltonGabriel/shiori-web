import { beforeEach, describe, expect, it } from "vitest";
import {
  SettingsRepository,
  STORAGE_KEY_DEFAULT_SYNC_METADATA,
} from "./settingsRepository";

describe("SettingsRepository (Sincronização e Preferências)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("retorna true por padrão quando nenhuma preferência foi definida", () => {
    expect(SettingsRepository.getDefaultSyncMetadata()).toBe(true);
  });

  it("salva e recupera a preferência desativada (false)", () => {
    SettingsRepository.setDefaultSyncMetadata(false);
    expect(SettingsRepository.getDefaultSyncMetadata()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY_DEFAULT_SYNC_METADATA)).toBe("false");
  });

  it("salva e recupera a preferência ativada (true)", () => {
    SettingsRepository.setDefaultSyncMetadata(false);
    expect(SettingsRepository.getDefaultSyncMetadata()).toBe(false);

    SettingsRepository.setDefaultSyncMetadata(true);
    expect(SettingsRepository.getDefaultSyncMetadata()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY_DEFAULT_SYNC_METADATA)).toBe("true");
  });
});
