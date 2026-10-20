import React, { useState } from "react";
import styles from "./SuggestEditModal.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import {
  GitPullRequest,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { ObraResponse, TipoObra } from "../../../types/work.types";
import { TODOS_FORMATOS, TIPO_OBRA_LABELS } from "../../../types/work.types";

interface SuggestEditModalProps {
  work: ObraResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestEditModal: React.FC<SuggestEditModalProps> = ({
  work,
  isOpen,
  onClose,
}) => {
  const [tituloPrincipal, setTituloPrincipal] = useState(work.tituloPrincipal || "");
  const [tituloOriginal, setTituloOriginal] = useState(work.tituloOriginal || "");
  const [tipoObra, setTipoObra] = useState<TipoObra>(work.tipoObra || "MANGA");
  const [totalCapitulos, setTotalCapitulos] = useState<number>(work.totalCapitulosLancados || 0);
  const [sinopse, setSinopse] = useState(work.sinopse || "");
  const [commitMessage, setCommitMessage] = useState("");
  const [fonteReferencia, setFonteReferencia] = useState("");

  if (!isOpen) return null;

  // A API ainda não expõe endpoint para leitores criarem sugestões de edição
  // (só existem rotas administrativas em /api/admin/sugestoes). Por isso o envio
  // permanece indisponível e nenhum sucesso é declarado.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propor Sugestão de Edição ao Catálogo Global"
    >
      <form onSubmit={handleSubmit} className={styles.modalContent}>
        {/* Banner de Isolamento da Área Privada */}
        <div className={styles.warningBanner} role="status">
          <Info size={20} style={{ color: "var(--accent-amber, #f59e0b)", flexShrink: 0 }} />
          <div>
            <strong>Envio indisponível nesta instância:</strong> a API ainda não oferece endpoint para leitores
            proporem alterações ao Catálogo Global. Nada será enviado ou salvo por este formulário.
          </div>
        </div>

        <div className={styles.warningBanner}>
          <ShieldCheck size={20} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
          <div>
            <strong>Revisão Pública Canônica:</strong> alterações ao Catálogo Global passam por moderação.
            Uma proposta <em>não afeta</em> sua <strong>Minha Estante</strong> pessoal e jamais expõe suas anotações privadas ou URLs locais.
          </div>
        </div>

        {/* Comparador de Diffs */}
        <div className={styles.diffContainer}>
          {/* Campo: Título Principal */}
          <div className={styles.diffCard}>
            <div className={styles.diffFieldHeader}>
              <span>Título Principal Canônico</span>
              {tituloPrincipal !== work.tituloPrincipal && (
                <span style={{ color: "var(--accent-emerald)" }}>Modificado</span>
              )}
            </div>
            <div className={styles.diffSideBySide}>
              <div className={styles.diffOriginal}>
                <span className={styles.diffTag}>[-] Atual</span>
                <span>{work.tituloPrincipal || "[Não informado]"}</span>
              </div>
              <div className={styles.diffProposed}>
                <span className={styles.diffTag}>[+] Proposto</span>
                <input
                  type="text"
                  value={tituloPrincipal}
                  onChange={(e) => setTituloPrincipal(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    outline: "none",
                    width: "100%",
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Campo: Título Original */}
          <div className={styles.diffCard}>
            <div className={styles.diffFieldHeader}>
              <span>Título Original (Kanji / Hanzi / Hangul / Nativo)</span>
              {tituloOriginal !== (work.tituloOriginal || "") && (
                <span style={{ color: "var(--accent-emerald)" }}>Modificado</span>
              )}
            </div>
            <div className={styles.diffSideBySide}>
              <div className={styles.diffOriginal}>
                <span className={styles.diffTag}>[-] Atual</span>
                <span>{work.tituloOriginal || "[Não informado]"}</span>
              </div>
              <div className={styles.diffProposed}>
                <span className={styles.diffTag}>[+] Proposto</span>
                <input
                  type="text"
                  value={tituloOriginal}
                  onChange={(e) => setTituloOriginal(e.target.value)}
                  placeholder="Ex: 葬送のフリーレン"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Campo: Formato Literário */}
          <div className={styles.diffCard}>
            <div className={styles.diffFieldHeader}>
              <span>Formato da Obra</span>
              {tipoObra !== work.tipoObra && (
                <span style={{ color: "var(--accent-emerald)" }}>Modificado</span>
              )}
            </div>
            <div className={styles.diffSideBySide}>
              <div className={styles.diffOriginal}>
                <span className={styles.diffTag}>[-] Atual</span>
                <span>{TIPO_OBRA_LABELS[work.tipoObra] || work.tipoObra}</span>
              </div>
              <div className={styles.diffProposed}>
                <span className={styles.diffTag}>[+] Proposto</span>
                <select
                  value={tipoObra}
                  onChange={(e) => setTipoObra(e.target.value as TipoObra)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    outline: "none",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  {TODOS_FORMATOS.map((f) => (
                    <option key={f} value={f} style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                      {TIPO_OBRA_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Campo: Total de Capítulos */}
          <div className={styles.diffCard}>
            <div className={styles.diffFieldHeader}>
              <span>Total de Capítulos Canônicos Lançados</span>
              {totalCapitulos !== (work.totalCapitulosLancados || 0) && (
                <span style={{ color: "var(--accent-emerald)" }}>Modificado</span>
              )}
            </div>
            <div className={styles.diffSideBySide}>
              <div className={styles.diffOriginal}>
                <span className={styles.diffTag}>[-] Atual</span>
                <span>{work.totalCapitulosLancados ? `${work.totalCapitulosLancados} caps` : "Não definido"}</span>
              </div>
              <div className={styles.diffProposed}>
                <span className={styles.diffTag}>[+] Proposto</span>
                <input
                  type="number"
                  min="0"
                  value={totalCapitulos}
                  onChange={(e) => setTotalCapitulos(Number(e.target.value))}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Campo: Sinopse */}
          <div className={styles.diffCard}>
            <div className={styles.diffFieldHeader}>
              <span>Sinopse Canônica</span>
              {sinopse !== (work.sinopse || "") && (
                <span style={{ color: "var(--accent-emerald)" }}>Modificado</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <textarea
                value={sinopse}
                onChange={(e) => setSinopse(e.target.value)}
                rows={3}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "var(--text-xs)",
                  resize: "vertical",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </div>

        {/* Metadados da Submissão (Commit Details) */}
        <div className={styles.commitSection}>
          <div className={styles.commitTitle}>
            <GitPullRequest size={15} style={{ color: "var(--brand-primary)" }} />
            <span>Dados da Proposta de Edição (Estilo Git Commit)</span>
          </div>

          <Input
            label="Mensagem de Commit / Justificativa *"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Ex: fix(metadata): corrigir contagem de capítulos canônicos e título original"
            required
          />

          <Input
            label="Fonte Oficial ou Link Canônico de Validação"
            value={fonteReferencia}
            onChange={(e) => setFonteReferencia(e.target.value)}
            placeholder="Ex: https://websunday.net/... ou https://shogakukan.co.jp/..."
          />
        </div>

        {/* Barra de Ações */}
        <div className={styles.actionsBar}>
          <Button variant="secondary" type="button" onClick={onClose}>
            Descartar
          </Button>
          <Button variant="primary" type="submit" disabled>
            <GitPullRequest size={15} />
            <span>Envio indisponível</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
