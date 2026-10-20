import React, { useState, useEffect } from "react";
import styles from "../SettingsPage.module.css";
import { Card } from "../../../components/ui/Card/Card";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { Badge } from "../../../components/ui/Badge/Badge";
import { HubService, type HubConfig } from "../../../services/hub.service";
import type { PareamentoResponse } from "../../../types/catalog.types";
import { toast } from "../../../store/toastStore";
import { Server, RefreshCw, Send, Copy } from "lucide-react";

import { useApiEndpointStore } from "../../../store/apiEndpointStore";

export const HubPairingSection: React.FC = () => {
  const [config, setConfig] = useState<HubConfig>(() => HubService.getHubConfig());
  const [primaryUrl, setPrimaryUrl] = useState(config.primaryUrl);
  const [fallbackUrlInput, setFallbackUrlInput] = useState(config.fallbackUrls.join(", "));
  const [apelidoPublico, setApelidoPublico] = useState("");
  const [pairingStatus, setPairingStatus] = useState<PareamentoResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await HubService.consultarStatus();
      setPairingStatus(res);
    } catch {
      // Se ainda não solicitou pareamento no Hub, pode retornar 404 (esperado)
      setPairingStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    HubService.consultarStatus()
      .then((res) => {
        if (isMounted) setPairingStatus(res);
      })
      .catch(() => {
        if (isMounted) setPairingStatus(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveNetworkConfig = () => {
    const fallbacks = fallbackUrlInput
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    HubService.saveHubConfig(primaryUrl, fallbacks);
    useApiEndpointStore.getState().saveEndpoint(primaryUrl);
    setConfig(HubService.getHubConfig());
    toast.success("Configuração de rede e fallback do Hub salva com sucesso!");
  };

  const handleRequestPairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apelidoPublico.trim()) {
      toast.warning("Informe um apelido público (pseudônimo) para a sua instância.");
      return;
    }

    try {
      setIsRequestingPairing(true);
      const res = await HubService.solicitarPareamento(apelidoPublico.trim());
      setPairingStatus(res);
      toast.success(
        "Handshake de pareamento enviado! Aguarde a aprovação do administrador do Hub.",
        "Pareamento Solicitado"
      );
    } catch (err: any) {
      toast.error(err, "Falha ao Solicitar Pareamento");
    } finally {
      setIsRequestingPairing(false);
    }
  };

  const handleCopyUuid = () => {
    navigator.clipboard.writeText(config.instanceUuid);
    toast.info("Instance UUID copiado para a área de transferência!");
  };

  const renderStatusBadge = () => {
    if (!pairingStatus) {
      return <Badge variant="neutral">Não Pareado / Modo Local</Badge>;
    }
    switch (pairingStatus.status) {
      case "AUTORIZADO":
        return <Badge variant="brand">Autorizado (Pareado)</Badge>;
      case "PENDENTE":
        return <Badge variant="neutral">Pendente de Moderação</Badge>;
      case "SUSPENSO":
        return <Badge variant="neutral">Temporariamente Suspenso</Badge>;
      case "BANIDO":
        return <Badge variant="neutral">Revogado / Banido</Badge>;
      default:
        return <Badge variant="neutral">{pairingStatus.status}</Badge>;
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <Server size={18} style={{ color: "var(--brand-primary)" }} />
        <span>Conexão e Pareamento com o Hub Shiori (Mesh)</span>
      </h2>

      <Card className={styles.card}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Configure o endereço do Hub <strong>shiori-api</strong> para obter autocomplete de metadados e submeter obras à enciclopédia global. Em caso de queda, o Shiori continuará operando normalmente em modo local offline-first.
          </p>

          {/* Identificador Pseudônimo da Instância */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>
                INSTANCE UUID (IDENTIFICADOR PSEUDÔNIMO)
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                {config.instanceUuid}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {renderStatusBadge()}
              <Button variant="ghost" size="sm" onClick={handleCopyUuid} title="Copiar UUID">
                <Copy size={13} />
              </Button>
            </div>
          </div>

          {/* Configuração de URLs do Hub */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Input
              label="URL Principal do Hub Shiori"
              placeholder="https://hub.shiori.dev"
              value={primaryUrl}
              onChange={(e) => setPrimaryUrl(e.target.value)}
            />
            <Input
              label="Hubs de Fallback (Separados por vírgula)"
              placeholder="https://hub-backup.shiori.dev, ..."
              value={fallbackUrlInput}
              onChange={(e) => setFallbackUrlInput(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="secondary" size="sm" onClick={handleSaveNetworkConfig}>
              Salvar Configuração de Rede
            </Button>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)", margin: "0.25rem 0" }} />

          {/* Formulário de Handshake de Pareamento */}
          <div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.4rem" }}>
              Solicitar Pareamento de Instância
            </div>
            <p style={{ margin: "0 0 0.85rem 0", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              Para submeter obras comunitárias anônimas ao Catálogo Global, envie um handshake de pareamento com um apelido público (ex: &quot;Leitor Alpha&quot;).
            </p>

            <form onSubmit={handleRequestPairing} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Apelido Público da Instância"
                  placeholder="Ex: Leitor das Sombras"
                  value={apelidoPublico}
                  onChange={(e) => setApelidoPublico(e.target.value)}
                  disabled={pairingStatus?.status === "AUTORIZADO"}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isRequestingPairing}
                disabled={pairingStatus?.status === "AUTORIZADO"}
              >
                <Send size={14} />
                <span>Solicitar Pareamento</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={fetchStatus}
                isLoading={isLoadingStatus}
                title="Verificar status atual no Hub"
              >
                <RefreshCw size={14} />
              </Button>
            </form>
          </div>
        </div>
      </Card>
    </section>
  );
};
