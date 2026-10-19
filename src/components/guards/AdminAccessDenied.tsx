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
        <h2 className={styles.title}>Acesso Restrito ao SysOverseer</h2>
        <p className={styles.description}>
          Esta área é restrita à governança de alto nível do Shiori. Apenas administradores com papel <code>ROLE_ADMIN</code> possuem autorização de acesso.
        </p>
        <div className={styles.actions}>
          <Link to="/catalogo">
            <Button variant="secondary" size="md">
              <ArrowLeft size={16} />
              <span>Voltar ao Santuário</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
