import React from "react";
import { Link } from "react-router-dom";
import styles from "./Guards.module.css";
import { Card } from "../ui/Card/Card";
import { Button } from "../ui/Button/Button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const AdminAccessDenied: React.FC = () => {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.iconRestricted}`}>
          <ShieldAlert size={32} />
        </div>
        <h2 className={styles.title}>Acesso Restrito à Administração</h2>
        <p className={styles.description}>
          Esta área é restrita à governança do Shiori. Apenas administradores com papel <code>ROLE_ADMIN</code> possuem autorização de acesso.
        </p>
        <div className={styles.actions}>
          <Link to="/meu-catalogo">
            <Button variant="secondary" size="md">
              <ArrowLeft size={16} />
              <span>Voltar à Minha Estante</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
