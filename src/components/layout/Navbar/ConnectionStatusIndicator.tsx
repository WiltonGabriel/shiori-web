import React, { useState, useEffect, useRef } from "react";
import styles from "./ConnectionStatusIndicator.module.css";
import { useApiEndpointStore } from "../../../store/apiEndpointStore";
import { Button } from "../../ui/Button/Button";
import { Server, Activity, X, RefreshCw, Unlink } from "lucide-react";
import { toast } from "../../../store/toastStore";

export const ConnectionStatusIndicator: React.FC = () => {
  const {
    currentEndpoint,
    operationMode,
    openModal: openSetupModal,
    setLocalMode,
    testConnection,
  } = useApiEndpointStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    if (operationMode === "local") {
      return;
    }
    const timer = setTimeout(() => {
      if (!active) return;
      setIsChecking(true);
      testConnection(currentEndpoint)
        .then((res) => {
          if (active) setIsLiveConnected(res.ok);
        })
        .catch(() => {
          if (active) setIsLiveConnected(false);
        })
        .finally(() => {
          if (active) setIsChecking(false);
        });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentEndpoint, operationMode, testConnection]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isConnected = operationMode === "connected" && isLiveConnected;

  const handleManualTest = async () => {
    setIsChecking(true);
    try {
      const res = await testConnection(currentEndpoint);
      setIsLiveConnected(res.ok);
      if (res.ok) {
        toast.success(res.message, "Servidor Conectado");
      } else {
        toast.warning(res.message, "Servidor Inacessível");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleDisconnect = () => {
    setLocalMode();
    setIsLiveConnected(false);
    setIsOpen(false);
    toast.info("Desconectado do servidor. Seu aplicativo opera com total autonomia e armazenamento local.");
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        type="button"
        className={styles.indicatorButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Estado da conexão com o servidor"
        aria-expanded={isOpen}
        title={
          isConnected
            ? `Conectado ao servidor: ${currentEndpoint}`
            : "Desconectado do servidor (Operação local ativa)"
        }
      >
        <span
          className={`${styles.dot} ${
            isConnected ? styles.dotConnected : styles.dotDisconnected
          }`}
        />
        <span className={styles.label}>
          {isConnected ? "Conectado ao servidor" : "Desconectado"}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="dialog" aria-label="Painel de Conexão">
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>
              <Server size={16} />
              <span>Conexão Shiori</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar painel"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.2rem",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div className={styles.statusRow}>
            <span
              className={`${styles.dot} ${
                isConnected ? styles.dotConnected : styles.dotDisconnected
              }`}
            />
            <span>
              {isConnected ? "Conectado ao servidor" : "Desconectado"}
            </span>
          </div>

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span>Servidor:</span>
              <span className={styles.detailValue} title={currentEndpoint}>
                {operationMode === "connected" ? currentEndpoint : "Nenhum (Local)"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span>Capacidade Local:</span>
              <span style={{ color: "#10b981", fontWeight: 600 }}>Ativa</span>
            </div>
            <div className={styles.detailItem}>
              <span>Soberania:</span>
              <span>Dados salvos no navegador</span>
            </div>
          </div>

          <div className={styles.actionsCol}>
            {operationMode === "connected" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleManualTest}
                isLoading={isChecking}
              >
                <RefreshCw size={14} />
                <span>Testar Conexão</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                openSetupModal();
              }}
            >
              <Activity size={14} />
              <span>{operationMode === "connected" ? "Configurar Servidor" : "Conectar a um Servidor"}</span>
            </Button>

            {operationMode === "connected" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                style={{ color: "var(--accent-amber)" }}
              >
                <Unlink size={14} />
                <span>Desconectar Servidor</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
