import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PersonalWorkDetailsPage } from "./PersonalWorkDetailsPage";
import { CatalogService } from "../../services/catalog.service";
import type { ItemCatalogoResponse } from "../../types/catalog.types";

vi.mock("../../services/catalog.service", () => ({
  CatalogService: {
    getCatalogItem: vi.fn(),
    updateProgress: vi.fn(),
    updatePersonalWork: vi.fn(),
    removeItemFromShelf: vi.fn(),
    atualizarMetaCapitulos: vi.fn(),
    vincularObra: vi.fn(),
    desvincularObra: vi.fn(),
  },
}));

vi.mock("../../services/work.service", () => ({
  WorkService: {
    getWorkById: vi.fn(),
  },
}));

describe("PersonalWorkDetailsPage - Conformidade de Ciclos e Soberania", () => {
  const mockItem: ItemCatalogoResponse = {
    id: 1,
    titulo: "Solo Leveling",
    obraTitulo: "Solo Leveling",
    tipoObra: "MANHWA",
    statusLeitura: "LENDO",
    progressoAtual: 10,
    totalCapitulos: 179,
    volumeAtual: 1,
    totalVolumes: 14,
    avaliacaoPessoal: 9,
    visibilidade: "PRIVADO",
    urlLeitura: "https://leitor-privado.local/solo/10",
    dataAdicao: "2026-10-01T10:00:00Z",
    ultimaAtualizacao: "2026-10-01T10:00:00Z",
    desvinculado: false,
    sincronizarMetadados: true,
    generos: ["Ação", "Fantasia"],
    historicosLeitura: [
      {
        id: 1,
        capituloLido: 10,
        volumeLido: 1,
        notaMomento: 9,
        anotacao: "Excelente arco de transição",
        dataLeitura: "2026-10-01T10:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CatalogService.getCatalogItem).mockResolvedValue(mockItem);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/minha-estante/1"]}>
        <Routes>
          <Route path="/minha-estante/:id" element={<PersonalWorkDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renderiza detalhes da obra, gêneros e histórico de leitura", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Solo Leveling" })).toBeDefined();
    });

    expect(screen.getByText("Ação")).toBeDefined();
    expect(screen.getByText("Fantasia")).toBeDefined();
    expect(screen.getByText("Excelente arco de transição")).toBeDefined();
    expect(screen.getByText("Cap. 10")).toBeDefined();
  });

  it("REGRESSÃO CRÍTICA: NÃO exibe botões manuais de encerramento ou registro de ciclo", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Solo Leveling" })).toBeDefined();
    });

    // Prova de ausência de ações manuais de encerramento de ciclo na interface
    expect(screen.queryByText(/concluir ciclo de leitura/i)).toBeNull();
    expect(screen.queryByText(/registrar ciclo/i)).toBeNull();
  });

  it("permite salvar progresso através do scrubber sem abrir modal manual", async () => {
    vi.mocked(CatalogService.updateProgress).mockResolvedValueOnce({
      ...mockItem,
      progressoAtual: 11,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Solo Leveling" })).toBeDefined();
    });

    const saveBtn = screen.getByRole("button", { name: /salvar progresso/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(CatalogService.updateProgress).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          capituloAtual: 10,
          statusLeitura: "LENDO",
        })
      );
    });
  });

  it("conclui obra automaticamente ao salvar progresso igual ou superior ao total de capítulos", async () => {
    vi.mocked(CatalogService.updateProgress).mockResolvedValueOnce({
      ...mockItem,
      progressoAtual: 179,
      statusLeitura: "TERMINOU",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Solo Leveling" })).toBeDefined();
    });

    // Ajusta o input de capítulo para 179 (total da obra)
    const chapterInput = screen.getByLabelText("Ajustar capítulo atual");
    fireEvent.change(chapterInput, { target: { value: "179" } });

    const saveBtn = screen.getByRole("button", { name: /salvar progresso/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(CatalogService.updateProgress).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          capituloAtual: 179,
          statusLeitura: "TERMINOU",
        })
      );
    });
  });
});
