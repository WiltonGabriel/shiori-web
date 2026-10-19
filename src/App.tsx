import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./features/home/HomePage";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { ShelfPage } from "./features/shelf/ShelfPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { useAuthStore } from "./store/authStore";
import { useBroadcastStore } from "./store/broadcastStore";
import { BroadcastService } from "./services/broadcast.service";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();
  const { setBroadcasts } = useBroadcastStore();

  useEffect(() => {
    initAuth();

    // Carregar broadcasts do sistema vigentes
    BroadcastService.getActiveBroadcasts()
      .then((data) => setBroadcasts(data))
      .catch(() => {});
  }, [initAuth, setBroadcasts]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="explorar" element={<CatalogPage />} />
            <Route path="estante" element={<ShelfPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
