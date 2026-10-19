import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.css";
import { Home, Search, Bookmark, User } from "lucide-react";

export const BottomNav: React.FC = () => {
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
        <Search size={20} />
        <span>Pesquisa</span>
      </NavLink>

      <NavLink
        to="/meu-catalogo"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <Bookmark size={20} />
        <span>Minha Estante</span>
      </NavLink>

      <NavLink
        to="/perfil"
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
      >
        <User size={20} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
};
