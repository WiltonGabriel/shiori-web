import React, { useState } from "react";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import type { ObraResponse } from "../../../types/work.types";
import type {
  StatusLeitura,
  Visibilidade,
  AdicionarItemCatalogoRequest,
} from "../../../types/catalog.types";
import {
  Lock,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface IncorporationFormProps {
  work: ObraResponse;
  onClose: () => void;
  onConfirm: (payload: AdicionarItemCatalogoRequest) => Promise<void>;
  isSubmitting: boolean;
}

const IncorporationForm: React.FC<IncorporationFormProps> = ({
  work,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [titulo, setTitulo] = useState(work.tituloPrincipal || "");
  const [capaUrl, setCapaUrl] = useState(work.capaUrl || "");
  const [capituloAtual, setCapituloAtual] = useState<number>(0);
  const [volumeAtual, setVolumeAtual] = useState<number>(0);
  const [totalCapitulosEsperados, setTotalCapitulosEsperados] = useState<string>(
    work.totalCapitulosLancados ? String(work.totalCapitulosLancados) : ""
  );
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>("LENDO");
  const [visibilidade, setVisibilidade] = useState<Visibilidade>("RESTRITO");
  const [urlLeitura, setUrlLeitura] = useState("");
  const [sincronizarMetadados, setSincronizarMetadados] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalCaps = totalCapitulosEsperados.trim() !== "" && !isNaN(Number(totalCapitulosEsperados))
      ? Number(totalCapitulosEsperados)
      : undefined;

    const payload: AdicionarItemCatalogoRequest = {
      obraId: work.id,
      titulo: titulo.trim() || work.tituloPrincipal,
      capaUrl: capaUrl.trim() || work.capaUrl || undefined,
      tipoObra: work.tipoObra,
      totalCapitulos: totalCaps,
      totalVolumes: work.totalVolumes || undefined,
      capituloAtual: capituloAtual > 0 ? capituloAtual : undefined,
      volumeAtual: volumeAtual > 0 ? volumeAtual : undefined,
      statusLeitura,
      visibilidade,
      urlLeitura: urlLeitura.trim() || undefined,
      sincronizarMetadados,
    };

    await onConfirm(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Banner de Soberania do Leitor */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.85rem 1rem",
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <Sparkles size={18} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
          <strong style={{ color: "var(--text-primary)" }}>Soberania Absoluta da Estante:</strong>{" "}
          Uma cópia própria (Snapshot) será criada na sua estante. Você tem total controle sobre título, capa e progresso.
        </div>
      </div>

      {/* Pré-visualização da Capa e Título */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <div
          style={{
            width: 72,
            height: 104,
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "var(--bg-surface)",
            flexShrink: 0,
            border: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {capaUrl ? (
            <img
              src={capaUrl}
              alt="Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = work.capaUrl || "";
              }}
            />
          ) : (
            <BookOpen size={24} style={{ color: "var(--text-muted)" }} />
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Título na Minha Estante (Personalizável)
            </label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome da obra na sua estante"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              URL da Capa Personalizada (Opcional)
            </label>
            <Input
              value={capaUrl}
              onChange={(e) => setCapaUrl(e.target.value)}
              placeholder="Cole um link de capa alternativo ou mantenha o oficial"
            />
          </div>
        </div>
      </div>

      {/* Progresso Inicial */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Capítulo Lido
          </label>
          <Input
            type="number"
            min={0}
            step={0.1}
            value={capituloAtual}
            onChange={(e) => setCapituloAtual(parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Volume Lido
          </label>
          <Input
            type="number"
            min={0}
            step={1}
            value={volumeAtual}
            onChange={(e) => setVolumeAtual(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Meta Total (ou ?)
          </label>
          <Input
            value={totalCapitulosEsperados}
            onChange={(e) => setTotalCapitulosEsperados(e.target.value)}
            placeholder="Ex: 375 ou ?"
          />
        </div>
      </div>

      {/* Status de Leitura e Visibilidade */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Status de Leitura
          </label>
          <select
            value={statusLeitura}
            onChange={(e) => setStatusLeitura(e.target.value as StatusLeitura)}
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
            <option value="LENDO">Lendo (Em andamento)</option>
            <option value="PLANEJADO">Planejado (Quero ler)</option>
            <option value="ENGAVETADO">Engavetado (Pausado)</option>
            <option value="TERMINOU">Terminou (Concluído)</option>
            <option value="ABDICOU">Abdicou (Interrompido)</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Visibilidade da Obra
          </label>
          <select
            value={visibilidade}
            onChange={(e) => setVisibilidade(e.target.value as Visibilidade)}
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
            <option value="RESTRITO">Restrito (Apenas amigos/conexões)</option>
            <option value="PRIVADO">Privado (Apenas eu)</option>
            <option value="PUBLICO">Público (Visível a todos)</option>
          </select>
        </div>
      </div>

      {/* Link Privado de Leitura com Blindagem Criptográfica */}
      <div
        style={{
          padding: "0.85rem",
          background: "rgba(16, 185, 129, 0.05)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "var(--radius-md)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)" }}>
            <Lock size={13} style={{ color: "#10B981" }} />
            <span>Link Privado de Leitura (urlLeitura)</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#10B981", background: "rgba(16, 185, 129, 0.15)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
            AES-256-GCM
          </span>
        </div>
        <Input
          value={urlLeitura}
          onChange={(e) => setUrlLeitura(e.target.value)}
          placeholder="Cole seu link de leitura privado e seguro"
        />
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          Inviolável: Criptografado em repouso. Jamais exposto a administradores ou feed público.
        </span>
      </div>

      {/* Toggle de Sincronização Inteligente */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          cursor: "pointer",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}
      >
        <input
          type="checkbox"
          checked={sincronizarMetadados}
          onChange={(e) => setSincronizarMetadados(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: "var(--brand-primary)" }}
        />
        <span>Manter metadados e novos capítulos sincronizados com o Catálogo Global</span>
      </label>

      {/* Botões de Ação */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
        <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Incorporando..." : "Incorporar à Estante"}
        </Button>
      </div>
    </form>
  );
};

interface IncorporationModalProps {
  work: ObraResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: AdicionarItemCatalogoRequest) => Promise<void>;
  isSubmitting: boolean;
}

export const IncorporationModal: React.FC<IncorporationModalProps> = ({
  work,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  return (
    <Modal isOpen={isOpen && Boolean(work)} onClose={onClose} title="Incorporar Obra à Minha Estante">
      {work && (
        <IncorporationForm
          work={work}
          onClose={onClose}
          onConfirm={onConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </Modal>
  );
};
