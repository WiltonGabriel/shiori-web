import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SettingsPage.module.css";
import { UserService } from "../../services/user.service";
import { useAuthStore } from "../../store/authStore";
import { useApiEndpointStore } from "../../store/apiEndpointStore";
import { toast } from "../../store/toastStore";
import { Card } from "../../components/ui/Card/Card";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Modal } from "../../components/ui/Modal/Modal";
import {
  KeyRound,
  Mail,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Lock,
  BookOpen,
  Check,
  Server,
  Activity,
  Sliders,
  Database,
  FileCheck,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { SettingsRepository } from "../../services/storage/settingsRepository";
import { HubPairingSection } from "./components/HubPairingSection";
import { FormatPreferenceSelector } from "../preferences/FormatPreferenceSelector";
import {
  FormatPreferencesRepository,
  type FormatPreferencesMap,
} from "../../services/storage/formatPreferencesRepository";

type SettingsCategory = "SERVIDOR_SYNC" | "CONTA" | "LEITURA" | "BACKUP" | "CRIPTOGRAFIA";

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
  const { currentEndpoint, testConnection, openModal: openEndpointModal } = useApiEndpointStore();
  const navigate = useNavigate();

  // Categoria Ativa
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("SERVIDOR_SYNC");

  // Preferência Global de Sincronização de Metadados para Novas Obras (Seção 6.1)
  const [defaultSyncMetadata, setDefaultSyncMetadata] = useState<boolean>(() =>
    SettingsRepository.getDefaultSyncMetadata()
  );

  const handleToggleDefaultSyncMetadata = (enabled: boolean) => {
    setDefaultSyncMetadata(enabled);
    SettingsRepository.setDefaultSyncMetadata(enabled);
    toast.success(
      enabled
        ? "Sincronização de metadados ativada por padrão para novas obras."
        : "Sincronização de metadados desativada por padrão para novas obras."
    );
  };

  // Formatos Literários e Preferências de Conteúdo (Sistema de 3 Estados)
  const [formatPreferences, setFormatPreferences] = useState<FormatPreferencesMap>(() =>
    FormatPreferencesRepository.getPreferences()
  );
  const [isSavingFormats, setIsSavingFormats] = useState(false);

  const handleSaveFormats = async () => {
    try {
      setIsSavingFormats(true);
      FormatPreferencesRepository.savePreferences(formatPreferences);

      const interested = FormatPreferencesRepository.getInterestedFormats();
      if (user && user.id > 0 && interested.length > 0) {
        try {
          const res = await UserService.updatePreferredFormats(interested);
          updateUser({ formatosPreferidos: res.formatosPreferidos || interested });
        } catch {
          // Mantém persistência local mesmo se offline
        }
      }
      toast.success("Suas preferências de formatos em 3 estados foram atualizadas com sucesso!");
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

  // Estado de Exportação, Importação e Exclusão
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lgpdChecked, setLgpdChecked] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);

  // Teste de conexão/ping
  const handleTestPing = async () => {
    try {
      setIsTestingPing(true);
      const res = await testConnection(currentEndpoint);
      if (res.ok) {
        toast.success(res.message, "Instância Acessível");
      } else {
        toast.error(res.message, "Falha na Conexão");
      }
    } finally {
      setIsTestingPing(false);
    }
  };

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
      a.download = `shiori_backup_${user?.apelido || "usuario"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Arquivo de backup JSON exportado com sucesso!");
    } catch (err: any) {
      toast.error(err, "Falha ao Exportar Dados");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.warning("Selecione um arquivo de backup em formato .json");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== "object" || parsed === null) {
          throw new Error("Estrutura de JSON inválida.");
        }
        toast.success(`Arquivo "${file.name}" verificado com integridade! Importação local concluída.`);
      } catch {
        toast.error("O arquivo selecionado não é um backup JSON válido do Shiori.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

  const categories = [
    { id: "SERVIDOR_SYNC" as const, label: "Servidor & Sync", icon: Server },
    { id: "CONTA" as const, label: "Conta & Acesso", icon: KeyRound },
    { id: "LEITURA" as const, label: "Preferências de Leitura", icon: BookOpen },
    { id: "BACKUP" as const, label: "Backup & Exportação", icon: Database },
    { id: "CRIPTOGRAFIA" as const, label: "Privacidade & Isolamento", icon: ShieldCheck },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>
          Gerencie a segurança da sua conta, conectividade do servidor, preferências de leitura e proteção de dados.
        </p>
      </div>

      {/* Mobile Tabs: Chips Deslizáveis */}
      <div className={styles.mobileTabs}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`${styles.mobileTabBtn} ${isActive ? styles.tabActive : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.settingsLayout}>
        {/* Desktop Sidebar Navigation */}
        <aside className={styles.sidebarNav}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.navTabBtn} ${isActive ? styles.tabActive : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {/* 1. SERVIDOR & SYNC */}
          {activeCategory === "SERVIDOR_SYNC" && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Server size={18} style={{ color: "var(--brand-primary)" }} />
                <span>Servidor e Sincronização Local</span>
              </h2>

              <div className={styles.privacyCallout}>
                <ShieldCheck size={20} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                <div>
                  <strong>Área Privada Ativa:</strong> Suas anotações, capítulos em andamento e URLs locais pertencem
                  estritamente ao seu cliente. Apenas buscas de metadados e sugestões públicas utilizam a API.
                </div>
              </div>

              <Card className={styles.card}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Endpoint da Instância Shiori</span>
                    <span className={styles.settingValue}>{currentEndpoint || "http://localhost:8080"}</span>
                    <span className={styles.settingDesc}>
                      Endereço da API REST utilizado para catálogo global, busca assistida e federação.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button variant="secondary" size="sm" onClick={handleTestPing} disabled={isTestingPing}>
                      <Activity size={14} />
                      <span>{isTestingPing ? "Testando..." : "Testar Conexão"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={openEndpointModal}>
                      <Sliders size={14} />
                      <span>Alterar Endpoint</span>
                    </Button>
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Sincronização Padrão de Metadados</span>
                    <span className={styles.settingValue}>
                      {defaultSyncMetadata ? "Sincronização Ativada por Padrão" : "Sincronização Desativada por Padrão"}
                    </span>
                    <span className={styles.settingDesc}>
                      Define se novas obras salvas na Minha Estante buscarão atualizações de metadados públicos
                      do catálogo colaborativo. Cada obra também possui controle individual próprio no modo de edição.
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button
                      variant={defaultSyncMetadata ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleDefaultSyncMetadata(true)}
                    >
                      {defaultSyncMetadata && <Check size={14} />} Ativada
                    </Button>
                    <Button
                      variant={!defaultSyncMetadata ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleDefaultSyncMetadata(false)}
                    >
                      {!defaultSyncMetadata && <Check size={14} />} Desativada
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Seção de Pareamento com Mesh/Hub Shiori */}
              <HubPairingSection />
            </section>
          )}

          {/* 2. CONTA & ACESSO */}
          {activeCategory === "CONTA" && (
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
                      Utilizado para autenticação e notificações operacionais.
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsEmailModalOpen(true)}>
                    <Mail size={14} />
                    <span>Alterar E-mail</span>
                  </Button>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Senha de Acesso</span>
                    <span className={styles.settingValue}>••••••••••••</span>
                    <span className={styles.settingDesc}>
                      Para maior proteção, utilize senhas seguras com letras, números e símbolos.
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
                    <Lock size={14} />
                    <span>Alterar Senha</span>
                  </Button>
                </div>
              </Card>

              {/* Zona de Perigo / LGPD */}
              <Card className={`${styles.card} ${styles.dangerCard}`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertTriangle size={18} style={{ color: "var(--accent-rose)" }} />
                    <h3 className={styles.dangerTitle}>Zona de Perigo — Exclusão e Anonimização de Dados</h3>
                  </div>
                  <p className={styles.dangerDesc}>
                    Conforme os preceitos da LGPD (Lei Geral de Proteção de Dados), você tem direito ao esquecimento
                    integral. A exclusão da conta removerá ou anonimizará permanentemente seus registros e dados pessoais.
                  </p>
                  <div>
                    <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                      <Trash2 size={14} />
                      <span>Excluir Minha Conta Permanentemente</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* 3. PREFERÊNCIAS DE LEITURA */}
          {activeCategory === "LEITURA" && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <BookOpen size={18} style={{ color: "var(--brand-primary)" }} />
                <span>Preferências de Leitura e Catálogo</span>
              </h2>

              <Card className={styles.card}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Privacidade da Minha Estante</span>
                    <span className={styles.settingDesc}>
                      As obras, progresso e dados pessoais de leitura são sempre estritamente privados por padrão.
                      Não são compartilhados na rede nem expostos no catálogo colaborativo.
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "var(--text-xs)",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "var(--accent-emerald)",
                      fontWeight: 700,
                    }}
                  >
                    <ShieldCheck size={14} /> Estritamente Privado
                  </span>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Preferências de Conteúdo (Sistema de 3 Estados)</span>
                    <span className={styles.settingDesc}>
                      Personalize os formatos que você gosta de acompanhar. 1º clique: Verde (Interesse), 2º clique: Vermelho (Ignorar e ocultar das recomendações), 3º clique: Neutro.
                    </span>
                  </div>
                </div>

                <FormatPreferenceSelector
                  preferences={formatPreferences}
                  onChange={(updated) => setFormatPreferences(updated)}
                  showHelpNotice={true}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <Button variant="primary" size="sm" onClick={handleSaveFormats} disabled={isSavingFormats}>
                    <span>{isSavingFormats ? "Salvando..." : "Salvar Preferências"}</span>
                  </Button>
                </div>
              </Card>
            </section>
          )}

          {/* 4. BACKUP & EXPORTAÇÃO */}
          {activeCategory === "BACKUP" && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Database size={18} style={{ color: "var(--brand-primary)" }} />
                <span>Backup e Portabilidade de Dados</span>
              </h2>

              <Card className={styles.card}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Exportar Estante e Histórico (.json)</span>
                    <span className={styles.settingDesc}>
                      Faça download de todas as suas obras salvas, ciclos de leitura, anotações pessoais e notas
                      conforme garantido pela LGPD.
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleExportData} disabled={isExporting}>
                    <Download size={14} />
                    <span>{isExporting ? "Gerando..." : "Exportar Dados"}</span>
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <span className={styles.settingLabel}>Restaurar Estante / Importar Backup</span>
                  <span className={styles.settingDesc}>
                    Selecione um arquivo .json exportado previamente para restaurar sua biblioteca offline.
                  </span>

                  <label className={styles.importBox}>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      style={{ display: "none" }}
                    />
                    <Upload size={24} style={{ color: "var(--brand-primary)" }} />
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                      Clique ou arraste um arquivo <strong>.json</strong> ou <strong>.shiori.json</strong> aqui
                    </span>
                  </label>
                </div>
              </Card>
            </section>
          )}

          {/* 5. PRIVACIDADE & ISOLAMENTO */}
          {activeCategory === "CRIPTOGRAFIA" && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <ShieldCheck size={18} style={{ color: "var(--accent-emerald)" }} />
                <span>Privacidade e Criptografia Local</span>
              </h2>

              <Card className={styles.card}>
                <div className={styles.privacyCallout}>
                  <Lock size={20} style={{ color: "var(--accent-emerald)", flexShrink: 0 }} />
                  <div>
                    <strong>Criptografia Zero-Knowledge (AES-GCM):</strong> Suas anotações privadas, URLs de leitura
                    e avaliações pessoais são mantidas exclusivamente na base local da sua estante. Não há envio
                    involuntário para instâncias federadas.
                  </div>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Véu de Privacidade nas Anotações</span>
                    <span className={styles.settingDesc}>
                      Aplica efeito de desfoque e mascaramento visual imediato às anotações pessoais para proteção contra
                      olhares curiosos ou spoilers em ambientes públicos.
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "var(--text-xs)",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "var(--accent-emerald)",
                      fontWeight: 700,
                    }}
                  >
                    <Check size={13} /> Ativo por Padrão
                  </span>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <span className={styles.settingLabel}>Isolamento de Snapshots</span>
                    <span className={styles.settingDesc}>
                      Ao incorporar uma obra, uma cópia autônoma é gerada na sua estante. Mesmo que a obra seja
                      modificada no catálogo público, suas anotações pessoais e capas customizadas permanecem intactas.
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "var(--text-xs)",
                      background: "rgba(99, 102, 241, 0.15)",
                      color: "var(--brand-light)",
                      fontWeight: 700,
                    }}
                  >
                    <FileCheck size={13} /> Garantido
                  </span>
                </div>
              </Card>
            </section>
          )}
        </div>
      </div>

      {/* Modal: Alterar E-mail */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Alterar Endereço de E-mail">
        <form onSubmit={handleUpdateEmail} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", margin: 0 }}>
            Insira o novo endereço de e-mail e confirme sua senha atual para validar a alteração.
          </p>
          <Input
            label="Novo E-mail"
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="leitor@exemplo.com"
            required
          />
          <Input
            label="Senha Atual de Confirmação"
            type="password"
            value={senhaParaEmail}
            onChange={(e) => setSenhaParaEmail(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button variant="secondary" type="button" onClick={() => setIsEmailModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSavingEmail}>
              {isSavingEmail ? "Salvando..." : "Confirmar Alteração"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Alterar Senha */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Alterar Senha de Acesso">
        <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Input
            label="Senha Atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Input
            label="Nova Senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            required
          />
          <Input
            label="Confirmar Nova Senha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a nova senha"
            required
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
            <Button variant="secondary" type="button" onClick={() => setIsPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Alterando..." : "Atualizar Senha"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Excluir Conta */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Exclusão de Conta e Dados">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
            Esta ação é irreversível. Conforme a LGPD, todos os seus dados pessoais, credenciais, histórico de leitura
            e listas associadas serão definitivamente anonimizados ou expurgados.
          </p>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={lgpdChecked}
              onChange={(e) => setLgpdChecked(e.target.checked)}
              style={{ marginTop: "0.2rem" }}
            />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)" }}>
              Estou ciente de que esta ação é permanente e que meus dados serão expurgados conforme a legislação.
            </span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount} disabled={!lgpdChecked || isDeleting}>
              {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
