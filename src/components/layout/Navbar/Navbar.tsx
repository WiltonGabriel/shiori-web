import React from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useAuthStore } from "../../../store/authStore";
import { useThemeStore } from "../../../store/themeStore";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Button } from "../../ui/Button/Button";
import { LogIn, LogOut, Sun, Moon } from "lucide-react";

interface NavbarProps {
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <Link to="/" className={styles.logoLink} aria-label="Shiori Catálogo Home">
          <img src="/shiori-logo.svg" alt="Shiori Logo" className={styles.logoImg} />
          <span className={styles.brandName}>Shiori</span>
        </Link>
        <span className={styles.versionBadge} title="Versão Alpha em desenvolvimento">
          v0.0.5-alpha
        </span>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.themeButton}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          title={theme === "dark" ? "Ativar Tema Claro" : "Ativar Tema Escuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAuthenticated && user ? (
          <div className={styles.userMenu}>
            <div className={styles.userMeta}>
              <span className={styles.username}>@{user.apelido || "leitor"}</span>
              <span className={styles.userRole}>
                {user.role === "ROLE_ADMIN" ? "Administrador" : "Leitor"}
              </span>
            </div>
            <Avatar name={user.apelido || user.email} size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut size={16} />
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={onOpenAuthModal}>
            <LogIn size={16} />
            <span>Entrar</span>
          </Button>
        )}
      </div>
    </header>
  );
};
