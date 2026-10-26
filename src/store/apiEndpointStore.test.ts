import { describe, it, expect, beforeEach } from "vitest";
import { useApiEndpointStore } from "./apiEndpointStore";
import { STORAGE_KEY_API_ENDPOINT } from "../services/api/httpClient";

describe("apiEndpointStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useApiEndpointStore.getState().resetToDefault();
  });

  it("deve iniciar com endpoint padrão e modal fechado", () => {
    const state = useApiEndpointStore.getState();
    expect(state.currentEndpoint).toBe("http://localhost:8080");
    expect(state.isModalOpen).toBe(false);
  });

  it("deve permitir abrir e fechar o modal de configuração", () => {
    useApiEndpointStore.getState().openModal();
    expect(useApiEndpointStore.getState().isModalOpen).toBe(true);

    useApiEndpointStore.getState().closeModal();
    expect(useApiEndpointStore.getState().isModalOpen).toBe(false);
  });

  it("deve atualizar endpoint ativo e persistir no localStorage", () => {
    useApiEndpointStore.getState().saveEndpoint("https://novo-hub.dev");
    expect(useApiEndpointStore.getState().currentEndpoint).toBe("https://novo-hub.dev");
    expect(localStorage.getItem(STORAGE_KEY_API_ENDPOINT)).toBe("https://novo-hub.dev");
  });
});
