import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { WorkTagsSection } from "./WorkTagsSection";
import { TagService } from "../../../services/tag.service";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "../../../store/toastStore";

vi.mock("../../../services/tag.service", () => ({
  TagService: {
    getTagsByWork: vi.fn(),
    voteTag: vi.fn(),
    suggestTag: vi.fn(),
    searchTags: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../../store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("../../../store/toastStore", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("WorkTagsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      openAuthModal: vi.fn(),
    });
  });

  it("renderiza as tags da obra e pontuações", async () => {
    (TagService.getTagsByWork as any).mockResolvedValue([
      { tagId: 1, nome: "Protagonista Forte", slug: "protagonista-forte", score: 5, meuVoto: "UPVOTE" },
      { tagId: 2, nome: "Reencarnação", slug: "reencarnacao", score: 2, meuVoto: null },
    ]);

    render(<WorkTagsSection obraId={10} obraTitulo="Solo Leveling" />);

    expect(screen.getByText("Tags Comunitárias")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Protagonista Forte")).toBeInTheDocument();
      expect(screen.getByText("+5")).toBeInTheDocument();
      expect(screen.getByText("Reencarnação")).toBeInTheDocument();
      expect(screen.getByText("+2")).toBeInTheDocument();
    });
  });

  it("permite votar positivamente com atualização de score", async () => {
    const user = userEvent.setup();
    (TagService.getTagsByWork as any).mockResolvedValue([
      { tagId: 1, nome: "Protagonista Forte", slug: "protagonista-forte", score: 3, meuVoto: null },
    ]);
    (TagService.voteTag as any).mockResolvedValue({
      tagId: 1,
      obraId: 10,
      meuVoto: "UPVOTE",
      scoreAtual: 4,
    });

    render(<WorkTagsSection obraId={10} obraTitulo="Solo Leveling" />);
    await waitFor(() => expect(screen.getByText("Protagonista Forte")).toBeInTheDocument());

    const upvoteBtn = screen.getByTitle("Votar a favor da relevância desta tag");
    await user.click(upvoteBtn);

    expect(TagService.voteTag).toHaveBeenCalledWith(10, 1, "UPVOTE");
    await waitFor(() => {
      expect(screen.getByText("+4")).toBeInTheDocument();
    });
  });

  it("solicita autenticação ao tentar votar deslogado", async () => {
    const user = userEvent.setup();
    (useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      openAuthModal: vi.fn(),
    });

    (TagService.getTagsByWork as any).mockResolvedValue([
      { tagId: 1, nome: "Protagonista Forte", slug: "protagonista-forte", score: 3, meuVoto: null },
    ]);

    render(<WorkTagsSection obraId={10} obraTitulo="Solo Leveling" />);
    await waitFor(() => expect(screen.getByText("Protagonista Forte")).toBeInTheDocument());

    const upvoteBtn = screen.getByTitle("Votar a favor da relevância desta tag");
    await user.click(upvoteBtn);

    expect(toast.warning).toHaveBeenCalled();
    expect(TagService.voteTag).not.toHaveBeenCalled();
  });

  it("abre o modal de sugestão ao clicar em Sugerir Tag", async () => {
    const user = userEvent.setup();
    (TagService.getTagsByWork as any).mockResolvedValue([]);

    render(<WorkTagsSection obraId={10} obraTitulo="Solo Leveling" />);

    const suggestBtn = screen.getByRole("button", { name: /sugerir tag/i });
    await user.click(suggestBtn);

    expect(screen.getByText("Sugerir Tag Comunitária")).toBeInTheDocument();
  });
});
