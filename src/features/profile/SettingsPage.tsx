import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SettingsPage.module.css";
import { UserService } from "../../services/user.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Card } from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import {
  KeyRound,
  Mail,
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Eye,
  BookOpen,
  Check,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import type { Visibilidade } from "../../types/catalog.types";
import { TODOS_FORMATOS, TIPO_OBRA_LABELS, type TipoObra } from "../../types/work.types";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${"*".repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

export const SettingsPage: React.FC = () => {
  useDocumentTitle(
    "Configurações da Conta | Shiori",
    "Gerencie a segurança da sua conta, credenciais de acesso, privacidade e direitos LGPD."
  );

  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Preferência de Privacidade Padrão
  const [defaultPrivacy, setDefaultPrivacy] = useState<Visibilidade>(() => {
    return (localStorage.getItem("shiori_default_privacy") as Visibilidade) || "RESTRITO";
  });

  const handleDefaultPrivacyChange = (val: Visibilidade) => {
    setDefaultPrivacy(val);
    localStorage.setItem("shiori_default_privacy", val);
    toast.success(`Privacidade padrão para novas leituras definida como: ${val}`);
  };

  // Formatos Literários Preferidos (Filtro Global Estrito - Objetivo 3)
  const [preferredFormats, setPreferredFormats] = useState<TipoObra[]>(() => {
    return user?.formatosPreferidos && user.formatosPreferidos.length > 0
      ? user.formatosPreferidos
      : TODOS_FORMATOS;
  });
  const [isSavingFormats, setIsSavingFormats] = useState(false);

  const handleToggleFormat = (format: TipoObra) => {
    setPreferredFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleSelectAllFormats = () => setPreferredFormats(TODOS_FORMATOS);
  const handleClearFormats = () => setPreferredFormats([]);

  const handleSaveFormats = async () => {
    if (preferredFormats.length === 0) {
      toast.warning("Selecione ao menos um formato literário.");
      return;
    }
    try {
      setIsSavingFormats(true);
      const res = await UserService.updatePreferredFormats(preferredFormats);
      updateUser({ formatosPreferidos: res.formatosPreferidos || preferredFormats });
      toast.success("Suas preferências de formatos foram salvas e aplicadas a todo o catálogo!");
    } catch (err: any) {
      toast.error(err, "Falha ao Salvar Preferências de Formatos");
    } finally {
      setIsSavingFormats(false);
    }
  };

  // Modais de Alteração
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Formulário de E-mail
  const [novoEmail, setNovoEmail] = useState("");
  const [senhaParaEmail, setSenhaParaEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Formulário de Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Estado de Exportação e Exclusão
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lgpdChecked, setLgpdChecked] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEmail.trim() || !senhaParaEmail) {
      toast.warning("Preencha todos os campos para alterar o e-mail.");
      return;
    }

    try {
      setIsSavingEmail(true);
      const atualizado = await UserService.updateEmail({
        novoEmail: novoEmail.trim(),
        senhaAtual: senhaParaEmail,
      });

      updateUser({ email: atualizado.email });
      toast.success("E-mail atualizado com sucesso!");
      setIsEmailModalOpen(false);
      setNovoEmail("");
      setSenhaParaEmail("");
    } catch (err: any) {
      toast.error(err, "Falha ao Alterar E-mail");
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      toast.warning("A confirmação da nova senha não confere.");
      return;
    }

    if (novaSenha.length < 6) {
      toast.warning("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setIsSavingPassword(true);
      await UserService.updatePassword({
        senhaAtual,
        novaSenha,
      });

      toast.success("Senha alterada com sucesso!");
      setIsPasswordModalOpen(false);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      toast.error(err, "Falha ao Alterar Senha");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const blob = await UserService.exportUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shiori_dados_${user?.apelido || "usuario"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Arquivo de dados JSON exportado com sucesso!");
    } catch (err: any) {
      toast.error(err, "Falha ao Exportar Dados");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!lgpdChecked) {
      toast.warning("Por favor, marque o termo de confirmação de anonimização.");
      return;
    }

    try {
      setIsDeleting(true);
      await UserService.deleteAccountLGPD();
      await logout();
      toast.warning(
        "Sua conta foi anonimizada e seus dados pessoais foram expurgados permanentemente conforme a LGPD.",
        "Conta Excluída"
      );
      navigate("/");
    } catch (err: any) {
      toast.error(err, "Falha ao Excluir Conta");
    } finally {
      setIsDeleting(false);
    }
  };

  const emailMascarado = maskEmail(user?.email || "");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurações da Conta</h1>
        <p className={styles.subtitle}>
          Gerencie a segurança da sua conta, credenciais de acesso e privacidade de dados.
        </p>
      </div>

      {/* 1. Segurança e Acesso */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <KeyRound size={18} style={{ color: "var(--brand-primary)" }} />
          <span>Acesso e Credenciais</span>
        </h2>

        <Card className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Endereço de E-mail</span>
              <span className={styles.settingValue}>{emailMascarado}</span>
              <span className={styles.settingDesc}>
                Utilizado para login e notificações do sistema.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEmailModalOpen(true)}
            >
              <Mail size={14} />
              <span>Alterar E-mail</span>
            </Button>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Senha de Acesso</span>
              <span className={styles.settingValue}>••••••••••••</span>
              <span className={styles.settingDesc}>
                Criptografada com hash BCrypt em repouso no servidor.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              <Lock size={14} />
              <span>Alterar Senha</span>
            </Button>
          </div>
        </Card>
      </section>

      {/* 2. Preferências de Formatos Literários (Filtro Global Estrito - Objetivo 3) */}
      <section className={styles.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
            <BookOpen size={18} style={{ color: "var(--brand-primary)" }} />
            <span>Preferências de Formatos Literários</span>
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={handleSelectAllFormats}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-light)",
                fontSize: "var(--text-xs)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Marcar Todos
            </button>
            <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>|</span>
            <button
              type="button"
              onClick={handleClearFormats}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "var(--text-xs)",
                cursor: "pointer",
              }}
            >
              Desmarcar Todos
            </button>
          </div>
        </div>

        <Card className={styles.card}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Selecione quais formatos de leitura você deseja acompanhar. O catálogo público, destaques e listagens exibirão exclusivamente obras dos formatos ativados.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.6rem" }}>
              {TODOS_FORMATOS.map((format) => {
                const isSelected = preferredFormats.includes(format);
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => handleToggleFormat(format)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.65rem 0.85rem",
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

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveFormats}
                isLoading={isSavingFormats}
              >
                <span>Salvar Preferências de Formatos</span>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Preferências de Leitura e Privacidade Padrão */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Eye size={18} style={{ color: "var(--brand-primary)" }} />
          <span>Privacidade Padrão de Leituras</span>
        </h2>

        <Card className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Visibilidade Padrão para Novas Leituras</span>
              <span className={styles.settingDesc}>
                Define a visibilidade inicial ao adicionar novas obras à sua estante (Público, Restrito ou Privado).
              </span>
            </div>
            <select
              value={defaultPrivacy}
              onChange={(e) => handleDefaultPrivacyChange(e.target.value as Visibilidade)}
              style={{
                padding: "0.6rem 0.95rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "var(--text-xs)",
                cursor: "pointer",
                outline: "none",
                minHeight: "var(--touch-target-min)",
              }}
              title="Seletor de privacidade padrão"
            >
              <option value="PUBLICO">Público (Visível a todos)</option>
              <option value="RESTRITO">Restrito (Conexões mútuas)</option>
              <option value="PRIVADO">Privado (Apenas você)</option>
            </select>
          </div>
        </Card>
      </section>

      {/* 3. Privacidade e Portabilidade (LGPD) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ShieldCheck size={18} style={{ color: "#34D399" }} />
          <span>Privacidade e Portabilidade (LGPD)</span>
        </h2>

        <Card className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingLabel}>Exportação de Dados Pessoais</span>
              <span className={styles.settingDesc}>
                Baixe uma cópia estruturada em formato JSON contendo todo seu histórico de leituras, estante e dados de perfil.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportData}
              isLoading={isExporting}
            >
              <Download size={14} />
              <span>Exportar Dados (JSON)</span>
            </Button>
          </div>
        </Card>
      </section>

      {/* 3. Zona de Perigo / Exclusão de Conta */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle} style={{ color: "var(--accent-rose)" }}>
          <AlertTriangle size={18} />
          <span>Zona de Perigo</span>
        </h2>

        <Card className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.dangerTitle}>Exclusão Definitiva da Conta (LGPD)</div>
          <p className={styles.dangerDesc}>
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD), ao solicitar a exclusão de sua conta, todos os seus dados pessoais identificáveis serão imediatamente anonimizados e destruídos de forma irreversível. Suas leituras privadas, anotações e históricos serão expurgados.
          </p>
          <div style={{ alignSelf: "flex-start" }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 size={14} />
              <span>Excluir Minha Conta</span>
            </Button>
          </div>
        </Card>
      </section>

      {/* Modal: Alterar E-mail */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Alterar Endereço de E-mail"
      >
        <form onSubmit={handleUpdateEmail} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Novo E-mail"
            type="email"
            placeholder="novo.email@dominio.com"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            required
          />

          <Input
            label="Senha Atual (Confirmação de Segurança)"
            type="password"
            placeholder="Digite sua senha atual"
            value={senhaParaEmail}
            onChange={(e) => setSenhaParaEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSavingEmail}
            style={{ marginTop: "0.5rem" }}
          >
            Confirmar Novo E-mail
          </Button>
        </form>
      </Modal>

      {/* Modal: Alterar Senha */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Alterar Senha de Acesso"
      >
        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Senha Atual"
            type="password"
            placeholder="Digite sua senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            required
          />

          <Input
            label="Nova Senha (Mínimo 6 caracteres)"
            type="password"
            placeholder="Digite a nova senha segura"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            minLength={6}
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            placeholder="Repita a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSavingPassword}
            style={{ marginTop: "0.5rem" }}
          >
            Atualizar Senha
          </Button>
        </form>
      </Modal>

      {/* Modal: Exclusão de Conta LGPD */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir e Anonimizar Conta"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-md)" }}>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--accent-rose)", lineHeight: 1.5, fontWeight: 600 }}>
              Atenção: Esta ação é definitiva e não pode ser revertida. Todos os seus vínculos pessoais com o Shiori serão anonimizados e seus dados privados expurgados.
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "var(--text-xs)", color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={lgpdChecked}
              onChange={(e) => setLgpdChecked(e.target.checked)}
              style={{ marginTop: "2px" }}
            />
            <span>
              Compreendo que esta ação é permanente e irreversível e autorizo a anonimização e expurgo dos meus dados pessoais em conformidade com a LGPD.
            </span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={!lgpdChecked}
            >
              Confirmar Exclusão Definitiva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
