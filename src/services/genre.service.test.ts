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

  it("filtra dinamicamente os gêneros pertinentes ao formato da obra (LIVRO vs MANGA)", () => {
    // 1. Gêneros para LIVRO
    const bookGenres = GenreService.getGenresForFormat("LIVRO", DEFAULT_GENRES);
    const bookNames = bookGenres.map((g) => g.nome);

    expect(bookNames).toContain("Romance");
    expect(bookNames).toContain("Ficção Científica");
    expect(bookNames).toContain("Não-Ficção");
    expect(bookNames).toContain("Poesia");
    expect(bookNames).toContain("Filosofia");
    expect(bookNames).not.toContain("Shounen");
    expect(bookNames).not.toContain("Isekai");
    expect(bookNames).not.toContain("Mecha");
    expect(bookNames).not.toContain("Slice of Life");

    // 2. Gêneros para MANGA
    const mangaGenres = GenreService.getGenresForFormat("MANGA", DEFAULT_GENRES);
    const mangaNames = mangaGenres.map((g) => g.nome);

    expect(mangaNames).toContain("Shounen");
    expect(mangaNames).toContain("Seinen");
    expect(mangaNames).toContain("Isekai");
    expect(mangaNames).toContain("Mecha");
    expect(mangaNames).not.toContain("Não-Ficção");
    expect(mangaNames).not.toContain("Poesia");
    expect(mangaNames).not.toContain("Autoajuda");

    // 3. Gêneros para MANHWA
    const manhwaGenres = GenreService.getGenresForFormat("MANHWA", DEFAULT_GENRES);
    const manhwaNames = manhwaGenres.map((g) => g.nome);

    expect(manhwaNames).toContain("Dungeon / Portais");
    expect(manhwaNames).toContain("Regressão");
    expect(manhwaNames).toContain("Otome Isekai (Vilã)");
  });
});
