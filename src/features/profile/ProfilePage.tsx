import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import { UserService } from "../../services/user.service";
import { CatalogService } from "../../services/catalog.service";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../../store/toastStore";
import { Card } from "../../components/ui/Card/Card";
import { Avatar } from "../../components/ui/Avatar/Avatar";
import { Badge } from "../../components/ui/Badge/Badge";
import { Button } from "../../components/ui/Button/Button";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import type { UsuarioPerfilResponse } from "../../types/user.types";
import type { ItemCatalogoResponse } from "../../types/catalog.types";
import {
  Camera,
  Calendar,
  Shield,
  Settings,
  ArrowRight,
  Bookmark,
  Compass,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export const ProfilePage: React.FC = () => {
  useDocumentTitle(
    "Meu Perfil | Shiori",
    "Perfil do leitor no Shiori. Veja suas estatísticas de leitura, obras concluídas e estante pessoal."
  );

  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [perfil, setPerfil] = useState<UsuarioPerfilResponse | null>(null);
  const [shelfItems, setShelfItems] = useState<ItemCatalogoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const [meRes, shelfRes] = await Promise.allSettled([
          UserService.getMe(),
          CatalogService.getMyShelf(0, 8),
        ]);

        if (isMounted) {
          if (meRes.status === "fulfilled") {
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
  }, [updateUser]);

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

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "5rem" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const apelidoExibicao = perfil?.apelido || user?.apelido || "Leitor";
  const emailExibicao = perfil?.email || user?.email || "";
  const isAdmin = perfil?.role === "ROLE_ADMIN" || user?.role === "ROLE_ADMIN";

  return (
    <div className={styles.container}>
      {/* Card Principal de Identificação */}
      <Card className={styles.headerCard}>
        <div className={styles.avatarSection}>
          <div
            className={styles.avatarWrapper}
            onClick={() => fileInputRef.current?.click()}
            title="Alterar avatar do perfil"
          >
            <Avatar
              name={apelidoExibicao}
              src={perfil?.fotoUrl}
              size="lg"
            />
            <div className={styles.avatarUploadOverlay}>
              <Camera size={20} />
            </div>
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
            {perfil?.descricao || "Nenhuma biografia definida ainda. Escreva sobre seus gostos literários!"}
          </p>

          <div className={styles.metaRow}>
            <span className={styles.metaItem}>
              <Shield size={14} />
              {emailExibicao}
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
            <Link to="/admin">
              <Button variant="danger" size="sm">
                <Shield size={15} />
                <span>Painel Admin</span>
              </Button>
            </Link>
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

      {/* Amostra da Estante Pessoal */}
      <section className={styles.shelfSection}>
        <div className={styles.sectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bookmark size={20} style={{ color: "var(--brand-primary)" }} />
            <h2 className={styles.sectionTitle}>Estante do Usuário</h2>
          </div>
          <Link to="/meu-catalogo" style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--brand-light)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            <span>Ver estante completa</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {shelfItems.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={32} />}
            title="Sua estante ainda está vazia"
            description="Explore o catálogo global para adicionar mangás, manhwas ou livros à sua estante pessoal e acompanhar seu progresso."
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
              <Card key={item.id} interactive style={{ padding: "0.75rem", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "2/3", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-elevated)", marginBottom: "0.75rem" }}>
                  {item.obraCapaUrl ? (
                    <img src={item.obraCapaUrl} alt={item.obraTitulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                      Sem capa
                    </div>
                  )}
                </div>
                <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, margin: "0 0 0.25rem 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.obraTitulo}
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
