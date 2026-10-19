import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Spinner } from "../ui/Spinner/Spinner";
import { AuthRequiredCard } from "./AuthRequiredCard";
import { AdminAccessDenied } from "./AdminAccessDenied";

interface AdminRoleRouteProps {
  children?: React.ReactNode;
}

export const AdminRoleRoute: React.FC<AdminRoleRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuthModal();
    }
  }, [isLoading, isAuthenticated, openAuthModal]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredCard
        title="Autenticação Administrativa Necessária"
        description="Você precisa estar conectado com uma credencial de administrador para acessar o painel de governança do Shiori."
      />
    );
  }

  if (user?.role !== "ROLE_ADMIN") {
    return <AdminAccessDenied />;
  }

  return children ? <>{children}</> : <Outlet />;
};
