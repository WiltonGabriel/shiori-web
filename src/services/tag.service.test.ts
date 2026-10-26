import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagService } from "./tag.service";
import { api } from "./api";

vi.mock("./api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("TagService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca tags aprovadas de uma obra com scores", async () => {
    const mockTags = [
      { tagId: 1, nome: "Fantasia Sombria", slug: "fantasia-sombria", score: 5, meuVoto: "UPVOTE" },
      { tagId: 2, nome: "Viagem no Tempo", slug: "viagem-no-tempo", score: 2, meuVoto: null },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockTags });

    const result = await TagService.getTagsByWork(42);

    expect(api.get).toHaveBeenCalledWith("/api/obras/42/tags");
    expect(result).toEqual(mockTags);
  });

  it("envia sugestão de tag comunitária", async () => {
    const mockResponse = {
      id: 10,
      obraId: 42,
      nomeTag: "Magia Antiga",
      slugTag: "magia-antiga",
      status: "PENDENTE",
      usuarioSugeridorApelido: "leitor1",
      dataSugestao: "2026-10-25T20:00:00",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await TagService.suggestTag(42, {
      nomeTag: "Magia Antiga",
      justificativa: "Muito relevante para o enredo.",
    });

    expect(api.post).toHaveBeenCalledWith("/api/obras/42/tags/sugestoes", {
      nomeTag: "Magia Antiga",
      justificativa: "Muito relevante para o enredo.",
    });
    expect(result.status).toBe("PENDENTE");
  });

  it("registra voto em tag de obra", async () => {
    const mockVotoRes = {
      tagId: 1,
      obraId: 42,
      scoreAtual: 6,
      meuVoto: "UPVOTE",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockVotoRes });

    const result = await TagService.voteTag(42, 1, "UPVOTE");

    expect(api.post).toHaveBeenCalledWith("/api/obras/42/tags/1/votar", { tipoVoto: "UPVOTE" });
    expect(result.scoreAtual).toBe(6);
    expect(result.meuVoto).toBe("UPVOTE");
  });

  it("pesquisa tags cadastradas com limite", async () => {
    const mockList = [{ id: 1, nome: "Ação", slug: "acao" }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockList });

    const result = await TagService.searchTags("Ação", 10);

    expect(api.get).toHaveBeenCalledWith(
      "/api/tags",
      expect.objectContaining({
        params: expect.any(URLSearchParams),
      })
    );
    expect(result).toEqual(mockList);
  });

  it("permite curador listar, aprovar e rejeitar sugestões de tags", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0, number: 0 },
    });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 5, status: "APROVADA" } });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 6, status: "REJEITADA" } });

    await TagService.listTagSuggestions("PENDENTE", 0, 20);
    expect(api.get).toHaveBeenCalledWith(
      "/api/admin/tags/sugestoes",
      expect.objectContaining({ params: expect.any(URLSearchParams) })
    );

    const aprovada = await TagService.approveTagSuggestion(5);
    expect(api.post).toHaveBeenCalledWith("/api/admin/tags/sugestoes/5/aprovar");
    expect(aprovada.status).toBe("APROVADA");

    const rejeitada = await TagService.rejectTagSuggestion(6, "Fora de escopo");
    expect(api.post).toHaveBeenCalledWith("/api/admin/tags/sugestoes/6/rejeitar", { motivo: "Fora de escopo" });
    expect(rejeitada.status).toBe("REJEITADA");
  });
});
