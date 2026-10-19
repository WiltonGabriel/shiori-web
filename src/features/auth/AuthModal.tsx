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
        await login({ email, senha });
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
            placeholder="ex: leitor_noturno"
            leadingIcon={<User size={16} />}
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            required
          />
        )}

        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          leadingIcon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          leadingIcon={<Lock size={16} />}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

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
