import React, { useState } from "react";
import styles from "./InitialProfileWizardModal.module.css";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/Button/Button";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";
import { toast } from "../../store/toastStore";
import {
  Sparkles,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Server,
  BookOpen,
  Activity,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FormatPreferenceSelector } from "../preferences/FormatPreferenceSelector";
import {
  FormatPreferencesRepository,
  type FormatPreferencesMap,
} from "../../services/storage/formatPreferencesRepository";
import { SessionManager } from "../../services/storage/sessionManager";

interface InitialProfileWizardModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

type WizardStep = "PROFILE" | "CONTENT_PREFERENCES";

export const InitialProfileWizardModal: React.FC<InitialProfileWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateLocalProfile, activateLocalSession } = useAuthStore();
  const {
    currentEndpoint,
    saveEndpoint,
    setLocalMode,
    testConnection,
    isTesting,
  } = useApiEndpointStore();

  const [step, setStep] = useState<WizardStep>("PROFILE");

  // Passo 1: Identidade e Senha Obrigatória (Mínimo 4 caracteres)
  const [apelido, setApelido] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Pergunta Amigável de Conexão com Shiori API (Opcional)
  const [wantsApiConnection, setWantsApiConnection] = useState(false);
  const [apiUrl, setApiUrl] = useState(currentEndpoint || "http://localhost:8080");
  const [isApiTestedAndOk, setIsApiTestedAndOk] = useState(false);

  // Detalhes Opcionais Adicionais (Colapsáveis para responsividade)
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [biografia, setBiografia] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Passo 2: Preferências de Conteúdo (3 estados)
  const [formatPrefs, setFormatPrefs] = useState<FormatPreferencesMap>(() =>
    FormatPreferencesRepository.getPreferences()
  );
  const [metaAnual, setMetaAnual] = useState<number | "">("");

  if (!isOpen) return null;

  const handleNextFromProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApelido = apelido.trim();
    if (!cleanApelido) {
      toast.warning("Por favor, informe seu apelido de leitor.");
      return;
    }

    if (password.trim().length < 4) {
      toast.warning("A senha de acesso é obrigatória e deve ter pelo menos 4 caracteres.");
      return;
    }

    setStep("CONTENT_PREFERENCES");
  };

  const handleTestApi = async () => {
    const res = await testConnection(apiUrl);
    if (res.ok) {
      setIsApiTestedAndOk(true);
      toast.success("Shiori API alcançada com sucesso!", "Conexão Estabelecida");
    } else {
      setIsApiTestedAndOk(false);
      toast.warning(
        res.message || "Não foi possível conectar à API informada. Você pode tentar novamente ou continuar localmente."
      );
    }
  };

  const handleFinishSetup = async () => {
    const cleanApelido = apelido.trim();
    if (!cleanApelido) {
      setStep("PROFILE");
      toast.warning("Por favor, informe seu apelido de leitor.");
      return;
    }

    if (password.trim().length < 4) {
      setStep("PROFILE");
      toast.warning("A senha de acesso é obrigatória e deve ter pelo menos 4 caracteres.");
      return;
    }

    try {
      // 1. Salvar perfil pessoal soberano
      updateLocalProfile({
        apelido: cleanApelido,
        biografia: biografia.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      // 2. Salvar senha mestra de proteção de instância local
      await SessionManager.setInstanceMasterPassword(password.trim());
      SessionManager.unlockInstanceSession(rememberMe);

      // 3. Salvar preferências de formato em 3 estados
      FormatPreferencesRepository.savePreferences(formatPrefs);

      // 4. Salvar conexão caso o usuário tenha desejado conectar
      if (wantsApiConnection && apiUrl.trim()) {
        saveEndpoint(apiUrl.trim());
      } else {
        setLocalMode();
      }

      activateLocalSession();
      toast.success(`Bem-vindo, ${cleanApelido}! Sua estante está pronta.`, "Configuração Concluída");

      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao concluir a configuração inicial.");
    }
  };

  const isStep1Valid = apelido.trim().length >= 2 && password.trim().length >= 4;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={step === "PROFILE" ? "Bem-vindo ao Shiori 栞" : "Preferências de Leitura"}
      closable={false}
    >
      <div className={styles.container}>
        {/* =========================================================================
         * PASSO 1: IDENTIDADE DO LEITOR, SENHA OBRIGATÓRIA E CONEXÃO OPCIONAL
         * ========================================================================= */}
        {step === "PROFILE" && (
          <form onSubmit={handleNextFromProfile} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div className={styles.welcomeBanner}>
              <Sparkles size={18} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
              <p>
                O Shiori é sua estante pessoal e soberana. Defina seu <strong>apelido</strong> e uma <strong>senha de acesso</strong> para proteger seus dados neste dispositivo.
              </p>
            </div>

            {/* 1. Apelido de Leitor */}
            <div className={styles.formGroup}>
              <Input
                id="wizard-nickname-input"
                label="Apelido de Leitor (Obrigatório)"
                placeholder="Como você deseja ser chamado?"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                required
                minLength={2}
                maxLength={50}
                autoFocus
              />
            </div>

            {/* 2. Senha de Acesso Obrigatória (Mínimo 4 Caracteres) */}
            <div className={styles.formGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="wizard-password-input" className={styles.label}>
                  Senha de Acesso (Obrigatória)
                </label>
                <span className={styles.helperText}>Mínimo de 4 caracteres</span>
              </div>

              <div className={styles.passwordInputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="wizard-password-input"
                  className={styles.passwordInput}
                  placeholder="Crie sua senha de acesso local..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                  maxLength={64}
                />
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Checkbox Lembrar de Mim */}
              <label className={styles.rememberMeRow}>
                <input
                  type="checkbox"
                  id="wizard-remember-me-checkbox"
                  className={styles.rememberMeCheckbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Lembrar de mim neste dispositivo (manter desbloqueado por 30 dias)</span>
              </label>
            </div>

            {/* 3. Pergunta Amigável: Gostaria de já conectar a uma Shiori API? */}
            <div
              className={`${styles.friendlyConnectionCard} ${
                wantsApiConnection ? styles.friendlyConnectionCardActive : ""
              }`}
            >
              <label className={styles.connectionQuestionHeader}>
                <input
                  type="checkbox"
                  id="wizard-connect-api-toggle"
                  className={styles.rememberMeCheckbox}
                  checked={wantsApiConnection}
                  onChange={(e) => setWantsApiConnection(e.target.checked)}
                />
                <span className={styles.connectionQuestionText}>
                  <Server size={16} style={{ color: "var(--brand-primary)" }} />
                  Gostaria de já conectar a uma Shiori API?
                </span>
              </label>

              <p className={styles.connectionHint}>
                Opcional. Habilita a pesquisa e importação no <strong>Catálogo Global</strong> colaborativo. Você pode usar o Shiori 100% local e conectar um servidor a qualquer momento em Configurações.
              </p>

              {wantsApiConnection && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className={styles.connectionInputsRow}>
                    <input
                      type="url"
                      id="wizard-api-url-input"
                      className={styles.apiUrlInput}
                      placeholder="http://localhost:8080"
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value);
                        setIsApiTestedAndOk(false);
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleTestApi}
                      isLoading={isTesting}
                    >
                      <Activity size={14} />
                      <span>Testar Conexão</span>
                    </Button>
                  </div>

                  {isApiTestedAndOk && (
                    <div className={styles.connectionSuccessBadge}>
                      <CheckCircle2 size={14} />
                      <span>Conexão verificada e operacional!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Detalhes Opcionais (Biografia e Avatar) - Colapsáveis para economizar espaço vertical */}
            <div>
              <button
                type="button"
                className={styles.extraDetailsToggleBtn}
                onClick={() => setShowExtraDetails(!showExtraDetails)}
              >
                <span>{showExtraDetails ? "Ocultar detalhes extras" : "Personalizar biografia e foto (Opcional)"}</span>
                {showExtraDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showExtraDetails && (
                <div className={styles.extraDetailsCollapsible}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Biografia / Apresentação (Opcional)</label>
                    <textarea
                      placeholder="Gêneros favoritos, autores preferidos ou notas pessoais..."
                      value={biografia}
                      onChange={(e) => setBiografia(e.target.value)}
                      maxLength={250}
                      rows={2}
                      className={styles.apiUrlInput}
                      style={{ resize: "vertical", fontFamily: "inherit" }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>URL da Foto / Avatar (Opcional)</label>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-light)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {avatarUrl.trim() ? (
                          <img
                            src={avatarUrl.trim()}
                            alt="Avatar Preview"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <User size={18} style={{ color: "var(--text-muted)" }} />
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/sua-foto.jpg"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className={styles.apiUrlInput}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ações do Passo 1 */}
            <div className={styles.actionsRow} style={{ justifyContent: "flex-end" }}>
              <Button
                id="wizard-submit-profile-btn"
                type="submit"
                variant="primary"
                size="md"
                disabled={!isStep1Valid}
                style={{ gap: "0.5rem" }}
              >
                <span>Continuar para Preferências</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* =========================================================================
         * PASSO 2: PREFERÊNCIAS DE CONTEÚDO (SISTEMA DE 3 ESTADOS)
         * ========================================================================= */}
        {step === "CONTENT_PREFERENCES" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                Formatos Literários que você Acompanha
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                Selecione os formatos que gosta de acompanhar para calibrar sugestões. Você pode alterar essas escolhas a qualquer momento em Configurações.
              </p>
            </div>

            <FormatPreferenceSelector
              preferences={formatPrefs}
              onChange={(updated) => setFormatPrefs(updated)}
              showHelpNotice={true}
            />

            <div className={styles.formGroup}>
              <label className={styles.label}>Meta Anual de Leituras (Opcional)</label>
              <input
                type="number"
                min={1}
                max={500}
                placeholder="Ex: 12 livros ou mangás no ano"
                value={metaAnual}
                onChange={(e) => setMetaAnual(e.target.value === "" ? "" : Number(e.target.value))}
                className={styles.apiUrlInput}
                style={{ maxWidth: "220px" }}
              />
            </div>

            <div className={styles.actionsRow}>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep("PROFILE")}
                style={{ gap: "0.4rem" }}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </Button>

              <Button
                id="wizard-finish-btn"
                type="button"
                variant="primary"
                size="md"
                onClick={handleFinishSetup}
                style={{ gap: "0.5rem" }}
              >
                <BookOpen size={16} />
                <span>Concluir e Ir para a Estante</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
