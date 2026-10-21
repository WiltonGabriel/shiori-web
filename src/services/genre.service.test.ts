import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenreService, DEFAULT_GENRES } from "./genre.service";
import { api } from "./api";

vi.mock("./api", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("GenreService - Taxonomia e Preservação de Gêneros Locais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset private static cache
    (GenreService as any).cached = null;
  });

  it("retorna DEFAULT_GENRES quando a API está offline e não há cache local", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network Error"));

    const generos = await GenreService.getGenres();
    expect(generos).toHaveLength(DEFAULT_GENRES.length);
    expect(generos[0].nome).toBe("Ação");
  });

  it("preserva e retorna gêneros locais armazenados no LocalStorage quando offline", async () => {
    const customLocal = [
      { id: 101, nome: "Cyberpunk Pessoal" },
      { id: 102, nome: "Isekai Custom" },
    ];
    localStorage.setItem("shiori_cached_genres", JSON.stringify(customLocal));
    vi.mocked(api.get).mockRejectedValueOnce(new Error("API offline"));

    const generos = await GenreService.getGenres();
    expect(generos).toHaveLength(2);
    expect(generos.map((g) => g.nome)).toContain("Cyberpunk Pessoal");
  });

  it("ao conectar com a API, mescla gêneros remotos sem descartar gêneros locais", async () => {
    const local = [
      { id: 1, nome: "Ação" },
      { id: 99, nome: "Mecha Pessoal" },
    ];
    localStorage.setItem("shiori_cached_genres", JSON.stringify(local));

    const apiGenres = [
      { id: 1, nome: "Ação" },
      { id: 2, nome: "Fantasia Oficial" },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: apiGenres });

    const merged = await GenreService.getGenres();
    const nomes = merged.map((g) => g.nome);

    expect(nomes).toContain("Ação");
    expect(nomes).toContain("Mecha Pessoal");
    expect(nomes).toContain("Fantasia Oficial");
    expect(merged.length).toBeGreaterThanOrEqual(3);

    // Confere se persistiu o merge no LocalStorage
    const stored = JSON.parse(localStorage.getItem("shiori_cached_genres")!);
    expect(stored.map((g: any) => g.nome)).toContain("Mecha Pessoal");
    expect(stored.map((g: any) => g.nome)).toContain("Fantasia Oficial");
  });
});
