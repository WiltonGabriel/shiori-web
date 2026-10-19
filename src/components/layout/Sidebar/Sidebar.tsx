import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { useAuthStore } from "../../../store/authStore";
import { Home, Compass, Bookmark, ShieldAlert } from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
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
        to="/explorar"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.active : ""}`
        }
      >
        <Compass size={18} />
        <span>Explorar Catálogo</span>
      </NavLink>

      <NavLink
        to="/estante"
        className={({ isActive }) =>
          `${styles.navLink} ${isActive ? styles.active : ""}`
        }
      >
        <Bookmark size={18} />
        <span>Minha Estante</span>
      </NavLink>

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
