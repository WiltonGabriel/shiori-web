import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { useAuthStore } from "../../../store/authStore";
import { Home, Compass, Bookmark, User, Settings, ShieldAlert } from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === "ROLE_ADMIN";

  return (
    <aside className={styles.sidebar}>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.active : ""}`
        }
      >
        <Home size={18} />
        <span>Início</span>
      </NavLink>

      <NavLink
        to="/catalogo"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.active : ""}`
        }
      >
        <Compass size={18} />
        <span>Catálogo Global</span>
      </NavLink>

      <NavLink
        to="/minha-estante"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.active : ""}`
        }
      >
        <Bookmark size={18} />
        <span>Minha Estante</span>
      </NavLink>

      {isAuthenticated && (
        <>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            <User size={18} />
            <span>Meu Perfil</span>
          </NavLink>

          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`
            }
          >
            <Settings size={18} />
            <span>Configurações</span>
          </NavLink>
        </>
      )}

      {isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
        >
          <ShieldAlert size={18} />
          <span>Painel Admin</span>
        </NavLink>
      )}
    </aside>
  );
};
