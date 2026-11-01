import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./features/home/HomePage";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { WorkDetailsPage } from "./features/catalog/WorkDetailsPage";
import { ShelfPage } from "./features/shelf/ShelfPage";
import { PersonalWorkDetailsPage } from "./features/shelf/PersonalWorkDetailsPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { ReaderProfilePage } from "./features/profile/ReaderProfilePage";
import { SettingsPage } from "./features/profile/SettingsPage";
import { NotFoundPage } from "./features/notFound/NotFoundPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useAuthStore } from "./store/authStore";
import { useBroadcastStore } from "./store/broadcastStore";
import { BroadcastService } from "./services/broadcast.service";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";
import { getApiBaseUrl, isLocalMode } from "./services/api/httpClient";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const OfficialAdminRedirect: React.FC = () => {
  useEffect(() => {
    window.location.href = `${getApiBaseUrl().replace(/\/+$/, "")}/admin/`;
  }, []);
  return null;
};

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();
  const { setBroadcasts } = useBroadcastStore();

  useEffect(() => {
    initAuth();

    if (!isLocalMode()) {
      BroadcastService.getActiveBroadcasts()
        .then((data) => setBroadcasts(data))
        .catch(() => {});
    }
  }, [initAuth, setBroadcasts]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="catalogo" element={<CatalogPage />} />
              <Route path="catalogo/:id" element={<WorkDetailsPage />} />
              <Route path="obras/:id" element={<WorkDetailsPage />} />
              <Route path="explorar" element={<Navigate to="/catalogo" replace />} />
              <Route path="leitor/:username" element={<ReaderProfilePage />} />
              <Route path="perfil/:username" element={<ReaderProfilePage />} />

              {/* Rotas Protegidas de Leitor */}
              <Route element={<ProtectedRoute />}>
                <Route path="minha-estante" element={<ShelfPage />} />
                <Route path="minha-estante/:id" element={<PersonalWorkDetailsPage />} />
                <Route path="meu-catalogo" element={<Navigate to="/minha-estante" replace />} />
                <Route path="meu-catalogo/:id" element={<PersonalWorkDetailsPage />} />
                <Route path="estante" element={<Navigate to="/minha-estante" replace />} />
                <Route path="estante/:id" element={<PersonalWorkDetailsPage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
              </Route>

              {/* Redirecionamento para o Painel Administrativo Oficial na Shiori API */}
              <Route path="admin" element={<OfficialAdminRedirect />} />

              {/* Página 404 para qualquer rota não mapeada */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
