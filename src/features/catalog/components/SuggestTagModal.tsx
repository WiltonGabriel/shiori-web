import React, { useState, useEffect } from "react";
import styles from "./SuggestTagModal.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Input } from "../../../components/ui/Input/Input";
import { Button } from "../../../components/ui/Button/Button";
import { TagService } from "../../../services/tag.service";
import { toast } from "../../../store/toastStore";
import type { TagResponse } from "../../../types/tag.types";
import { Tag, Sparkles } from "lucide-react";

interface SuggestTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  obraId: number;
  obraTitulo?: string;
  onSuccess?: () => void;
}

export const SuggestTagModal: React.FC<SuggestTagModalProps> = ({
  isOpen,
  onClose,
  obraId,
  obraTitulo,
  onSuccess,
}) => {
  const [nomeTag, setNomeTag] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>();
  const [justificativa, setJustificativa] = useState("");
  const [autocompleteTags, setAutocompleteTags] = useState<TagResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNomeTag("");
      setSelectedTagId(undefined);
      setJustificativa("");
      setAutocompleteTags([]);
    }
  }, [isOpen]);

  // Autocomplete ao digitar nome da tag
  useEffect(() => {
    if (!nomeTag.trim() || selectedTagId) {
      setAutocompleteTags([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await TagService.searchTags(nomeTag.trim(), 8);
        setAutocompleteTags(results);
      } catch {
        // silencioso
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [nomeTag, selectedTagId]);

  const handleSelectAutocomplete = (tag: TagResponse) => {
    setNomeTag(tag.nome);
    setSelectedTagId(tag.id);
    setAutocompleteTags([]);
  };

  const handleInputChange = (val: string) => {
    setNomeTag(val);
    setSelectedTagId(undefined); // limpa tag selecionada se o usuário continuar editando
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTag.trim()) {
      toast.warning("Informe o nome da tag desejada.");
      return;
    }

    try {
      setIsSubmitting(true);
      await TagService.suggestTag(obraId, {
        nomeTag: selectedTagId ? undefined : nomeTag.trim(),
        tagId: selectedTagId,
        justificativa: justificativa.trim() || undefined,
      });

      toast.success(
        "Sua sugestão de tag foi enviada para avaliação dos curadores da comunidade!",
        "Sugestão Registrada"
      );
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Não foi possível enviar a sugestão.";
      toast.error(msg, "Falha na Sugestão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sugerir Tag Comunitária"
    >
      <form onSubmit={handleSubmit} className={styles.modalContent}>
        <p className={styles.description}>
          Ajude a comunidade sugerindo tags temáticas ou tropos presentes em{" "}
          <strong>{obraTitulo || "esta obra"}</strong>. Sugestões aprovadas por curadores tornam-se oficiais.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="tag-name-input" className={styles.label}>Nome da Tag</label>
          <Input
            id="tag-name-input"
            placeholder="Ex: Protagonista Feminina Forte, Reencarnação..."
            value={nomeTag}
            onChange={(e) => handleInputChange(e.target.value)}
            maxLength={60}
            leadingIcon={<Tag size={16} />}
            autoFocus
            required
          />
          <span className={styles.helper}>
            Você pode sugerir um novo termo ou selecionar uma tag já existente no vocabulário.
          </span>

          {autocompleteTags.length > 0 && (
            <div className={styles.autocompleteDropdown} role="listbox">
              {autocompleteTags.map((t) => (
                <div
                  key={t.id}
                  className={styles.autocompleteItem}
                  onClick={() => handleSelectAutocomplete(t)}
                  role="option"
                  aria-selected={selectedTagId === t.id}
                >
                  <span>{t.nome}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tag Existente</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tag-justificativa" className={styles.label}>Justificativa (Opcional)</label>
          <textarea
            id="tag-justificativa"
            className={styles.textarea}
            placeholder="Explique brevemente por que essa tag descreve adequadamente a obra..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            maxLength={255}
          />
          <span className={styles.charCount}>{justificativa.length} / 255</span>
        </div>

        <div className={styles.actionsRow}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !nomeTag.trim()}>
            <Sparkles size={16} />
            <span>{isSubmitting ? "Enviando..." : "Enviar Sugestão"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
