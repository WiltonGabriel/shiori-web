import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import { UserService } from "../../services/user.service";
import { CatalogService } from "../../services/catalog.service";
import { SocialService } from "../../services/social.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Card } from "../../components/ui/Card/Card";
import { Avatar } from "../../components/ui/Avatar/Avatar";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import type { UsuarioPerfilResponse } from "../../types/user.types";
import type { ItemCatalogoResponse } from "../../types/catalog.types";
import type { ConexaoResponse } from "../../types/social.types";
import {
  Camera,
  Calendar,
  Shield,
  Settings,
  ArrowRight,
  Bookmark,
  Compass,
  Users,
  Search,
  Check,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getApiBaseUrl } from "../../services/api/httpClient";

export const ProfilePage: React.FC = () => {
  useDocumentTitle(
    "Meu Perfil | Shiori",
    "Perfil do leitor no Shiori. Veja suas estatísticas de leitura, conexões e estante pessoal."
  );

  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [perfil, setPerfil] = useState<UsuarioPerfilResponse | null>(null);
  const [shelfItems, setShelfItems] = useState<ItemCatalogoResponse[]>([]);
  const [connections, setConnections] = useState<ConexaoResponse[]>([]);
  const [readerSearch, setReaderSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const isServerConnectedAccount = Boolean(
    user && user.id > 0 && user.token && user.token !== "shiori-local-session"
  );

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const shelfPromise = CatalogService.getMyShelf(0, 100);
        const mePromise = isServerConnectedAccount ? UserService.getMe() : Promise.resolve(null);
        const connPromise = isServerConnectedAccount ? SocialService.listConnections() : Promise.resolve([]);

        const [meRes, shelfRes, connRes] = await Promise.allSettled([
          mePromise,
          shelfPromise,
          connPromise,
        ]);

        if (isMounted) {
          if (meRes.status === "fulfilled" && meRes.value) {
            setPerfil(meRes.value);
            updateUser({
              apelido: meRes.value.apelido,
              role: meRes.value.role as any,
              onboardingConcluido: meRes.value.onboardingConcluido,
            });
          }
          if (shelfRes.status === "fulfilled") {
            setShelfItems(shelfRes.value || []);
          }
          if (connRes.status === "fulfilled") {
            setConnections(connRes.value || []);
          }
        }
      } catch (err: any) {
        toast.error(err, "Falha ao Carregar Perfil");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [isServerConnectedAccount, updateUser]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.warning("Selecione uma imagem válida (JPEG, PNG ou WebP).");
      return;
    }

    try {
      setIsUploading(true);
      const atualizado = await UserService.uploadAvatar(file);
      setPerfil(atualizado);
      toast.success("Foto de perfil atualizada com sucesso!");
    } catch (err: any) {
      toast.error(err, "Falha ao Atualizar Avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAcceptConnection = async (conexaoId: number) => {
    try {
      const updated = await SocialService.acceptConnection(conexaoId);
      setConnections((prev) => prev.map((c) => (c.id === conexaoId ? updated : c)));
      toast.success("Conexão aceita com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao aceitar conexão.");
    }
  };

  const handleVisitReader = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = readerSearch.trim().replace(/^@/, "");
    if (!clean) return;
    navigate(`/leitor/${encodeURIComponent(clean)}`);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const apelidoExibicao = perfil?.apelido || user?.apelido || "Leitor";
  const emailRaw = perfil?.email || user?.email || "";
  const hasRealEmail = Boolean(
    emailRaw && !emailRaw.endsWith("@conta.shiori.local") && !emailRaw.endsWith("@shiori.app")
  );
  const isAdmin =
    perfil?.role === "ROLE_ADMIN" ||
    user?.role === "ROLE_ADMIN" ||
    perfil?.role === "ROLE_CURADOR" ||
    user?.role === "ROLE_CURADOR";

  return (
    <div className={styles.container}>
      {/* Card Principal de Identificação */}
      <Card className={styles.headerCard}>
        <div className={styles.avatarSection}>
          <div
            className={styles.avatarWrapper}
            onClick={() => isServerConnectedAccount && fileInputRef.current?.click()}
            title={isServerConnectedAccount ? "Alterar avatar do perfil" : "Avatar do perfil"}
          >
            <Avatar
              name={apelidoExibicao}
              src={perfil?.fotoUrl || user?.avatarUrl}
              size="lg"
            />
            {isServerConnectedAccount && (
              <div className={styles.avatarUploadOverlay}>
                <Camera size={20} />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={styles.fileInput}
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
          {isUploading && <span style={{ fontSize: "0.7rem", color: "var(--brand-light)" }}>Enviando avatar...</span>}
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.nameRow}>
            <h1 className={styles.displayName}>@{apelidoExibicao}</h1>
            <Badge variant={isAdmin ? "danger" : "brand"}>
              {isAdmin ? "Administrador" : "Leitor"}
            </Badge>
          </div>

          <p className={styles.bio}>
            {perfil?.descricao || user?.bio || "Nenhuma biografia definida ainda. Escreva sobre seus gostos literários em Configurações!"}
          </p>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Shield size={14} />
              {hasRealEmail
                ? emailRaw
                : isServerConnectedAccount
                ? "Conta sincronizada com a Shiori API"
                : "Conta operando localmente no navegador"}
            </span>
            {perfil?.dataCriacao && (
              <span className={styles.metaItem}>
                <Calendar size={14} />
                Membro desde {new Date(perfil.dataCriacao).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>

        <div style={{ alignSelf: "flex-start", marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {isAdmin && (
            <a
              href={`${getApiBaseUrl().replace(/\/+$/, "")}/admin/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Button variant="danger" size="sm">
                <Shield size={15} />
                <span>Painel Admin</span>
              </Button>
            </a>
          )}
          <Link to="/configuracoes">
            <Button variant="secondary" size="sm">
              <Settings size={15} />
              <span>Configurações</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Grid de Estatísticas do Leitor */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{shelfItems.length}</span>
          <span className={styles.statLabel}>Obras na Estante</span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statValue}>
            {shelfItems.reduce((acc, curr) => acc + (curr.progressoAtual || 0), 0)}
          </span>
          <span className={styles.statLabel}>Capítulos Lidos</span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statValue}>
            {shelfItems.filter((i) => i.statusLeitura === "TERMINOU").length}
          </span>
          <span className={styles.statLabel}>Obras Concluídas</span>
        </Card>

        <Card className={styles.statCard}>
          <span className={styles.statValue}>{perfil?.pontosConfianca || 0}</span>
          <span className={styles.statLabel}>Pontos de Confiança</span>
        </Card>
      </div>

      {/* Camada Social: Visitar Perfil de Leitor & Conexões */}
      {isServerConnectedAccount && (
        <Card style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={19} style={{ color: "var(--brand-primary)" }} />
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                Conexões e Leitores da Comunidade
              </h2>
              <Badge variant="neutral">{connections.length}</Badge>
            </div>

            <form onSubmit={handleVisitReader} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Input
                placeholder="Visitar @apelido..."
                value={readerSearch}
                onChange={(e) => setReaderSearch(e.target.value)}
                leadingIcon={<Search size={14} />}
              />
              <Button type="submit" variant="secondary" size="sm">
                <span>Visitar Estante</span>
              </Button>
            </form>
          </div>

          {connections.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
              {connections.map((conn) => {
                const isReceiver = conn.receptorId === user?.id;
                const peerApelido = isReceiver ? conn.solicitanteApelido : conn.receptorApelido;
                const peerFoto = isReceiver ? conn.solicitanteFotoUrl : conn.receptorFotoUrl;
                return (
                  <div
                    key={conn.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      gap: "0.5rem",
                    }}
                  >
                    <Link
                      to={`/leitor/${peerApelido}`}
                      style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none", color: "inherit" }}
                    >
                      <Avatar name={peerApelido} src={peerFoto} size="sm" />
                      <div>
                        <strong style={{ fontSize: "var(--text-xs)", color: "var(--text-primary)", display: "block" }}>
                          @{peerApelido}
                        </strong>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {conn.status === "ACEITA" ? "Conexão ativa" : "Solicitação pendente"}
                        </span>
                      </div>
                    </Link>

                    {conn.status === "PENDENTE" && isReceiver ? (
                      <Button variant="primary" size="sm" onClick={() => handleAcceptConnection(conn.id)}>
                        <Check size={13} />
                        <span>Aceitar</span>
                      </Button>
                    ) : (
                      <Link to={`/leitor/${peerApelido}`} style={{ fontSize: "0.72rem", color: "var(--brand-primary)", fontWeight: 600, textDecoration: "none" }}>
                        Ver estante
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Amostra da Estante Pessoal */}
      <section className={styles.shelfSection}>
        <div className={styles.sectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bookmark size={20} style={{ color: "var(--brand-primary)" }} />
            <h2 className={styles.sectionTitle}>Minha Estante</h2>
          </div>
          <Link to="/minha-estante" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--brand-light)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            <span>Ver estante completa</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {shelfItems.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={32} />}
            title="Sua estante ainda está vazia"
            description="Explore o catálogo global ou adicione mangás, manhwas e livros à sua estante pessoal para acompanhar seu progresso."
            action={{
              label: "Explorar Catálogo",
              href: "/catalogo",
              icon: <Compass size={16} />,
              variant: "primary",
            }}
          />
        ) : (
          <div className={styles.shelfGrid}>
            {shelfItems.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                to={`/minha-estante/${item.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
              >
                <Card interactive style={{ padding: "0.75rem", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ aspectRatio: "2/3", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-elevated)", marginBottom: "0.75rem" }}>
                    {item.obraCapaUrl || item.capaUrl ? (
                      <img src={item.obraCapaUrl || item.capaUrl} alt={item.obraTitulo || item.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                        Sem capa
                      </div>
                    )}
                  </div>
                  <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 0.25rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.obraTitulo || item.titulo}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <Badge variant={item.statusLeitura === "TERMINOU" ? "success" : "brand"}>
                      {item.statusLeitura}
                    </Badge>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Cap. {item.progressoAtual || 0}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
