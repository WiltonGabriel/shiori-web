import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../../store/authStore";
import type { AuthenticatedUser } from "../../types/auth.types";
import { AdminRoleRoute } from "./AdminRoleRoute";
import { ProtectedRoute } from "./ProtectedRoute";

function userWithRole(role: string): AuthenticatedUser {
  return { role } as unknown as AuthenticatedUser;
}

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/privado"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/privado" element={<div>conteudo privado</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<AdminRoleRoute />}>
          <Route path="/admin" element={<div>painel admin</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isAuthModalOpen: false,
  });
});

describe("ProtectedRoute", () => {
  it("não exibe conteúdo privado enquanto a sessão carrega", () => {
    useAuthStore.setState({ isLoading: true });

    renderProtected();

    expect(screen.queryByText("conteudo privado")).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthModalOpen).toBe(false);
  });

  it("bloqueia visitante, mostra o card de autenticação e abre o modal de login", () => {
    renderProtected();

    expect(screen.queryByText("conteudo privado")).not.toBeInTheDocument();
    expect(screen.getByText("Autenticação Necessária")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthModalOpen).toBe(true);
  });

  it("libera o conteúdo para usuário autenticado sem abrir o modal", () => {
    useAuthStore.setState({ isAuthenticated: true, user: userWithRole("ROLE_USER") });

    renderProtected();

    expect(screen.getByText("conteudo privado")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthModalOpen).toBe(false);
  });
});

describe("AdminRoleRoute", () => {
  it("pede autenticação administrativa a visitante", () => {
    renderAdmin();

    expect(screen.queryByText("painel admin")).not.toBeInTheDocument();
    expect(screen.getByText("Autenticação Administrativa Necessária")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthModalOpen).toBe(true);
  });

  it("nega acesso a leitor comum autenticado", () => {
    useAuthStore.setState({ isAuthenticated: true, user: userWithRole("ROLE_USER") });

    renderAdmin();

    expect(screen.queryByText("painel admin")).not.toBeInTheDocument();
    expect(screen.getByText("Acesso Restrito à Administração")).toBeInTheDocument();
  });

  it("nega acesso quando autenticado sem papel definido", () => {
    useAuthStore.setState({ isAuthenticated: true, user: null });

    renderAdmin();

    expect(screen.queryByText("painel admin")).not.toBeInTheDocument();
  });

  it("libera o painel apenas para ROLE_ADMIN", () => {
    useAuthStore.setState({ isAuthenticated: true, user: userWithRole("ROLE_ADMIN") });

    renderAdmin();

    expect(screen.getByText("painel admin")).toBeInTheDocument();
  });
});
