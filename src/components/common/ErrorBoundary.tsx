import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";
import { Button } from "../ui/Button/Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou uma falha de renderização:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <AlertTriangle size={32} />
            </div>

            <h2 className={styles.title}>
              {this.props.fallbackTitle || "Algo inesperado aconteceu nesta tela"}
            </h2>

            <p className={styles.subtitle}>
              Um erro impediu a exibição desta seção. Seus dados e seu progresso continuam seguros.
            </p>

            {this.state.error && (
              <details className={styles.details}>
                <summary className={styles.detailsSummary}>Detalhes técnicos do erro</summary>
                <div className={styles.errorText}>
                  {this.state.error.name}: {this.state.error.message}
                </div>
              </details>
            )}

            <div className={styles.actions}>
              <Button variant="primary" size="md" onClick={this.handleReset}>
                <RefreshCw size={16} />
                <span>Tentar Novamente</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <Home size={16} />
                <span>Voltar ao Início</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
