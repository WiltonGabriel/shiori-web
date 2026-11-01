import { api } from "./api";

export interface GeneroItem {
  id: number;
  nome: string;
}

export const DEFAULT_GENRES: GeneroItem[] = [
  { id: 1, nome: "Ação" },
  { id: 2, nome: "Aventura" },
  { id: 3, nome: "Comédia" },
  { id: 4, nome: "Drama" },
  { id: 5, nome: "Fantasia" },
  { id: 6, nome: "Ficção Científica" },
  { id: 7, nome: "Mistério" },
  { id: 8, nome: "Romance" },
  { id: 9, nome: "Slice of Life" },
  { id: 10, nome: "Sobrenatural" },
  { id: 11, nome: "Terror" },
  { id: 12, nome: "Histórico" },
  { id: 13, nome: "Seinen" },
  { id: 14, nome: "Shounen" },
  { id: 15, nome: "Shoujo" },
  { id: 16, nome: "Josei" },
  { id: 17, nome: "Isekai" },
  { id: 18, nome: "Artes Marciais" },
  { id: 19, nome: "Esportes" },
  { id: 20, nome: "Psicológico" },
  { id: 21, nome: "Suspense" },
  { id: 22, nome: "Cyberpunk" },
  { id: 23, nome: "Distopia" },
  { id: 24, nome: "Escolar" },
  { id: 25, nome: "Mecha" },
  { id: 26, nome: "Musical" },
  { id: 27, nome: "Policial" },
  { id: 28, nome: "Militar" },
  { id: 29, nome: "Culinária" },
  { id: 30, nome: "Jogo / LitRPG" },
  { id: 31, nome: "Não-Ficção" },
  { id: 32, nome: "Biografia / Memórias" },
  { id: 33, nome: "Filosofia" },
  { id: 34, nome: "Poesia" },
  { id: 35, nome: "Autoajuda" },
  { id: 36, nome: "Cultivação (Xianxia / Wuxia)" },
  { id: 37, nome: "Dungeon / Portais" },
  { id: 38, nome: "Regressão" },
  { id: 39, nome: "Super-heróis" },
  { id: 40, nome: "Otome Isekai (Vilã)" },
  { id: 41, nome: "Transmigração" },
];

/**
 * Mapeamento contextual de gêneros permitidos por formato.
 * Garante que gêneros de anime/mangá (ex.: Shonen, Isekai, Mecha) nunca poluam
 * a seleção de um Livro tradicional, e gêneros acadêmicos/não-ficção não poluam mangás.
 */
export const FORMAT_GENRES_MAP: Record<string, string[]> = {
  LIVRO: [
    "Ficção Científica",
    "Fantasia",
    "Romance",
    "Suspense",
    "Mistério",
    "Policial",
    "Terror",
    "Drama",
    "Histórico",
    "Distopia",
    "Cyberpunk",
    "Aventura",
    "Psicológico",
    "Não-Ficção",
    "Biografia / Memórias",
    "Filosofia",
    "Poesia",
    "Autoajuda",
    "Culinária",
    "Militar",
    "Comédia",
  ],
  MANGA: [
    "Shounen",
    "Shoujo",
    "Seinen",
    "Josei",
    "Isekai",
    "Ação",
    "Aventura",
    "Comédia",
    "Drama",
    "Fantasia",
    "Ficção Científica",
    "Romance",
    "Slice of Life",
    "Sobrenatural",
    "Terror",
    "Mistério",
    "Artes Marciais",
    "Esportes",
    "Psicológico",
    "Suspense",
    "Cyberpunk",
    "Escolar",
    "Mecha",
    "Musical",
    "Policial",
    "Militar",
    "Culinária",
    "Jogo / LitRPG",
    "Histórico",
  ],
  MANHWA: [
    "Dungeon / Portais",
    "Jogo / LitRPG",
    "Regressão",
    "Isekai",
    "Otome Isekai (Vilã)",
    "Artes Marciais",
    "Ação",
    "Fantasia",
    "Romance",
    "Drama",
    "Sobrenatural",
    "Escolar",
    "Comédia",
    "Mistério",
    "Psicológico",
    "Terror",
    "Histórico",
    "Slice of Life",
    "Suspense",
  ],
  MANHUA: [
    "Cultivação (Xianxia / Wuxia)",
    "Artes Marciais",
    "Transmigração",
    "Isekai",
    "Ação",
    "Fantasia",
    "Sobrenatural",
    "Comédia",
    "Romance",
    "Aventura",
    "Histórico",
    "Drama",
  ],
  LIGHT_NOVEL: [
    "Isekai",
    "Fantasia",
    "Shounen",
    "Seinen",
    "Romance",
    "Ação",
    "Aventura",
    "Ficção Científica",
    "Mecha",
    "Escolar",
    "Slice of Life",
    "Sobrenatural",
    "Mistério",
    "Jogo / LitRPG",
    "Psicológico",
    "Comédia",
    "Drama",
  ],
  WEB_NOVEL: [
    "Jogo / LitRPG",
    "Cultivação (Xianxia / Wuxia)",
    "Isekai",
    "Transmigração",
    "Regressão",
    "Dungeon / Portais",
    "Ação",
    "Aventura",
    "Ficção Científica",
    "Romance",
    "Sobrenatural",
    "Mistério",
    "Fantasia",
    "Drama",
  ],
  COMIC: [
    "Super-heróis",
    "Ficção Científica",
    "Ação",
    "Aventura",
    "Policial",
    "Terror",
    "Suspense",
    "Mistério",
    "Cyberpunk",
    "Distopia",
    "Militar",
    "Drama",
    "Comédia",
  ],
};

const GENRES_CACHE_KEY = "shiori_cached_genres";

export class GenreService {
  private static cached: GeneroItem[] | null = null;

  public static async getGenres(): Promise<GeneroItem[]> {
    if (this.cached && this.cached.length > 0) {
      return this.cached;
    }

    let localGenres: GeneroItem[] = [...DEFAULT_GENRES];

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(GENRES_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localGenres = parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      const response = await api.get<GeneroItem[]>("/api/generos");
      if (Array.isArray(response.data) && response.data.length > 0) {
        const map = new Map<string, GeneroItem>();
        localGenres.forEach((g) => map.set(g.nome.toLowerCase().trim(), g));
        response.data.forEach((g) => {
          const key = g.nome.toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, g);
          }
        });
        const merged = Array.from(map.values());
        this.cached = merged;
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(GENRES_CACHE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    } catch {
      // Fallback gracioso com preservação integral de dados locais
    }

    this.cached = localGenres;
    return localGenres;
  }

  /**
   * Filtra dinamicamente os gêneros aplicáveis estritamente ao formato selecionado.
   */
  public static getGenresForFormat(format: string, allGenres: GeneroItem[]): GeneroItem[] {
    const upperFormat = (format || "").toUpperCase();
    const allowed = FORMAT_GENRES_MAP[upperFormat];
    if (!allowed || allowed.length === 0) {
      return allGenres;
    }

    const allowedLower = new Set(allowed.map((a) => a.toLowerCase().trim()));
    return allGenres.filter((g) => allowedLower.has(g.nome.toLowerCase().trim()));
  }
}
