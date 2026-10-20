import React, { useState, useEffect } from "react";
import { Modal } from "../../ui/Modal/Modal";
import { Button } from "../../ui/Button/Button";
import { useApiEndpointStore } from "../../../store/apiEndpointStore";
import { toast } from "../../../store/toastStore";
import { Server, Activity, CheckCircle2, AlertCircle, HardDrive, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import styles from "./ApiEndpointSetupModal.module.css";

type SetupStep = "CHOICE" | "CONFIG_SERVER" | "CONFIRM_LOCAL";

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

  const [step, setStep] = useState<SetupStep>("CHOICE");
  const [inputUrl, setInputUrl] = useState(currentEndpoint);

  useEffect(() => {
    if (isModalOpen) {
      setInputUrl(currentEndpoint);
      setStep("CHOICE");
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

  const handleSaveServer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = inputUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      toast.warning("A URL do endpoint deve iniciar com http:// ou https://");
      return;
    }

    saveEndpoint(cleanUrl);
    toast.success(`Hub Shiori conectado em: ${cleanUrl}`);
  };

  const handleConfirmLocal = () => {
    dismissModal();
    toast.success("Modo Local ativado. Seus dados estão salvos com isolamento no navegador.");
  };

  const handlePresetClick = (preset: string) => {
    setInputUrl(preset);
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={
        step === "CHOICE"
          ? "Bem-vindo ao Shiori 栞"
          : step === "CONFIG_SERVER"
          ? "Conectar ao Servidor Shiori"
          : "Usar Shiori Localmente"
      }
    >
      <div className={styles.container}>
        {/* ETAPA 1: ESCOLHA DE MODO */}
        {step === "CHOICE" && (
          <>
            <div className={styles.stepIndicator}>Etapa 1 de 2 • Escolha como deseja usar o Shiori</div>
            <p className={styles.welcomeIntro}>
              O Shiori foi projetado para conceder total controle ao leitor. Você pode utilizá-lo de forma autônoma e privada no seu navegador ou conectar-se a uma instância do servidor Shiori para sincronização federada.
            </p>

            <div className={styles.choiceGrid}>
              <button
                type="button"
                className={styles.choiceCard}
                onClick={() => setStep("CONFIRM_LOCAL")}
              >
                <div className={styles.choiceIcon}>
                  <HardDrive size={22} />
                </div>
                <div className={styles.choiceTitle}>Uso Local Soberano</div>
                <div className={styles.choiceDesc}>
                  Totalmente offline e privado. Sua estante e notas são salvas localmente no navegador, sem tráfego de dados para servidores externos.
                </div>
              </button>

              <button
                type="button"
                className={styles.choiceCard}
                onClick={() => setStep("CONFIG_SERVER")}
              >
                <div className={styles.choiceIcon}>
                  <Server size={22} />
                </div>
                <div className={styles.choiceTitle}>Conectar a um Servidor</div>
                <div className={styles.choiceDesc}>
                  Sincronização com sua instância ou comunidade Shiori API. Acesso ao catálogo global, busca assistida e backup contínuo.
                </div>
              </button>
            </div>
          </>
        )}

        {/* ETAPA 2A: CONFIRMAR USO LOCAL */}
        {step === "CONFIRM_LOCAL" && (
          <>
            <div className={styles.stepIndicator}>Etapa 2 de 2 • Confirmação do Modo Local</div>
            <div className={styles.localInfoBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-emerald)" }}>
                <ShieldCheck size={18} />
                <strong>Privacidade e Isolamento Garantidos</strong>
              </div>
              <p>
                No modo local, o Shiori não envia requisições a hubs remotos. Você pode exportar e importar seu histórico completo de leitura em JSON a qualquer instante na página de Configurações ou no cabeçalho da Estante.
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                Você poderá conectar um servidor a qualquer momento através do ícone de Servidor na barra superior.
              </p>
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("CHOICE")}
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmLocal}
              >
                <span>Iniciar em Modo Local</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </>
        )}

        {/* ETAPA 2B: CONFIGURAR SERVIDOR */}
        {step === "CONFIG_SERVER" && (
          <form onSubmit={handleSaveServer} className={styles.form}>
            <div className={styles.stepIndicator}>Etapa 2 de 2 • Endereço da API</div>
            <p className={styles.welcomeIntro}>
              Informe o endereço da Shiori API (Hub) que você deseja conectar. Você pode testar a latência antes de salvar.
            </p>

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
                onClick={() => setStep("CHOICE")}
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </Button>
              <Button type="submit" variant="primary" size="sm">
                <Server size={14} />
                <span>Salvar e Conectar</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
