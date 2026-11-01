import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import { UserService } from "../../services/user.service";
import { SocialService } from "../../services/social.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Avatar } from "../../components/ui/Avatar/Avatar";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { getReadingStatusLabel } from "../../components/ui/ReadingStatusSelect";
import type { UsuarioPerfilPublicoResponse } from "../../types/user.types";
import type { ItemCatalogoResponse } from "../../types/catalog.types";
import {
  ArrowLeft,
  UserPlus,
  Users,
  BookOpen,
  Star,
  ShieldCheck,
  Lock,
  Globe,
} from "lucide-react";

export const ReaderProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<UsuarioPerfilPublicoResponse | null>(null);
  const [shelfItems, setShelfItems] = useState<ItemCatalogoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingConnection, setIsRequestingConnection] = useState(false);
  const [connectionRequested, setConnectionRequested] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!username) return;

    const loadReaderProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await UserService.getPublicProfile(username);
        if (!isMounted) return;
        setProfile(data);
        const items = Array.isArray(data.estante)
          ? data.estante
          : data.estante?.content || [];
        setShelfItems(items);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Leitor não encontrado no servidor Shiori.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReaderProfile();
    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleRequestConnection = async () => {
    if (!profile) return;
    if (!currentUser || currentUser.id <= 0) {
      toast.warning("Conecte sua conta a um servidor Shiori API para adicionar conexões.");
      return;
    }
    try {
      setIsRequestingConnection(true);
      await SocialService.requestConnection(profile.id);
      setConnectionRequested(true);
      toast.success(`Solicitação de conexão enviada para @${profile.apelido}!`);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível enviar solicitação de conexão.");
    } finally {
      setIsRequestingConnection(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ marginBottom: "1rem" }}>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Button>
        </div>
        <EmptyState
          icon={<Users size={36} />}
          title="Perfil de Leitor Indisponível"
          description={error || "Não foi possível localizar este leitor no servidor."}
          action={{
            label: "Voltar ao Início",
            onClick: () => navigate("/"),
            variant: "secondary",
          }}
        />
      </div>
    );
  }

  const isOwnProfile = Boolean(
    currentUser &&
      (currentUser.id === profile.id ||
        currentUser.apelido.toLowerCase() === profile.apelido.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div style={{ marginBottom: "0.5rem" }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </Button>
      </div>

      {/* Cabeçalho do Perfil Visitável */}
      <section className={styles.profileBanner}>
        <div className={styles.avatarContainer}>
          <Avatar name={profile.apelido} src={profile.fotoUrl} size="lg" />
        </div>

        <div className={styles.profileMainInfo}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <h1 className={styles.username}>@{profile.apelido}</h1>
            {profile.saoConexoes ? (
              <Badge variant="success">
                <Users size={12} style={{ marginRight: 4 }} />
                Conexão Aceita
              </Badge>
            ) : (
              <Badge variant="neutral">
                <Globe size={12} style={{ marginRight: 4 }} />
                Perfil Público
              </Badge>
            )}
            {profile.pontosConfianca > 0 && (
              <Badge variant="brand">
                <ShieldCheck size={12} style={{ marginRight: 4 }} />
                {profile.pontosConfianca} pts de curadoria
              </Badge>
            )}
          </div>

          <p className={styles.bio}>
            {profile.descricao || "Leitor da comunidade Shiori."}
          </p>

          <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>{shelfItems.length}</strong> obras visíveis
            </span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>
                {shelfItems.filter((i) => i.statusLeitura === "LENDO").length}
              </strong>{" "}
              lendo agora
            </span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>
                {shelfItems.filter((i) => i.statusLeitura === "TERMINOU").length}
              </strong>{" "}
              concluídas
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {isOwnProfile ? (
            <Button variant="secondary" size="sm" onClick={() => navigate("/perfil")}>
              <span>Gerenciar Meu Perfil</span>
            </Button>
          ) : !profile.saoConexoes ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestConnection}
              isLoading={isRequestingConnection}
              disabled={connectionRequested}
            >
              <UserPlus size={15} />
              <span>{connectionRequested ? "Solicitação Enviada" : "Conectar Leitor"}</span>
            </Button>
          ) : null}
        </div>
      </section>

      {/* Estante Visível do Leitor */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>
            Estante Compartilhada de @{profile.apelido}
          </h2>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            {profile.saoConexoes
              ? "Exibindo obras Públicas e Restritas a Conexões"
              : "Exibindo apenas obras marcadas como Públicas pelo leitor"}
          </span>
        </div>

        {shelfItems.length === 0 ? (
          <EmptyState
            icon={<Lock size={32} />}
            title="Nenhuma obra compartilhada visível"
            description={
              profile.saoConexoes
                ? "Este leitor ainda não possui obras públicas ou restritas a conexões em sua estante."
                : "Este leitor mantém sua estante privada ou restrita apenas às suas conexões."
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {shelfItems.map((item) => {
              const titulo = item.titulo || item.obraTitulo;
              const capa = item.capaUrl || item.obraCapaUrl;
              const total = item.totalCapitulos || item.obraTotalCapitulos || 0;

              return (
                <article
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "0.85rem",
                    padding: "0.85rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 80,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      background: "var(--bg-elevated)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {capa ? (
                      <img
                        src={capa}
                        alt={titulo}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : (
                      <BookOpen size={20} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {item.obraId ? (
                      <Link
                        to={`/catalogo/${item.obraId}`}
                        style={{
                          fontWeight: 700,
                          fontSize: "var(--text-sm)",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={titulo}
                      >
                        {titulo}
                      </Link>
                    ) : (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "var(--text-sm)",
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={titulo}
                      >
                        {titulo}
                      </span>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <Badge variant="neutral">{getReadingStatusLabel(item.statusLeitura)}</Badge>
                      {item.avaliacaoPessoal !== undefined && item.avaliacaoPessoal > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            fontSize: "0.72rem",
                            color: "var(--accent-amber)",
                            fontWeight: 600,
                          }}
                        >
                          <Star size={11} fill="currentColor" />
                          {item.avaliacaoPessoal}
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      Cap. {item.progressoAtual || 0}
                      {total > 0 ? ` / ${total}` : ""}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
