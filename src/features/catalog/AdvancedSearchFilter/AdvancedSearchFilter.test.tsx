import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdvancedSearchFilter } from "./AdvancedSearchFilter";
import { INITIAL_FILTER_STATE } from "./types";

vi.mock("../../../services/tag.service", () => ({
  TagService: {
    searchTags: vi.fn().mockResolvedValue([]),
  },
}));

describe("AdvancedSearchFilter", () => {
  it("renderiza a barra de busca e expande o Series Finder", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <AdvancedSearchFilter
        filters={INITIAL_FILTER_STATE}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(screen.getByPlaceholderText(/Buscar por título/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /series finder/i })).toBeInTheDocument();

    // Expande o painel
    await user.click(screen.getByRole("button", { name: /series finder/i }));

    expect(screen.getByText("Formato Literário (Tipo)")).toBeInTheDocument();
    expect(screen.getByText("Status de Publicação")).toBeInTheDocument();
    expect(screen.getByText("Intervalos Numéricos")).toBeInTheDocument();
    expect(screen.getByText("Gêneros")).toBeInTheDocument();
    expect(screen.getByText("Tags da Comunidade")).toBeInTheDocument();
  });

  it("permite alternar formato literário", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AdvancedSearchFilter
        filters={INITIAL_FILTER_STATE}
        onChange={onChange}
        onReset={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /series finder/i }));
    await user.click(screen.getByRole("button", { name: "Mangá" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedTypes: ["MANGA"],
      })
    );
  });

  it("permite alternar lógica E / OU para gêneros", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AdvancedSearchFilter
        filters={{ ...INITIAL_FILTER_STATE, generosModo: "AND" }}
        onChange={onChange}
        onReset={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /series finder/i }));
    await user.click(screen.getByTitle("Aceitar QUALQUER UM dos gêneros incluídos"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        generosModo: "OR",
      })
    );
  });
});
