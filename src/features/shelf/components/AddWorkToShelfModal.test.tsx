import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddWorkToShelfModal } from "./AddWorkToShelfModal";
import { CatalogService } from "../../../services/catalog.service";
import { WorkService } from "../../../services/work.service";
import * as httpClient from "../../../services/api/httpClient";

vi.mock("../../../services/catalog.service", () => ({
  CatalogService: {
    addItemToShelf: vi.fn(),
  },
}));

vi.mock("../../../services/work.service", () => ({
  WorkService: {
    searchWorksAssisted: vi.fn(),
    createWork: vi.fn(),
  },
}));

vi.mock("../../../services/genre.service", () => ({
  GenreService: {
    getGenres: vi.fn().mockResolvedValue([
      { id: 1, nome: "Ação" },
      { id: 2, nome: "Fantasia" },
    ]),
  },
}));

describe("AddWorkToShelfModal - Fluxo Unificado de Adição e Proposta", () => {
  const mockOnClose = vi.fn();
  const mockOnWorkAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(httpClient, "isLocalMode").mockReturnValue(false);
  });

  it("não renderiza nada quando isOpen for falso", () => {
    const { container } = render(
      <AddWorkToShelfModal isOpen={false} onClose={mockOnClose} onWorkAdded={mockOnWorkAdded} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza campos do formulário e permite adicionar obra com total de capítulos em branco", async () => {
    vi.mocked(CatalogService.addItemToShelf).mockResolvedValueOnce({
      id: 1,
      titulo: "Frieren",
      statusLeitura: "LENDO",
      progressoAtual: 0,
      visibilidade: "PRIVADO",
      dataAdicao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      historicosLeitura: [],
      obraTitulo: "Frieren",
    });

    render(
      <AddWorkToShelfModal isOpen={true} onClose={mockOnClose} onWorkAdded={mockOnWorkAdded} />
    );

    expect(screen.getByText("Adicionar Obra à Minha Estante")).toBeDefined();

    const titleInput = screen.getByLabelText(/Título Principal \*/i);
    fireEvent.change(titleInput, { target: { value: "Frieren" } });

    const submitBtn = screen.getByRole("button", { name: /adicionar à minha estante/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(CatalogService.addItemToShelf).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: "Frieren",
          statusLeitura: "LENDO",
          capituloAtual: 0,
          totalCapitulos: undefined,
        })
      );
    });

    expect(mockOnWorkAdded).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("envia proposta ao Catálogo Global quando o checkbox estiver marcado e conectado", async () => {
    vi.mocked(CatalogService.addItemToShelf).mockResolvedValueOnce({
      id: 2,
      titulo: "Solo Leveling",
      statusLeitura: "LENDO",
      progressoAtual: 1,
      visibilidade: "PRIVADO",
      dataAdicao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      historicosLeitura: [],
      obraTitulo: "Solo Leveling",
    });
    vi.mocked(WorkService.createWork).mockResolvedValueOnce({
      id: 99,
      tituloPrincipal: "Solo Leveling",
      tipoObra: "MANHWA",
      statusCatalogo: "COMUNITARIO",
      generos: ["Ação"],
      tags: [],
    });

    render(
      <AddWorkToShelfModal isOpen={true} onClose={mockOnClose} onWorkAdded={mockOnWorkAdded} />
    );

    const titleInput = screen.getByLabelText(/Título Principal \*/i);
    fireEvent.change(titleInput, { target: { value: "Solo Leveling" } });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const submitBtn = screen.getByRole("button", { name: /adicionar à minha estante/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(CatalogService.addItemToShelf).toHaveBeenCalled();
      expect(WorkService.createWork).toHaveBeenCalledWith(
        expect.objectContaining({
          tituloPrincipal: "Solo Leveling",
        })
      );
    });
  });

  it("preserva a obra na estante mesmo se a proposta para a API falhar ou estiver offline", async () => {
    vi.mocked(CatalogService.addItemToShelf).mockResolvedValueOnce({
      id: 3,
      titulo: "Omniscient Reader",
      statusLeitura: "LENDO",
      progressoAtual: 0,
      visibilidade: "PRIVADO",
      dataAdicao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      historicosLeitura: [],
      obraTitulo: "Omniscient Reader",
    });
    vi.mocked(WorkService.createWork).mockRejectedValueOnce(new Error("API 500"));

    render(
      <AddWorkToShelfModal isOpen={true} onClose={mockOnClose} onWorkAdded={mockOnWorkAdded} />
    );

    const titleInput = screen.getByLabelText(/Título Principal \*/i);
    fireEvent.change(titleInput, { target: { value: "Omniscient Reader" } });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /adicionar à minha estante/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(CatalogService.addItemToShelf).toHaveBeenCalled();
    });

    // Mesmo com erro na API de proposta, o fechamento e atualização da estante ocorrem com sucesso
    expect(mockOnWorkAdded).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("garante isolamento estrito: proposta ao Catálogo Global NUNCA transmite progresso, status ou URL privada", async () => {
    vi.mocked(CatalogService.addItemToShelf).mockResolvedValueOnce({
      id: 4,
      titulo: "Tower of God",
      statusLeitura: "LENDO",
      progressoAtual: 50,
      visibilidade: "PRIVADO",
      dataAdicao: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString(),
      historicosLeitura: [],
      obraTitulo: "Tower of God",
    });
    vi.mocked(WorkService.createWork).mockResolvedValueOnce({
      id: 400,
      tituloPrincipal: "Tower of God",
      tipoObra: "MANHWA",
      statusCatalogo: "COMUNITARIO",
      generos: [],
      tags: [],
    });

    render(
      <AddWorkToShelfModal isOpen={true} onClose={mockOnClose} onWorkAdded={mockOnWorkAdded} />
    );

    const titleInput = screen.getByLabelText(/Título Principal \*/i);
    fireEvent.change(titleInput, { target: { value: "Tower of God" } });

    const privateUrlInput = screen.getByLabelText(/URL Privada de Leitura/i);
    fireEvent.change(privateUrlInput, { target: { value: "https://minha-leitura-secreta.local/cap/50" } });

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole("button", { name: /adicionar à minha estante/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(WorkService.createWork).toHaveBeenCalledTimes(1);
    });

    const callArgs = vi.mocked(WorkService.createWork).mock.calls[0][0] as unknown as Record<string, unknown>;
    // Isolamento de dados pessoais: Proposta transmite apenas metadados canônicos frios
    expect(callArgs.tituloPrincipal).toBe("Tower of God");
    expect(callArgs.tipoObra).toBeDefined();
    expect(callArgs).not.toHaveProperty("urlLeitura");
    expect(callArgs).not.toHaveProperty("statusLeitura");
    expect(callArgs).not.toHaveProperty("capituloAtual");
    expect(callArgs).not.toHaveProperty("progressoAtual");
    expect(callArgs).not.toHaveProperty("volumeAtual");
    expect(callArgs).not.toHaveProperty("avaliacaoPessoal");
    expect(callArgs).not.toHaveProperty("anotacao");
  });
});

