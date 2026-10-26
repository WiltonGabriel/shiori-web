import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge Component", () => {
  it("deve renderizar o texto filho corretamente", () => {
    render(<Badge>LENDO</Badge>);
    expect(screen.getByText("LENDO")).toBeInTheDocument();
  });

  it("deve aplicar a variante default 'neutral'", () => {
    const { container } = render(<Badge>Neutro</Badge>);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe("Neutro");
  });

  it("deve suportar variante 'brand' e classes adicionais", () => {
    const { container } = render(<Badge variant="brand" className="custom-test">Destaque</Badge>);
    const span = container.querySelector("span");
    expect(span?.classList.contains("custom-test")).toBe(true);
  });
});
