import React from "react";
import { Link } from "react-router-dom";
import styles from "./Guards.module.css";
import { Card } from "../ui/Card/Card";
import { Button } from "../ui/Button/Button";
import { BookOpen, LogIn, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface AuthRequiredCardProps {
  title?: string;
  description?: string;
}

export const AuthRequiredCard: React.FC<AuthRequiredCardProps> = ({
  title = "Autenticação Necessária",
  description = "Você precisa estar conectado à sua conta Shiori para acessar esta área, acompanhar seu ritmo de leitura e gerenciar suas configurações.",
}) => {
  const { openAuthModal } = useAuthStore();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.iconAuth}`}>
          <BookOpen size={30} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Button variant="primary" size="md" onClick={openAuthModal}>
            <LogIn size={16} />
            <span>Entrar com Minha Conta</span>
          </Button>
          <Link to="/catalogo">
            <Button variant="secondary" size="md">
              <ArrowLeft size={16} />
              <span>Explorar Catálogo</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
