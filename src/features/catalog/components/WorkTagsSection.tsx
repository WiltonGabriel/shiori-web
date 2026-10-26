import React, { useState, useEffect, useCallback } from "react";
import styles from "./WorkTagsSection.module.css";
import { TagService } from "../../../services/tag.service";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "../../../store/toastStore";
import { SuggestTagModal } from "./SuggestTagModal";
import type { TagObraResponse, TipoVoto } from "../../../types/tag.types";
import { Tag, ThumbsUp, ThumbsDown, Plus } from "lucide-react";

interface WorkTagsSectionProps {
  obraId: number;
  obraTitulo?: string;
  isReadOnly?: boolean;
}

export const WorkTagsSection: React.FC<WorkTagsSectionProps> = ({
  obraId,
  obraTitulo,
  isReadOnly = false,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [tags, setTags] = useState<TagObraResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [votingTagId, setVotingTagId] = useState<number | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await TagService.getTagsByWork(obraId);
      setTags(data);
    } catch {
      // Falha não impeditiva no carregamento de tags
    } finally {
      setIsLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleVote = async (tag: TagObraResponse, tipoVoto: TipoVoto) => {
    if (!isAuthenticated) {
      toast.warning("Entre na sua conta para avaliar a relevância desta tag.", "Autenticação Necessária");
      return;
    }

    if (votingTagId !== null) return;

    try {
      setVotingTagId(tag.tagId);
      const result = await TagService.voteTag(obraId, tag.tagId, tipoVoto);

      // Atualiza localmente com os novos dados retornados pela API
      setTags((prev) =>
        prev
          .map((t) =>
            t.tagId === tag.tagId
              ? { ...t, score: result.scoreAtual, meuVoto: result.meuVoto }
              : t
          )
          .filter((t) => t.score >= 0) // Oculta caso tenha negativado
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Não foi possível registrar seu voto.";
      toast.error(msg, "Erro na Votação");
    } finally {
      setVotingTagId(null);
    }
  };

  const handleOpenSuggest = () => {
    if (!isAuthenticated) {
      toast.warning("Entre na sua conta para sugerir tags para a obra.", "Autenticação Necessária");
      return;
    }
    setIsSuggestModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <Tag size={16} color="var(--primary)" />
          <h4 className={styles.title}>Tags Comunitárias</h4>
          <span className={styles.helperText}>
            (Temas e tropos votados pela comunidade)
          </span>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            className={styles.suggestBtn}
            onClick={handleOpenSuggest}
            title="Sugerir uma nova tag temática para esta obra"
          >
            <Plus size={14} />
            <span>Sugerir Tag</span>
          </button>
        )}
      </div>

      <div className={styles.tagsGrid}>
        {isLoading && tags.length === 0 ? (
          <span className={styles.emptyState}>Carregando tags da comunidade...</span>
        ) : tags.length === 0 ? (
          <span className={styles.emptyState}>
            Nenhuma tag comunitária oficial aprovada ainda. Seja o primeiro a sugerir!
          </span>
        ) : (
          tags.map((tag) => {
            const isUpvoted = tag.meuVoto === "UPVOTE";
            const isDownvoted = tag.meuVoto === "DOWNVOTE";
            const isVotingThis = votingTagId === tag.tagId;

            return (
              <div key={tag.tagId} className={styles.tagCard}>
                <span className={styles.tagName}>{tag.nome}</span>
                <span
                  className={`${styles.scoreBadge} ${tag.score > 0 ? styles.scorePositive : ""}`}
                  title={`Score comunitário: ${tag.score}`}
                >
                  {tag.score > 0 ? `+${tag.score}` : tag.score}
                </span>

                {!isReadOnly && (
                  <div className={styles.voteButtons}>
                    <button
                      type="button"
                      className={`${styles.voteBtn} ${isUpvoted ? styles.voteBtnUpActive : ""}`}
                      onClick={() => handleVote(tag, "UPVOTE")}
                      disabled={isVotingThis}
                      title="Votar a favor da relevância desta tag"
                      aria-label={`Votar a favor de ${tag.nome}`}
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.voteBtn} ${isDownvoted ? styles.voteBtnDownActive : ""}`}
                      onClick={() => handleVote(tag, "DOWNVOTE")}
                      disabled={isVotingThis}
                      title="Votar contra a relevância desta tag"
                      aria-label={`Votar contra ${tag.nome}`}
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <SuggestTagModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        obraId={obraId}
        obraTitulo={obraTitulo}
        onSuccess={fetchTags}
      />
    </div>
  );
};
