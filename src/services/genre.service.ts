import { api } from "./api";
import { isLocalMode } from "./api/httpClient";

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
];

const GENRES_CACHE_KEY = "shiori_cached_genres";

export class GenreService {
  private static cached: GeneroItem[] | null = null;

  public static async getGenres(): Promise<GeneroItem[]> {
    if (this.cached && this.cached.length > 0) {
      return this.cached;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(GENRES_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cached = parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    if (isLocalMode()) {
      return this.cached || DEFAULT_GENRES;
    }

    try {
      const response = await api.get<GeneroItem[]>("/api/generos");
      if (Array.isArray(response.data) && response.data.length > 0) {
        this.cached = response.data;
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(GENRES_CACHE_KEY, JSON.stringify(response.data));
        }
        return response.data;
      }
    } catch {
      // Fallback gracioso
    }

    return this.cached || DEFAULT_GENRES;
  }
}
