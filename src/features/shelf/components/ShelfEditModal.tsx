import React, { useState } from "react";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import type { ItemCatalogoResponse, StatusLeitura, Visibilidade } from "../../../types/catalog.types";
import { CatalogService } from "../../../services/catalog.service";
import { toast } from "../../../store/toastStore";

interface ShelfEditModalProps {
  item: ItemCatalogoResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedItem: ItemCatalogoResponse) => void;
}

export const ShelfEditModal: React.FC<ShelfEditModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !item) return null;
  return (
    <ShelfEditModalContent
      key={item.id}
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
};

const ShelfEditModalContent: React.FC<ShelfEditModalProps & { item: ItemCatalogoResponse }> = ({
  item,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [capituloAtual, setCapituloAtual] = useState<number>(item.progressoAtual || 0);
  const [volumeAtual, setVolumeAtual] = useState<number>(item.volumeAtual || 0);
  const [statusLeitura, setStatusLeitura] = useState<StatusLeitura>(item.statusLeitura);
  const [visibilidade, setVisibilidade] = useState<Visibilidade>(item.visibilidade || "RESTRITO");
  const [nota, setNota] = useState<number>(item.avaliacaoPessoal || 0);
  const [anotacao, setAnotacao] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const atualizado = await CatalogService.updateProgress(item.id, {
        capituloAtual,
        volumeAtual: volumeAtual > 0 ? volumeAtual : undefined,
        statusLeitura,
        nota: nota > 0 ? nota : undefined,
        anotacao: anotacao.trim() || undefined,
      });

      if (visibilidade !== item.visibilidade) {
        await CatalogService.updateVisibility(item.id, { visibilidade });
        atualizado.visibilidade = visibilidade;
      }

      toast.success("Progresso e preferências atualizados com sucesso!");
      onSaved(atualizado);
      onClose();
    } catch (err: any) {
      toast.error(err, "Erro ao Salvar Progresso");
    } finally {
      setIsSaving(false);
    }
  };

  const tituloExibido = item.titulo || item.obraTitulo;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Progresso: ${tituloExibido}`}
    >
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Input
            label="Capítulo Atual"
            type="number"
            min={0}
            step={0.1}
            value={capituloAtual}
            onChange={(e) => setCapituloAtual(parseFloat(e.target.value) || 0)}
            required
          />
          <Input
            label="Volume Atual"
            type="number"
            min={0}
            step={1}
            value={volumeAtual}
            onChange={(e) => setVolumeAtual(parseInt(e.target.value) || 0)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
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
              <option value="LENDO">Lendo</option>
              <option value="PLANEJADO">Planejado</option>
              <option value="ENGAVETADO">Engavetado</option>
              <option value="TERMINOU">Terminou</option>
              <option value="ABDICOU">Abdicou</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
              Visibilidade
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
              <option value="RESTRITO">Restrito (Conexões)</option>
              <option value="PRIVADO">Privado (Apenas eu)</option>
              <option value="PUBLICO">Público (Perfil)</option>
            </select>
          </div>
        </div>

        <Input
          label="Nota Geral Pessoal (0 a 10)"
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={nota}
          onChange={(e) => setNota(parseFloat(e.target.value) || 0)}
          helperText="Sua avaliação íntima sobre esta obra"
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
            Anotação deste Progresso
          </label>
          <textarea
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            rows={2}
            placeholder="Anotações privadas do capítulo lido..."
            style={{
              padding: "0.65rem 0.95rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
