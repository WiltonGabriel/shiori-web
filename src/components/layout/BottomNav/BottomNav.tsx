import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.css";
import { useAuthStore } from "../../../store/authStore";
import { Home, Compass, Bookmark, User, ShieldAlert } from "lucide-react";

export const BottomNav: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === "ROLE_ADMIN";

  return (
    <nav className={styles.bottomNav} aria-label="Navegação Principal Mobile">
      <NavLink
        to="/"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <Home size={20} />
        <span>Início</span>
      </NavLink>

      <NavLink
        to="/catalogo"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <Compass size={20} />
        <span>Catálogo</span>
      </NavLink>

      <NavLink
        to="/meu-catalogo"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <Bookmark size={20} />
        <span>Estante</span>
      </NavLink>

      {isAuthenticated ? (
        <NavLink
          to="/perfil"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          <User size={20} />
          <span>Perfil</span>
        </NavLink>
      ) : null}

      {isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          <ShieldAlert size={20} />
          <span>Admin</span>
        </NavLink>
      )}
    </nav>
  );
};
