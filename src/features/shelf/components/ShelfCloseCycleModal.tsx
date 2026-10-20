import React, { useState } from "react";
import styles from "../ShelfPage.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import type { ItemCatalogoResponse } from "../../../types/catalog.types";
import { CatalogService } from "../../../services/catalog.service";
import { toast } from "../../../store/toastStore";
import { CheckCircle, BookOpen } from "lucide-react";

interface ShelfCloseCycleModalProps {
  item: ItemCatalogoResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onCycleClosed: (updatedItem: ItemCatalogoResponse) => void;
}

export const ShelfCloseCycleModal: React.FC<ShelfCloseCycleModalProps> = ({
  item,
  isOpen,
  onClose,
  onCycleClosed,
}) => {
  if (!isOpen || !item) return null;
  return (
    <ShelfCloseCycleModalContent
      key={item.id}
      item={item}
      isOpen={isOpen}
      onClose={onClose}
      onCycleClosed={onCycleClosed}
    />
  );
};

const ShelfCloseCycleModalContent: React.FC<ShelfCloseCycleModalProps & { item: ItemCatalogoResponse }> = ({
  item,
  isOpen,
  onClose,
  onCycleClosed,
}) => {
  const [cycleRating, setCycleRating] = useState<number>(item.avaliacaoPessoal || 10);
  const [cycleNote, setCycleNote] = useState<string>("");
  const [cycleDate, setCycleDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [isClosingCycle, setIsClosingCycle] = useState(false);

  const handleConfirmCloseCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsClosingCycle(true);
      const totalCaps = item.totalCapitulos !== undefined ? item.totalCapitulos : item.obraTotalCapitulos;
      const totalVols = item.totalVolumes !== undefined ? item.totalVolumes : item.obraTotalVolumes;
      const finalCap = totalCaps || item.progressoAtual || 1;
      const finalVol = totalVols || item.volumeAtual;

      const atualizado = await CatalogService.updateProgress(item.id, {
        capituloAtual: finalCap,
        volumeAtual: finalVol,
        statusLeitura: "TERMINOU",
        nota: cycleRating,
        anotacao: cycleNote.trim() || `Ciclo concluído em ${cycleDate}`,
      });

      toast.success(
        `Ciclo de leitura finalizado com nota ${cycleRating} para ${item.titulo || item.obraTitulo}!`,
        "Ciclo Concluído"
      );
      onCycleClosed(atualizado);
      onClose();
    } catch (err: any) {
      toast.error(err, "Erro ao Concluir Ciclo");
    } finally {
      setIsClosingCycle(false);
    }
  };

  const tituloExibido = item.titulo || item.obraTitulo;
  const capaExibida = item.capaUrl || item.obraCapaUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Concluir Ciclo de Leitura"
    >
      <form onSubmit={handleConfirmCloseCycle} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className={styles.cycleModalHeader}>
          {capaExibida ? (
            <img
              src={capaExibida}
              alt={tituloExibido}
              className={styles.cycleCoverMini}
            />
          ) : (
            <BookOpen size={24} style={{ color: "var(--text-muted)" }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
              {tituloExibido}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              Progresso atingido: Cap. {item.progressoAtual || 0}
            </div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Ao registrar este ciclo, o status da obra será definido como <strong>TERMINOU</strong> e este marco ficará arquivado permanentemente no seu histórico íntimo.
        </p>

        <Input
          label="Avaliação Final do Ciclo (0 a 10)"
          type="number"
          min={0}
          max={10}
          step={0.1}
          value={cycleRating}
          onChange={(e) => setCycleRating(parseFloat(e.target.value) || 0)}
          required
        />

        <Input
          label="Data da Conclusão"
          type="date"
          value={cycleDate}
          onChange={(e) => setCycleDate(e.target.value)}
          required
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
            Reflexão e Anotações Pessoais
          </label>
          <textarea
            value={cycleNote}
            onChange={(e) => setCycleNote(e.target.value)}
            rows={3}
            placeholder="Qual foi o impacto dessa leitura? Guarde aqui sua resenha confidencial..."
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
          <Button variant="ghost" type="button" onClick={onClose} disabled={isClosingCycle}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isClosingCycle}>
            <CheckCircle size={15} />
            <span>{isClosingCycle ? "Registrando..." : "Confirmar Conclusão"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
