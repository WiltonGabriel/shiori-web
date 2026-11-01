import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  CheckSquare,
  Square,
  Check,
  Layers,
  FileText,
  BookOpen,
} from "lucide-react";
import { CatalogService } from "../../../services/catalog.service";
import type {
  ItemCatalogoResponse,
  EstanteItemExportDTO,
} from "../../../types/catalog.types";
import { TIPO_OBRA_LABELS, type TipoObra } from "../../../types/work.types";
import { toast } from "../../../store/toastStore";
import { Modal } from "../../../components/ui/Modal/Modal";
import styles from "./ShelfPortabilityModal.module.css";

interface ShelfPortabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "EXPORT" | "IMPORT";
  shelfItems: ItemCatalogoResponse[];
  onImported: () => void;
}

export const ShelfPortabilityModal: React.FC<ShelfPortabilityModalProps> = ({
  isOpen,
  onClose,
  initialTab = "EXPORT",
  shelfItems,
  onImported,
}) => {
  const [activeTab, setActiveTab] = useState<"EXPORT" | "IMPORT">(initialTab);
  const [exportScope, setExportScope] = useState<"ALL" | "SELECTED" | "SINGLE">("ALL");
  const [exportFormat, setExportFormat] = useState<"UNIFIED" | "SEPARATE_FILES">("UNIFIED");
  const [selectedExportIds, setSelectedExportIds] = useState<number[]>([]);
  const [singleExportId, setSingleExportId] = useState<number>(shelfItems[0]?.id || 0);

  // Import state
  const [parsedImportItems, setParsedImportItems] = useState<EstanteItemExportDTO[]>([]);
  const [selectedImportIndexes, setSelectedImportIndexes] = useState<number[]>([]);
  const [loadedFileNames, setLoadedFileNames] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedExportIds(shelfItems.map((i) => i.id));
      if (shelfItems.length > 0 && !singleExportId) {
        setSingleExportId(shelfItems[0].id);
      }
    }
  }, [isOpen, initialTab, shelfItems, singleExportId]);

  if (!isOpen) return null;

  const toggleExportId = (id: number) => {
    setSelectedExportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const downloadJsonBlob = (payload: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecuteExport = async () => {
    if (shelfItems.length === 0) {
      toast.warning("Sua estante ainda está vazia para exportação.");
      return;
    }

    let targetIds: number[] = [];
    if (exportScope === "ALL") {
      targetIds = shelfItems.map((i) => i.id);
    } else if (exportScope === "SINGLE") {
      const chosenId = singleExportId || shelfItems[0]?.id;
      if (!chosenId) return;
      targetIds = [chosenId];
    } else {
      if (selectedExportIds.length === 0) {
        toast.warning("Selecione pelo menos uma obra para exportar.");
        return;
      }
      targetIds = selectedExportIds;
    }

    try {
      setIsProcessing(true);
      const dateSuffix = new Date().toISOString().split("T")[0];

      if (exportScope === "SINGLE" || (exportFormat === "SEPARATE_FILES" && targetIds.length > 1)) {
        for (const id of targetIds) {
          const singleDto = await CatalogService.exportarObraUnica(id);
          const itemTitle = singleDto.itens[0]?.titulo || `obra-${id}`;
          const slug = itemTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          downloadJsonBlob(singleDto, `shiori-obra-${slug}-${dateSuffix}.json`);
        }
        toast.success(
          targetIds.length === 1
            ? "Backup da obra exportado com sucesso!"
            : `${targetIds.length} arquivos de backup exportados em série!`
        );
      } else {
        const dto = await CatalogService.exportarItensSelecionados(targetIds);
        downloadJsonBlob(
          dto,
          `shiori-estante-${targetIds.length}-obras-${dateSuffix}.json`
        );
        toast.success(
          `Backup com ${dto.totalItens} obra(s) exportado com sucesso!`
        );
      }
      onClose();
    } catch (err: any) {
      toast.error(err, "Erro ao exportar backup");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const aggregatedItems: EstanteItemExportDTO[] = [];
    const names: string[] = [];

    for (const file of Array.from(files)) {
      names.push(file.name);
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        if (Array.isArray(json.itens)) {
          aggregatedItems.push(...json.itens);
        } else if (Array.isArray(json)) {
          aggregatedItems.push(...json);
        } else if (json && typeof json === "object" && json.titulo) {
          // Suporta JSON de uma obra individual direta
          aggregatedItems.push(json as EstanteItemExportDTO);
        }
      } catch {
        toast.error(`O arquivo "${file.name}" não é um JSON válido do Shiori.`);
      }
    }

    setLoadedFileNames(names);
    setParsedImportItems(aggregatedItems);
    setSelectedImportIndexes(aggregatedItems.map((_, idx) => idx));
    e.target.value = "";
  };

  const toggleImportIndex = (idx: number) => {
    setSelectedImportIndexes((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  };

  const handleExecuteImport = async () => {
    const chosenItems = parsedImportItems.filter((_, idx) =>
      selectedImportIndexes.includes(idx)
    );
    if (chosenItems.length === 0) {
      toast.warning("Selecione pelo menos uma obra para importar.");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await CatalogService.importarEstante({
        itens: chosenItems,
        substituirExistentes: replaceExisting,
      });
      toast.success(res.mensagem || `${res.totalImportados} obra(s) importada(s)!`);
      onImported();
      onClose();
    } catch (err: any) {
      toast.error(err, "Falha na importação");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Backup e Portabilidade (.JSON)"
    >
      <div className={styles.container}>
        <p className={styles.intro}>
          Exporte ou importe 1 obra individual ou várias obras em série (inclui capas/banners WebP, tags e onde parou).
        </p>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "EXPORT"}
            onClick={() => setActiveTab("EXPORT")}
            className={`${styles.tab} ${activeTab === "EXPORT" ? styles.tabActive : ""}`}
          >
            <Download size={15} /> Exportar (Em Série ou 1 Obra)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "IMPORT"}
            onClick={() => setActiveTab("IMPORT")}
            className={`${styles.tab} ${activeTab === "IMPORT" ? styles.tabActive : ""}`}
          >
            <Upload size={15} /> Importar (1 ou Vários Arquivos)
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "EXPORT" ? (
            <>
              {/* Escopo de Exportação */}
              <div className={styles.scopeGrid}>
                {(
                  [
                    {
                      id: "ALL",
                      title: "Exportar Todas em Série",
                      desc: `Todas as ${shelfItems.length} obras da estante`,
                      icon: <Layers size={15} />,
                    },
                    {
                      id: "SELECTED",
                      title: "Selecionar Obras (Série)",
                      desc: "Escolha quais obras incluir",
                      icon: <CheckSquare size={15} />,
                    },
                    {
                      id: "SINGLE",
                      title: "Exportar 1 Obra",
                      desc: "Backup de uma obra específica",
                      icon: <FileText size={15} />,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExportScope(opt.id)}
                    className={`${styles.scopeCard} ${exportScope === opt.id ? styles.scopeCardActive : ""}`}
                  >
                    <span className={styles.scopeTitle}>
                      {opt.icon}
                      <span>{opt.title}</span>
                    </span>
                    <span className={styles.scopeDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Seleção de 1 Obra */}
              {exportScope === "SINGLE" && (
                <div className={styles.field}>
                  <label htmlFor="portability-single-select" className={styles.fieldLabel}>
                    Escolha a obra que deseja exportar:
                  </label>
                  <select
                    id="portability-single-select"
                    value={singleExportId}
                    onChange={(e) => setSingleExportId(Number(e.target.value))}
                    className={styles.select}
                  >
                    {shelfItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.titulo || it.obraTitulo} ({it.tipoObra || "MANGA"} • Cap. {it.progressoAtual || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seleção Múltipla em Série */}
              {exportScope === "SELECTED" && (
                <div className={styles.field}>
                  <div className={styles.listHeader}>
                    <span className={styles.fieldLabel}>
                      Obras selecionadas ({selectedExportIds.length} de {shelfItems.length}):
                    </span>
                    <div className={styles.listActions}>
                      <button
                        type="button"
                        onClick={() => setSelectedExportIds(shelfItems.map((i) => i.id))}
                        className={styles.linkButtonPrimary}
                      >
                        Marcar todas
                      </button>
                      <span className={styles.separator}>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportIds([])}
                        className={styles.linkButtonMuted}
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className={styles.workList}>
                    {shelfItems.map((it) => {
                      const checked = selectedExportIds.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => toggleExportId(it.id)}
                          className={styles.workRow}
                        >
                          <span className={styles.workRowMain}>
                            {checked ? (
                              <CheckSquare size={16} className={styles.checkIconActive} />
                            ) : (
                              <Square size={16} className={styles.checkIcon} />
                            )}
                            <span className={styles.workTitle}>{it.titulo || it.obraTitulo}</span>
                          </span>
                          <span className={styles.workMeta}>
                            {TIPO_OBRA_LABELS[(it.tipoObra as TipoObra) || "MANGA"] || it.tipoObra} • Cap. {it.progressoAtual || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formato do Arquivo quando exportando múltiplas obras */}
              {exportScope !== "SINGLE" && (
                <div className={styles.formatBox}>
                  <span className={styles.fieldLabel}>
                    Formato de saída para exportação em série:
                  </span>
                  <div className={styles.formatOptions}>
                    <button
                      type="button"
                      onClick={() => setExportFormat("UNIFIED")}
                      className={`${styles.formatButton} ${exportFormat === "UNIFIED" ? styles.formatButtonActive : ""}`}
                    >
                      1 Arquivo Unificado (.json)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat("SEPARATE_FILES")}
                      className={`${styles.formatButton} ${exportFormat === "SEPARATE_FILES" ? styles.formatButtonActive : ""}`}
                    >
                      Arquivos Individuais por Obra
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ABA IMPORTAR */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                multiple
                onChange={handleFilesSelected}
                className={styles.visuallyHidden}
                tabIndex={-1}
                aria-hidden="true"
                data-testid="portability-import-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={styles.dropzone}
              >
                <Upload size={26} className={styles.dropzoneIcon} />
                <p className={styles.dropzoneTitle}>
                  Clique para escolher 1 ou vários arquivos de backup (.json)
                </p>
                <p className={styles.dropzoneHint}>
                  Suporta backups de 1 obra individual ou da estante inteira em série.
                </p>
                {loadedFileNames.length > 0 && (
                  <div className={styles.loadedFiles}>
                    Arquivos carregados: {loadedFileNames.join(", ")}
                  </div>
                )}
              </div>

              {parsedImportItems.length > 0 && (
                <div className={styles.field}>
                  <div className={styles.listHeader}>
                    <span className={styles.listHeading}>
                      Obras encontradas para importar ({selectedImportIndexes.length} de {parsedImportItems.length}):
                    </span>
                    <div className={styles.listActions}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImportIndexes(parsedImportItems.map((_, idx) => idx))
                        }
                        className={styles.linkButtonPrimary}
                      >
                        Selecionar todas
                      </button>
                      <span className={styles.separator}>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedImportIndexes([])}
                        className={styles.linkButtonMuted}
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className={styles.workList}>
                    {parsedImportItems.map((item, idx) => {
                      const checked = selectedImportIndexes.includes(idx);
                      return (
                        <button
                          key={`${item.titulo}-${idx}`}
                          type="button"
                          onClick={() => toggleImportIndex(idx)}
                          className={styles.workRow}
                        >
                          <span className={styles.workRowMain}>
                            {checked ? (
                              <CheckSquare size={16} className={styles.checkIconActive} />
                            ) : (
                              <Square size={16} className={styles.checkIcon} />
                            )}
                            {item.capaUrl ? (
                              <img
                                src={item.capaUrl}
                                alt={item.titulo}
                                className={styles.cover}
                              />
                            ) : (
                              <span className={styles.coverPlaceholder}>
                                <BookOpen size={12} />
                              </span>
                            )}
                            <span className={styles.workText}>
                              <span className={styles.workTitle}>{item.titulo}</span>
                              <span className={styles.workMeta}>
                                {item.tipoObra || "MANGA"} • Cap. {item.progressoAtual || 0}
                                {item.marcadorOndeParou ? ` • ${item.marcadorOndeParou}` : ""}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <label className={styles.replaceLabel}>
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                    />
                    <span>Substituir toda a estante atual pelos itens importados (sobrescrever)</span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.secondaryButton}>
            Fechar
          </button>

          {activeTab === "EXPORT" ? (
            <button
              type="button"
              disabled={isProcessing || shelfItems.length === 0}
              onClick={handleExecuteExport}
              className={styles.primaryButton}
            >
              <Download size={15} />
              {exportScope === "SINGLE"
                ? "Baixar Backup da Obra (.json)"
                : exportScope === "SELECTED"
                  ? `Exportar ${selectedExportIds.length} Obra(s)`
                  : `Exportar Todas (${shelfItems.length} Obras)`}
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing || selectedImportIndexes.length === 0}
              onClick={handleExecuteImport}
              className={styles.primaryButton}
            >
              <Check size={15} />
              Importar {selectedImportIndexes.length} Obra(s) para a Estante
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
