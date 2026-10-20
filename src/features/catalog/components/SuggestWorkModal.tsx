import React, { useState } from "react";
import styles from "../CatalogPage.module.css";
import { Modal } from "../../../components/ui/Modal/Modal";
import { Button } from "../../../components/ui/Button/Button";
import { Input } from "../../../components/ui/Input/Input";
import { Badge } from "../../../components/ui/Badge/Badge";
import { WorkService } from "../../../services/work.service";
import { CatalogService } from "../../../services/catalog.service";
import { isLocalMode } from "../../../services/api/httpClient";
import { toast } from "../../../store/toastStore";
import { useAuthStore } from "../../../store/authStore";
import {
  TODOS_FORMATOS,
  TIPO_OBRA_LABELS,
  type TipoObra,
  type IntegracaoMetadadosObra,
} from "../../../types/work.types";
import { Sparkles } from "lucide-react";

interface SuggestWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkCreated: () => void;
}

export const SuggestWorkModal: React.FC<SuggestWorkModalProps> = ({
  isOpen,
  onClose,
  onWorkCreated,
}) => {
  const { user } = useAuthStore();
  const [tituloPrincipal, setTituloPrincipal] = useState("");
  const [tituloOriginal, setTituloOriginal] = useState("");
  const [capaUrl, setCapaUrl] = useState("");
  const [tipoObra, setTipoObra] = useState<TipoObra>("MANGA");
  const [totalCapitulos, setTotalCapitulos] = useState<number>(0);
  const [sinopse, setSinopse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Provedores externos
  const [externalSearchTerm, setExternalSearchTerm] = useState("");
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<IntegracaoMetadadosObra[]>([]);

  if (!isOpen) return null;

  const handleSearchExternal = async () => {
    if (!externalSearchTerm.trim()) {
      toast.warning("Digite um termo para pesquisar nos provedores.");
      return;
    }
    try {
      setIsSearchingExternal(true);
      const results = await WorkService.searchExternalWorks(externalSearchTerm.trim());
      setExternalResults(results || []);
      if (!results || results.length === 0) {
        toast.info("Nenhuma obra encontrada nos provedores externos.");
      }
    } catch (err: any) {
      toast.error(err, "Falha na busca externa");
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const handleSelectExternalResult = (item: IntegracaoMetadadosObra) => {
    setTituloPrincipal(item.tituloPrincipal);
    if (item.tituloOriginal) setTituloOriginal(item.tituloOriginal);
    if (item.capaUrl) setCapaUrl(item.capaUrl);
    if (item.totalCapitulosLancados) setTotalCapitulos(item.totalCapitulosLancados);
    if (item.sinopse) setSinopse(item.sinopse);
    if (item.tipoObra && TODOS_FORMATOS.includes(item.tipoObra as TipoObra)) {
      setTipoObra(item.tipoObra as TipoObra);
    }
    setExternalResults([]);
    toast.success(`Metadados de "${item.tituloPrincipal}" importados com sucesso! Revise os campos e envie.`);
  };

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloPrincipal.trim()) {
      toast.warning("O título principal da obra é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isLocalMode()) {
        await CatalogService.addItemToShelf({
          titulo: tituloPrincipal.trim(),
          tipoObra,
          totalCapitulos: totalCapitulos > 0 ? totalCapitulos : undefined,
          capaUrl: capaUrl.trim() || undefined,
          statusLeitura: "LENDO",
          visibilidade: "PRIVADO",
        });

        toast.success(
          `"${tituloPrincipal.trim()}" adicionada à sua estante pessoal!`,
          "Obra Salva na Estante"
        );

        onClose();
        onWorkCreated();
        return;
      }

      const created = await WorkService.createWork({
        tituloPrincipal: tituloPrincipal.trim(),
        tituloOriginal: tituloOriginal.trim() || undefined,
        capaUrl: capaUrl.trim() || undefined,
        tipoObra,
        totalCapitulosLancados: totalCapitulos > 0 ? totalCapitulos : undefined,
        sinopse: sinopse.trim() || undefined,
      });

      if (user?.id) {
        await WorkService.submitToGlobalCatalog(created.id, user.id);
      }

      toast.success(
        "Obra cadastrada e enviada para curadoria comunitária do Shiori!",
        "Sugestão Enviada"
      );

      onClose();
      onWorkCreated();
    } catch (err: any) {
      toast.error(err, "Falha ao Sugerir Obra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sugerir Obra Manual ao Catálogo"
    >
      <form onSubmit={handleCreateWork} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Não encontrou sua obra no catálogo? Pesquise em nossos provedores parceiros para auto-preencher ou cadastre manualmente abaixo.
        </p>

        {/* Bloco de Busca em Provedores Externos */}
        <div className={styles.externalSearchSection}>
          <div className={styles.externalSearchHeader}>
            <span className={styles.externalSearchTitle}>
              Preenchimento Automático via Provedores (AniList, MangaDex, Kitsu, Open Library)
            </span>
            <Sparkles size={15} style={{ color: "var(--brand-light)" }} />
          </div>
          <div className={styles.externalSearchInputRow}>
            <Input
              placeholder="Pesquisar título nos provedores externos..."
              value={externalSearchTerm}
              onChange={(e) => setExternalSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchExternal();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSearchExternal}
              isLoading={isSearchingExternal}
            >
              Pesquisar
            </Button>
          </div>

          {externalResults.length > 0 && (
            <div className={styles.externalResultsList}>
              {externalResults.map((item, idx) => (
                <div key={`${item.idExterno}-${idx}`} className={styles.externalResultItem}>
                  <div className={styles.externalResultInfo}>
                    <span className={styles.externalResultTitle} title={item.tituloPrincipal}>
                      {item.tituloPrincipal}
                    </span>
                    <div className={styles.externalResultMeta}>
                      {item.provedorCodigo && <Badge variant="brand">{item.provedorCodigo}</Badge>}
                      <span>{TIPO_OBRA_LABELS[item.tipoObra as TipoObra] || item.tipoObra}</span>
                      {item.totalCapitulosLancados ? <span>• {item.totalCapitulosLancados} caps</span> : null}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectExternalResult(item)}
                  >
                    Usar Metadados
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Título Principal (Português ou Traduzido)"
          placeholder="Ex: Frieren e a Jornada para o Além"
          value={tituloPrincipal}
          onChange={(e) => setTituloPrincipal(e.target.value)}
          required
        />

        <Input
          label="Título Original (Opcional)"
          placeholder="Ex: 葬送のフリーレン"
          value={tituloOriginal}
          onChange={(e) => setTituloOriginal(e.target.value)}
        />

        <Input
          label="URL da Capa Oficial (Opcional)"
          placeholder="https://exemplo.com/capa.jpg"
          value={capaUrl}
          onChange={(e) => setCapaUrl(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
              Formato Literário
            </label>
            <select
              value={tipoObra}
              onChange={(e) => setTipoObra(e.target.value as TipoObra)}
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
              {TODOS_FORMATOS.map((f) => (
                <option key={f} value={f}>
                  {TIPO_OBRA_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Total de Capítulos Lançados"
            type="number"
            min={0}
            placeholder="0"
            value={totalCapitulos}
            onChange={(e) => setTotalCapitulos(parseInt(e.target.value) || 0)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", fontWeight: 600 }}>
            Sinopse / Descrição
          </label>
          <textarea
            value={sinopse}
            onChange={(e) => setSinopse(e.target.value)}
            rows={3}
            placeholder="Breve descrição da obra..."
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
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Enviar Sugestão
          </Button>
        </div>
      </form>
    </Modal>
  );
};
