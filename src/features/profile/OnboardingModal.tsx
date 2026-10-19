import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/Button/Button";
import { UserService } from "../../services/user.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Sparkles, Compass, BookOpen, Check } from "lucide-react";
import { TODOS_FORMATOS, TIPO_OBRA_LABELS, type TipoObra } from "../../types/work.types";

interface OnboardingModalProps {
  isOpen: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen }) => {
  const { updateUser } = useAuthStore();
  const [apelido, setApelido] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo");
  const [selectedFormats, setSelectedFormats] = useState<TipoObra[]>(TODOS_FORMATOS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFormat = (format: TipoObra) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const selectAllFormats = () => setSelectedFormats(TODOS_FORMATOS);
  const clearFormats = () => setSelectedFormats([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apelido.trim()) {
      toast.warning("Por favor, digite um apelido para sua conta.");
      return;
    }

    if (selectedFormats.length === 0) {
      toast.warning("Selecione ao menos um formato literário de seu interesse.");
      return;
    }

    try {
      setIsSubmitting(true);
      const perfil = await UserService.completeOnboarding({
        apelido: apelido.trim(),
        descricao: descricao.trim() || undefined,
        fusoHorario,
        formatosPreferidos: selectedFormats,
      });

      updateUser({
        apelido: perfil.apelido,
        onboardingConcluido: true,
        formatosPreferidos: perfil.formatosPreferidos || selectedFormats,
      });

      toast.success(
        "Seu perfil e preferências de leitura foram definidos com sucesso!",
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
            Antes de explorar o catálogo, escolha seu <strong>apelido exclusivo de leitor</strong> e selecione quais <strong>formatos literários</strong> você deseja acompanhar.
          </p>
        </div>

        <Input
          label="Apelido de Leitor (Obrigatório)"
          placeholder="Digite seu nome de usuário ou apelido..."
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
          required
          minLength={3}
          maxLength={50}
        />

        {/* ===================================================================
         * SELEÇÃO OBRIGATÓRIA DE PREFERÊNCIAS DE FORMATO (OBJETIVO 3)
         * =================================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <BookOpen size={14} style={{ color: "var(--brand)" }} />
              <span>Formatos de Leitura de seu Interesse *</span>
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={selectAllFormats}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand-light)",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Marcar Todos
              </button>
              <span style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>|</span>
              <button
                type="button"
                onClick={clearFormats}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Limpar
              </button>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-tertiary)" }}>
            Formatos desmarcados não serão exibidos no seu catálogo, destaques ou estante.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem", marginTop: "0.25rem" }}>
            {TODOS_FORMATOS.map((format) => {
              const isSelected = selectedFormats.includes(format);
              return (
                <button
                  key={format}
                  type="button"
                  onClick={() => toggleFormat(format)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${isSelected ? "var(--brand)" : "var(--border-light)"}`,
                    background: isSelected ? "var(--brand-glow)" : "var(--bg-surface)",
                    color: isSelected ? "var(--brand-light)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "var(--text-xs)",
                    fontWeight: isSelected ? 600 : 500,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{TIPO_OBRA_LABELS[format]}</span>
                  {isSelected && <Check size={14} style={{ color: "var(--brand-light)" }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
            Bio / Apresentação (Opcional)
          </label>
          <textarea
            placeholder="Conte um pouco sobre suas leituras favoritas..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={250}
            rows={2}
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
