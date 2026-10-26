import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SuggestTagModal } from "./SuggestTagModal";
import { TagService } from "../../../services/tag.service";

vi.mock("../../../services/tag.service", () => ({
  TagService: {
    suggestTag: vi.fn(),
    searchTags: vi.fn(),
  },
}));

vi.mock("../../../store/toastStore", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SuggestTagModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza quando isOpen é falso", () => {
    render(
      <SuggestTagModal
        isOpen={false}
        onClose={vi.fn()}
        obraId={1}
        obraTitulo="Solo Leveling"
      />
    );
    expect(screen.queryByText("Sugerir Tag Comunitária")).not.toBeInTheDocument();
  });

  it("permite sugerir uma nova tag com justificativa", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    (TagService.searchTags as any).mockResolvedValue([]);
    (TagService.suggestTag as any).mockResolvedValue({
      id: 1,
      tagId: null,
      nomeTag: "Sistema",
      justificativa: "Aparece nos primeiros capítulos",
      status: "PENDENTE",
      usuarioSugeridorId: 2,
    });

    render(
      <SuggestTagModal
        isOpen={true}
        onClose={onClose}
        obraId={1}
        obraTitulo="Solo Leveling"
        onSuccess={onSuccess}
      />
    );

    const tagInput = screen.getByPlaceholderText(/Ex: Protagonista Feminina Forte/i);
    await user.type(tagInput, "Sistema");

    const justInput = screen.getByPlaceholderText(/Explique brevemente por que essa tag/i);
    await user.type(justInput, "Aparece nos primeiros capítulos");

    const submitBtn = screen.getByRole("button", { name: /enviar sugestão/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(TagService.suggestTag).toHaveBeenCalledWith(1, {
        tagId: undefined,
        nomeTag: "Sistema",
        justificativa: "Aparece nos primeiros capítulos",
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("desabilita o botão de envio quando o nome da tag está vazio", () => {
    render(
      <SuggestTagModal
        isOpen={true}
        onClose={vi.fn()}
        obraId={1}
        obraTitulo="Solo Leveling"
      />
    );

    const submitBtn = screen.getByRole("button", { name: /enviar sugestão/i });
    expect(submitBtn).toBeDisabled();
  });
});
