import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminTagsTab } from "./AdminTagsTab";
import { TagService } from "../../../services/tag.service";

vi.mock("../../../services/tag.service", () => ({
  TagService: {
    listTagSuggestions: vi.fn(),
    approveTagSuggestion: vi.fn(),
    rejectTagSuggestion: vi.fn(),
  },
}));

vi.mock("../../../store/toastStore", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdminTagsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lista as sugestões pendentes de tags", async () => {
    (TagService.listTagSuggestions as any).mockResolvedValue({
      content: [
        {
          id: 1,
          tagId: 10,
          nomeTag: "Isekai Reverso",
          obraId: 5,
          obraTitulo: "Obra Teste",
          status: "PENDENTE",
          justificativa: "O protagonista veio do outro mundo",
          usuarioSugeridorId: 2,
          usuarioSugeridorApelido: "leitor123",
          dataSugestao: "2026-10-25T20:00:00",
        },
      ],
      totalPages: 1,
      totalElements: 1,
    });

    render(<AdminTagsTab />);

    await waitFor(() => {
      expect(screen.getByText("Isekai Reverso")).toBeInTheDocument();
      expect(screen.getByText("Obra Teste")).toBeInTheDocument();
      expect(screen.getByText(/O protagonista veio do outro mundo/i)).toBeInTheDocument();
      expect(screen.getByText(/leitor123/)).toBeInTheDocument();
    });
  });

  it("aprova uma sugestão de tag", async () => {
    const user = userEvent.setup();
    (TagService.listTagSuggestions as any).mockResolvedValue({
      content: [
        {
          id: 1,
          tagId: 10,
          nomeTag: "Isekai Reverso",
          obraId: 5,
          obraTitulo: "Obra Teste",
          status: "PENDENTE",
          justificativa: "Justificativa",
          usuarioSugeridorId: 2,
          usuarioSugeridorApelido: "leitor123",
          dataSugestao: "2026-10-25T20:00:00",
        },
      ],
      totalPages: 1,
      totalElements: 1,
    });
    (TagService.approveTagSuggestion as any).mockResolvedValue({});

    render(<AdminTagsTab />);
    await waitFor(() => expect(screen.getByText("Isekai Reverso")).toBeInTheDocument());

    const approveBtn = screen.getByRole("button", { name: /aprovar & vincular/i });
    await user.click(approveBtn);

    await waitFor(() => {
      expect(TagService.approveTagSuggestion).toHaveBeenCalledWith(1);
    });
  });

  it("rejeita uma sugestão de tag com motivo obrigatório", async () => {
    const user = userEvent.setup();
    (TagService.listTagSuggestions as any).mockResolvedValue({
      content: [
        {
          id: 2,
          tagId: 11,
          nomeTag: "Tag Inapropriada",
          obraId: 5,
          obraTitulo: "Obra Teste",
          status: "PENDENTE",
          justificativa: "Justificativa",
          usuarioSugeridorId: 2,
          usuarioSugeridorApelido: "leitor123",
          dataSugestao: "2026-10-25T20:00:00",
        },
      ],
      totalPages: 1,
      totalElements: 1,
    });
    (TagService.rejectTagSuggestion as any).mockResolvedValue({});

    render(<AdminTagsTab />);
    await waitFor(() => expect(screen.getByText("Tag Inapropriada")).toBeInTheDocument());

    const rejectBtn = screen.getByRole("button", { name: /^rejeitar$/i });
    await user.click(rejectBtn);

    expect(screen.getByText("Rejeitar Sugestão de Tag")).toBeInTheDocument();

    const motivoInput = screen.getByPlaceholderText(/Ex: Tag ofensiva, redundante/i);
    await user.type(motivoInput, "Tag duplicada com sinônimo existente");

    const confirmRejectBtn = screen.getByRole("button", { name: /confirmar rejeição/i });
    await user.click(confirmRejectBtn);

    await waitFor(() => {
      expect(TagService.rejectTagSuggestion).toHaveBeenCalledWith(2, "Tag duplicada com sinônimo existente");
    });
  });
});
