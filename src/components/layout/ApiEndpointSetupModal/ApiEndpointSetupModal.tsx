import React, { useState, useEffect } from "react";
import { Modal } from "../../ui/Modal/Modal";
import { Button } from "../../ui/Button/Button";
import { useApiEndpointStore } from "../../../store/apiEndpointStore";
import { toast } from "../../../store/toastStore";
import { Server, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./ApiEndpointSetupModal.module.css";

export const ApiEndpointSetupModal: React.FC = () => {
  const {
    currentEndpoint,
    isModalOpen,
    isTesting,
    lastCheckResult,
    closeModal,
    saveEndpoint,
    dismissModal,
    testConnection,
  } = useApiEndpointStore();

  const [inputUrl, setInputUrl] = useState(currentEndpoint);

  useEffect(() => {
    if (isModalOpen) {
      setInputUrl(currentEndpoint);
    }
  }, [isModalOpen, currentEndpoint]);

  const handleTest = async () => {
    if (!inputUrl.trim()) {
      toast.warning("Informe uma URL antes de testar a conexão.");
      return;
    }
    const res = await testConnection(inputUrl.trim());
    if (res.ok) {
      toast.success(res.message, "Hub Shiori Acessível");
    } else {
      toast.error(res.message, "Falha na Conexão");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = inputUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      toast.warning("A URL do endpoint deve iniciar com http:// ou https://");
      return;
    }

    saveEndpoint(cleanUrl);
    toast.success(`Hub Shiori conectado com sucesso em: ${cleanUrl}`);
  };

  const handlePresetClick = (preset: string) => {
    setInputUrl(preset);
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title="Conectar ao Hub Shiori (API)"
    >
      <div className={styles.container}>
        <p className={styles.welcomeIntro}>
          O <strong>Shiori</strong> é desacoplado por design. Configure o endereço da Shiori API (Hub) que este cliente web deve consumir. As requisições subsequentes utilizarão este endpoint dinamicamente sem necessidade de rebuild.
        </p>

        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="api-endpoint-input" className={styles.label}>
              URL da Shiori API (Hub)
            </label>
            <div className={styles.urlRow}>
              <input
                id="api-endpoint-input"
                type="text"
                className={styles.urlInput}
                placeholder="http://localhost:8080 ou https://hub.shiori.app"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                isLoading={isTesting}
                title="Testar acessibilidade e latência deste endpoint"
              >
                <Activity size={14} />
                <span>Testar</span>
              </Button>
            </div>
          </div>

          <div className={styles.presetsSection}>
            <span className={styles.presetsLabel}>Sugestões rápidas:</span>
            <div className={styles.presetsRow}>
              <button
                type="button"
                className={styles.presetBtn}
                onClick={() => handlePresetClick("http://localhost:8080")}
              >
                http://localhost:8080 (Dev Local)
              </button>
              {typeof window !== "undefined" && window.location.hostname !== "localhost" && (
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => handlePresetClick(window.location.origin)}
                >
                  {window.location.origin} (Origem Atual)
                </button>
              )}
            </div>
          </div>

          {lastCheckResult && (
            <div
              className={`${styles.resultBox} ${
                lastCheckResult.ok ? styles.resultSuccess : styles.resultError
              }`}
            >
              {lastCheckResult.ok ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{lastCheckResult.message}</span>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={dismissModal}
            >
              Pular / Usar Localhost
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <Server size={14} />
              <span>Salvar e Conectar</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
