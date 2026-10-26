import React, { useState } from "react";
import { Modal } from "../../components/ui/Modal/Modal";
import { Input } from "../../components/ui/Input/Input";
import { Button } from "../../components/ui/Button/Button";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Mail, Lock, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [apelido, setApelido] = useState("");
  const [lembrarDeMim, setLembrarDeMim] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      if (isRegister) {
        await register({ email, senha, apelido });
        toast.success("Conta criada com sucesso!", `Bem-vindo, @${apelido}!`);
      } else {
        await login({ email, senha, lembrarDeMim });
        toast.success("Login efetuado com sucesso!", "Sessão Iniciada");
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || "Falha na autenticação. Verifique os dados.";
      setErrorMsg(msg);
      toast.error(err, isRegister ? "Erro no Cadastro" : "Falha na Autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? "Criar Conta no Shiori" : "Entrar na sua Estante"}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {errorMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--accent-rose-glow)",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              borderRadius: "var(--radius-md)",
              color: "var(--accent-rose)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {isRegister && (
          <Input
            label="Apelido / Usuário"
            placeholder="Digite seu nome de usuário ou apelido..."
            leadingIcon={<User size={16} />}
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            required
          />
        )}

        <Input
          label="E-mail"
          type="email"
          placeholder="Digite seu endereço de e-mail..."
          leadingIcon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Digite sua senha..."
          leadingIcon={<Lock size={16} />}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        {!isRegister && (
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              fontSize: "var(--font-size-xs)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              userSelect: "none",
              marginTop: "0.25rem",
            }}
          >
            <input
              type="checkbox"
              id="auth-remember-me-checkbox"
              checked={lembrarDeMim}
              onChange={(e) => setLembrarDeMim(e.target.checked)}
              style={{
                marginTop: "0.15rem",
                cursor: "pointer",
                accentColor: "var(--brand-primary)",
              }}
            />
            <div>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                Lembrar de mim neste dispositivo
              </span>
              <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Mantém sua sessão por 30 dias via cookies seguros. Desmarque se estiver usando um dispositivo público.
              </p>
            </div>
          </label>
        )}

        <Button type="submit" variant="primary" size="md" isLoading={isLoading} style={{ marginTop: "0.5rem" }}>
          {isRegister ? "Concluir Cadastro" : "Acessar Conta"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorMsg("");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--brand-primary)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          {isRegister
            ? "Já tem uma conta? Clique aqui para entrar"
            : "Novo no Shiori? Crie sua conta gratuitamente"}
        </button>
      </form>
    </Modal>
  );
};
