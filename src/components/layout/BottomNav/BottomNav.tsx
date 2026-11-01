import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.css";
import { Home, Compass, Bookmark, User, Settings } from "lucide-react";

export const BottomNav: React.FC = () => {
  return (
    <nav className={styles.bottomNav} aria-label="Navegação Principal Mobile">
      <NavLink
        to="/"
        end
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
        to="/minha-estante"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <Bookmark size={20} />
        <span>Estante</span>
      </NavLink>

      <NavLink
        to="/perfil"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <User size={20} />
        <span>Perfil</span>
      </NavLink>

      <NavLink
        to="/configuracoes"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <Settings size={20} />
        <span>Ajustes</span>
      </NavLink>
    </nav>
  );
};
