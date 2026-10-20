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
import { SettingsPage } from "./features/profile/SettingsPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { NotFoundPage } from "./features/notFound/NotFoundPage";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { useAuthStore } from "./store/authStore";
import { useBroadcastStore } from "./store/broadcastStore";
import { BroadcastService } from "./services/broadcast.service";

import { ProtectedRoute } from "./components/guards/ProtectedRoute";
import { AdminRoleRoute } from "./components/guards/AdminRoleRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

import { isLocalMode } from "./services/api/httpClient";

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();
  const { setBroadcasts } = useBroadcastStore();

  useEffect(() => {
    initAuth();

    // Carregar comunicados ativos do sistema apenas se não for modo puramente local
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
              <Route path="explorar" element={<Navigate to="/catalogo" replace />} />

              {/* Rotas Protegidas de Leitor */}
              <Route element={<ProtectedRoute />}>
                <Route path="meu-catalogo" element={<ShelfPage />} />
                <Route path="meu-catalogo/:id" element={<PersonalWorkDetailsPage />} />
                <Route path="estante" element={<Navigate to="/meu-catalogo" replace />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
              </Route>

              {/* Rota Protegida de Governança e Administração */}
              <Route element={<AdminRoleRoute />}>
                <Route path="admin" element={<AdminDashboardPage />} />
              </Route>

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

