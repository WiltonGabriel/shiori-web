import React from "react";
import { Link } from "react-router-dom";
import styles from "./NotFoundPage.module.css";
import { Button } from "../../components/ui/Button/Button";
import { Home, Compass, Bookmark, BookX } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.errorCode}>404</div>

        <div className={styles.badge}>
          <BookX size={14} />
          <span>Erro 404 • Página Não Encontrada</span>
        </div>

        <h1 className={styles.title}>Perdido entre os capítulos?</h1>

        <p className={styles.description}>
          A página ou obra que você procurou não existe, foi renomeada ou o endereço digitado está incorreto. Continue sua jornada literária pelo catálogo.
        </p>

        <div className={styles.actions}>
          <Link to="/">
            <Button variant="primary" size="md">
              <Home size={18} />
              <span>Voltar ao Início</span>
            </Button>
          </Link>

          <Link to="/catalogo">
            <Button variant="secondary" size="md">
              <Compass size={18} />
              <span>Catálogo Global</span>
            </Button>
          </Link>

          <Link to="/meu-catalogo">
            <Button variant="ghost" size="md">
              <Bookmark size={18} />
              <span>Meu Catálogo</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
