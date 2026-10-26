import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/Button/Button";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";
import { toast } from "../../store/toastStore";
import { Sparkles, User, ArrowRight, Server, HardDrive, CheckCircle2 } from "lucide-react";

interface InitialProfileWizardModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

type WizardStep = "PROFILE" | "CONNECTION_CHOICE";

export const InitialProfileWizardModal: React.FC<InitialProfileWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateLocalProfile, activateLocalSession } = useAuthStore();
  const { setLocalMode, openModal: openEndpointModal } = useApiEndpointStore();

  const [step, setStep] = useState<WizardStep>("PROFILE");
  const [apelido, setApelido] = useState("");
  const [biografia, setBiografia] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanApelido = apelido.trim();
    if (!cleanApelido) {
      toast.warning("Por favor, informe seu apelido de leitor.");
      return;
    }

    try {
      updateLocalProfile({
        apelido: cleanApelido,
        biografia: biografia.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setStep("CONNECTION_CHOICE");
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível salvar o perfil.");
    }
  };

  const handleStartLocal = () => {
    setLocalMode();
    activateLocalSession();
    toast.success(`Bem-vindo, ${apelido}! Modo local ativo e privado.`, "Perfil Configurado");
    if (onClose) onClose();
  };

  const handleChooseServer = () => {
    activateLocalSession();
    if (onClose) onClose();
    openEndpointModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={step === "PROFILE" ? "Bem-vindo ao Shiori 栞" : "Perfil Configurado!"}
      closable={false}
    >
      {step === "PROFILE" && (
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
              Configure sua <strong>identidade pessoal de leitor</strong>. Seus dados permanecem locais e privados no seu dispositivo.
            </p>
          </div>

          <Input
            id="wizard-nickname-input"
            label="Apelido de Leitor (Obrigatório)"
            placeholder="Como deseja ser chamado?"
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

          <Button id="wizard-submit-profile-btn" type="submit" variant="primary" size="md" style={{ marginTop: "0.5rem" }}>
            <span>Salvar Perfil e Continuar</span>
            <ArrowRight size={16} />
          </Button>
        </form>
      )}

      {step === "CONNECTION_CHOICE" && (
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
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-primary)" }}>
              Perfil criado com sucesso para <strong>{apelido}</strong>!
            </div>
          </div>

          <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            O Shiori Web funciona como um aplicativo pessoal completo no seu dispositivo, mesmo sem servidor.
            A conexão com a Shiori API é opcional e pode ser configurada agora ou a qualquer momento posterior.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button
              id="wizard-start-local-btn"
              type="button"
              onClick={handleStartLocal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--brand-primary)",
                background: "var(--brand-glow)",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: "var(--brand-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                <HardDrive size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--brand-light)" }}>
                  Usar em Modo Local (Recomendado)
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  Acesse sua estante pessoal imediatamente com total privacidade e sem precisar de servidor.
                </div>
              </div>
            </button>

            <button
              id="wizard-start-server-btn"
              type="button"
              onClick={handleChooseServer}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-secondary)",
                  flexShrink: 0,
                }}
              >
                <Server size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
                  Conectar a um Servidor Shiori
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                  Conecte a uma Shiori API para habilitar o Catálogo Global e busca federada.
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
