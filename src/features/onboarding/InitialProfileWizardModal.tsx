import React, { useState } from "react";
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
  Lock,
  BookOpen,
  Activity,
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

type WizardStep = "PROFILE" | "CONTENT_PREFERENCES" | "OPTIONAL_CONNECTION";

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

  // Passo 1: Perfil
  const [apelido, setApelido] = useState("");
  const [biografia, setBiografia] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Passo 2: Preferências de Conteúdo (3 estados)
  const [formatPrefs, setFormatPrefs] = useState<FormatPreferencesMap>(() =>
    FormatPreferencesRepository.getPreferences()
  );
  const [metaAnual, setMetaAnual] = useState<number | "">("");

  // Passo 3: Conexão Opcional e Segurança de Instância
  const [wantsApiConnection, setWantsApiConnection] = useState(false);
  const [apiUrl, setApiUrl] = useState(currentEndpoint || "http://localhost:8080");
  const [isApiTestedAndOk, setIsApiTestedAndOk] = useState(false);

  const [wantsInstanceLock, setWantsInstanceLock] = useState(false);
  const [instancePassword, setInstancePassword] = useState("");
  const [instanceRememberMe, setInstanceRememberMe] = useState(true);

  if (!isOpen) return null;

  const handleNextFromProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApelido = apelido.trim();
    if (!cleanApelido) {
      toast.warning("Por favor, informe seu apelido de leitor.");
      return;
    }
    setStep("CONTENT_PREFERENCES");
  };

  const handleNextFromPreferences = () => {
    FormatPreferencesRepository.savePreferences(formatPrefs);
    setStep("OPTIONAL_CONNECTION");
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

    try {
      // 1. Salvar perfil pessoal soberano
      updateLocalProfile({
        apelido: cleanApelido,
        biografia: biografia.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      // 2. Salvar preferências de formato em 3 estados
      FormatPreferencesRepository.savePreferences(formatPrefs);

      // 3. Salvar endpoint se o usuário optou por conectar
      if (wantsApiConnection && apiUrl.trim()) {
        saveEndpoint(apiUrl.trim());
      } else {
        setLocalMode();
      }

      // 4. Configurar proteção de instância caso solicitada (Nextcloud-like)
      if (wantsInstanceLock && instancePassword.trim()) {
        await SessionManager.setInstanceMasterPassword(instancePassword.trim());
        SessionManager.unlockInstanceSession(instanceRememberMe);
      }

      activateLocalSession();
      toast.success(`Bem-vindo, ${cleanApelido}! Sua estante está pronta.`, "Configuração Concluída");

      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao concluir a configuração inicial.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={
        step === "PROFILE"
          ? "Bem-vindo ao Shiori 栞"
          : step === "CONTENT_PREFERENCES"
          ? "Preferências de Conteúdo"
          : "Catálogo e Conexão"
      }
      closable={false}
    >
      {/* =========================================================================
       * PASSO 1: IDENTIDADE DO LEITOR
       * ========================================================================= */}
      {step === "PROFILE" && (
        <form onSubmit={handleNextFromProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.85rem 1rem",
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Sparkles size={20} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              O Shiori é sua estante e diário de leitura pessoal. Comece escolhendo seu <strong>apelido de leitor</strong>.
            </p>
          </div>

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

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
              Biografia / Apresentação (Opcional)
            </label>
            <textarea
              placeholder="Gêneros favoritos, autores preferidos ou notas pessoais... (pode ser ignorado)"
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              maxLength={250}
              rows={2}
              style={{
                padding: "0.65rem 0.95rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                fontSize: "var(--font-size-sm)",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
              URL do Avatar (Opcional)
            </label>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--bg-surface-elevated)",
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
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <User size={20} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              <input
                type="url"
                placeholder="https://exemplo.com/sua-foto.jpg (pode ser ignorado)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.65rem 0.95rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "var(--font-size-sm)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <Button
            id="wizard-submit-profile-btn"
            type="submit"
            variant="primary"
            size="md"
            style={{ marginTop: "0.5rem" }}
          >
            <span>Continuar para Preferências</span>
            <ArrowRight size={16} />
          </Button>
        </form>
      )}

      {/* =========================================================================
       * PASSO 2: PREFERÊNCIAS DE CONTEÚDO (SISTEMA DE 3 ESTADOS)
       * ========================================================================= */}
      {step === "CONTENT_PREFERENCES" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "var(--font-size-sm)", fontWeight: 700 }}>
              Formatos Literários que você Acompanha
            </h3>
            <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
              Escolha os formatos de seu interesse para calibrar recomendações. Esta configuração é opcional e você pode alterá-la a qualquer momento em Configurações.
            </p>
          </div>

          <FormatPreferenceSelector
            preferences={formatPrefs}
            onChange={(updated) => setFormatPrefs(updated)}
            showHelpNotice={true}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
              Meta Anual de Leituras (Opcional)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              placeholder="Ex: 12 livros ou obras por ano"
              value={metaAnual}
              onChange={(e) => setMetaAnual(e.target.value === "" ? "" : Number(e.target.value))}
              style={{
                padding: "0.65rem 0.95rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "var(--font-size-sm)",
                outline: "none",
                maxWidth: "220px",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
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
              id="wizard-submit-preferences-btn"
              type="button"
              variant="primary"
              size="md"
              onClick={handleNextFromPreferences}
              style={{ gap: "0.4rem" }}
            >
              <span>Continuar para Conexão</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* =========================================================================
       * PASSO 3: CONEXÃO OPCIONAL & SEGURANÇA DE INSTÂNCIA
       * ========================================================================= */}
      {step === "OPTIONAL_CONNECTION" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.85rem 1rem",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "var(--radius-md)",
              color: "var(--accent-emerald)",
            }}
          >
            <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-primary)", lineHeight: 1.5 }}>
              Sua estante pessoal para <strong>@{apelido}</strong> está configurada com soberania no seu navegador.
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            O Shiori funciona de forma independente no seu dispositivo. Caso deseje habilitar a pesquisa no <strong>Catálogo Global</strong> colaborativo ou sincronizar com uma instância remota, conecte a API abaixo:
          </p>

          {/* Card Opcional: Conectar Shiori API */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
              border: wantsApiConnection
                ? "1px solid var(--brand-primary)"
                : "1px solid var(--border-light)",
              background: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
              }}
            >
              <input
                type="checkbox"
                id="wizard-connect-api-toggle"
                checked={wantsApiConnection}
                onChange={(e) => setWantsApiConnection(e.target.checked)}
                style={{ accentColor: "var(--brand-primary)", width: 16, height: 16, cursor: "pointer" }}
              />
              <Server size={18} style={{ color: "var(--brand-primary)" }} />
              <span>Conectar a uma Shiori API (Habilita Catálogo Global)</span>
            </label>

            {wantsApiConnection && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="url"
                    id="wizard-api-url-input"
                    placeholder="http://localhost:8080"
                    value={apiUrl}
                    onChange={(e) => {
                      setApiUrl(e.target.value);
                      setIsApiTestedAndOk(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.85rem",
                      background: "var(--bg-surface-elevated)",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "var(--font-size-xs)",
                      outline: "none",
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
                    <span>Testar</span>
                  </Button>
                </div>

                {isApiTestedAndOk && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "var(--font-size-xs)",
                      color: "var(--accent-emerald)",
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Conexão verificada e operacional!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Opcional: Proteção de Instância / Senha de Acesso (Nextcloud-like) */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
              border: wantsInstanceLock
                ? "1px solid var(--brand-primary)"
                : "1px solid var(--border-light)",
              background: "var(--bg-surface)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
              }}
            >
              <input
                type="checkbox"
                id="wizard-instance-lock-toggle"
                checked={wantsInstanceLock}
                onChange={(e) => setWantsInstanceLock(e.target.checked)}
                style={{ accentColor: "var(--brand-primary)", width: 16, height: 16, cursor: "pointer" }}
              />
              <Lock size={18} style={{ color: "var(--brand-primary)" }} />
              <span>Proteger esta estante/instância com senha de acesso</span>
            </label>

            {wantsInstanceLock && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
                <input
                  type="password"
                  id="wizard-instance-password-input"
                  placeholder="Digite uma senha para proteger o acesso..."
                  value={instancePassword}
                  onChange={(e) => setInstancePassword(e.target.value)}
                  style={{
                    padding: "0.6rem 0.85rem",
                    background: "var(--bg-surface-elevated)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: "var(--font-size-xs)",
                    outline: "none",
                  }}
                />

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={instanceRememberMe}
                    onChange={(e) => setInstanceRememberMe(e.target.checked)}
                    style={{ accentColor: "var(--brand-primary)" }}
                  />
                  <span>Lembrar de mim neste dispositivo (manter desbloqueado por 30 dias)</span>
                </label>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep("CONTENT_PREFERENCES")}
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
    </Modal>
  );
};
