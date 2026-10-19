import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/Button/Button";
import { UserService } from "../../services/user.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Sparkles, Compass } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen }) => {
  const { updateUser } = useAuthStore();
  const [apelido, setApelido] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apelido.trim()) {
      toast.warning("Por favor, digite um apelido para sua conta.");
      return;
    }

    try {
      setIsSubmitting(true);
      const perfil = await UserService.completeOnboarding({
        apelido: apelido.trim(),
        descricao: descricao.trim() || undefined,
        fusoHorario,
      });

      updateUser({
        apelido: perfil.apelido,
        onboardingConcluido: true,
      });

      toast.success(
        "Seu apelido de leitor foi definido! Recomendamos agora ajustar suas preferências e configurações de conta.",
        "Boas-vindas ao Shiori!"
      );
    } catch (err: any) {
      toast.error(err, "Falha ao Concluir Onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Boas-vindas ao Shiori!"
      closable={false}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "var(--brand-glow)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)" }}>
          <Sparkles size={22} style={{ color: "var(--brand-light)", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Antes de explorar o catálogo e gerenciar sua estante, escolha seu <strong>apelido exclusivo de leitor</strong>.
          </p>
        </div>

        <Input
          label="Apelido de Leitor (Obrigatório)"
          placeholder="Ex: ravena, kenshiro, yuki..."
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
          required
          minLength={3}
          maxLength={50}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
            Bio / Apresentação (Opcional)
          </label>
          <textarea
            placeholder="Conte um pouco sobre suas leituras favoritas..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={250}
            rows={3}
            style={{
              padding: "0.65rem 0.95rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              fontSize: "var(--text-sm)",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
            Fuso Horário
          </label>
          <select
            value={fusoHorario}
            onChange={(e) => setFusoHorario(e.target.value)}
            style={{
              padding: "0.65rem 0.95rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              minHeight: "var(--touch-target-min)",
              outline: "none",
            }}
          >
            <option value="America/Sao_Paulo">Horário de Brasília (America/Sao_Paulo)</option>
            <option value="America/Manaus">Horário do Amazonas (America/Manaus)</option>
            <option value="America/Belem">Horário de Belém (America/Belem)</option>
            <option value="Europe/Lisbon">Horário de Lisboa (Europe/Lisbon)</option>
            <option value="UTC">UTC Padrão</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          style={{ marginTop: "0.5rem" }}
        >
          <Compass size={18} />
          <span>Concluir Cadastro e Iniciar</span>
        </Button>
      </form>
    </Modal>
  );
};
