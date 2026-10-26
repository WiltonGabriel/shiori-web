import React, { useState, useEffect, useRef } from "react";
import styles from "./ConnectionStatusIndicator.module.css";
import { useApiEndpointStore } from "../../../store/apiEndpointStore";
import { Button } from "../../ui/Button/Button";
import { Server, Activity, X, RefreshCw, Unlink } from "lucide-react";
import { toast } from "../../../store/toastStore";

export const ConnectionStatusIndicator: React.FC = () => {
  const {
    currentEndpoint,
    openModal: openSetupModal,
    testConnection,
  } = useApiEndpointStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const check = () => {
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
    };

    check();
    const interval = setInterval(check, 45_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentEndpoint, testConnection]);

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

  const isConnected = isLiveConnected;

  const handleManualTest = async () => {
    setIsChecking(true);
    try {
      const res = await testConnection(currentEndpoint);
      setIsLiveConnected(res.ok);
      if (res.ok) {
        toast.success(res.message, "API Conectada");
      } else {
        toast.warning(res.message, "API Inacessível");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleDisconnect = () => {
    setIsLiveConnected(false);
    setIsOpen(false);
    toast.info("Conexão com a API pausada. Sua aplicação pessoal continua operando normalmente com dados locais.");
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        type="button"
        className={styles.indicatorButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Estado da conexão com a API"
        aria-expanded={isOpen}
        title={
          isConnected
            ? `Conectado à API: ${currentEndpoint}`
            : `Desconectado da API (${currentEndpoint})`
        }
      >
        <span
          className={`${styles.dot} ${
            isConnected ? styles.dotConnected : styles.dotDisconnected
          }`}
        />
        <span className={styles.label}>
          {isConnected ? "Conectado" : "Desconectado"}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="dialog" aria-label="Painel de Conexão">
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>
              <Server size={16} />
              <span>Conexão com a API</span>
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
              {isConnected ? "Conectado à API" : "Desconectado da API"}
            </span>
          </div>

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <span>Endereço da API:</span>
              <span className={styles.detailValue} title={currentEndpoint}>
                {currentEndpoint}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span>Estado da API:</span>
              <span style={{ color: isConnected ? "#10b981" : "var(--accent-amber)", fontWeight: 600 }}>
                {isConnected ? "Online e responsiva" : "Inacessível / Offline"}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span>Aplicação:</span>
              <span>Pessoal e Soberana</span>
            </div>
            <div className={styles.detailItem}>
              <span>Estante Pessoal:</span>
              <span style={{ color: "#10b981", fontWeight: 600 }}>Salva no navegador</span>
            </div>
          </div>

          <div className={styles.actionsCol}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualTest}
              isLoading={isChecking}
            >
              <RefreshCw size={14} />
              <span>Testar Conexão</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                openSetupModal();
              }}
            >
              <Activity size={14} />
              <span>Configurar Endereço da API</span>
            </Button>

            {isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                style={{ color: "var(--accent-amber)" }}
              >
                <Unlink size={14} />
                <span>Desconectar da API</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
