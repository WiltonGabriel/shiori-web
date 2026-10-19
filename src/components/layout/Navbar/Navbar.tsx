import React from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useAuthStore } from "../../../store/authStore";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Button } from "../../ui/Button/Button";
import { LogIn, LogOut } from "lucide-react";

interface NavbarProps {
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <Link to="/" className={styles.logoLink} aria-label="Shiori Home">
          <img src="/shiori-logo.svg" alt="Shiori Logo" className={styles.logoImg} />
          <span className={styles.brandName}>Shiori</span>
        </Link>
      </div>

      <div className={styles.right}>
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
