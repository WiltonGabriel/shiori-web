import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Upload,
  CheckSquare,
  Square,
  FileJson,
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
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Central de Backup: Importar e Exportar em Série ou Individual"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
              <FileJson size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Central de Backup e Portabilidade (.JSON)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Exporte ou importe 1 obra individual ou várias obras em série (inclui capas/banners WebP, tags e onde parou).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30">
          <button
            type="button"
            onClick={() => setActiveTab("EXPORT")}
            className={`py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "EXPORT"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Download size={15} /> Exportar (Em Série ou 1 Obra)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IMPORT")}
            className={`py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "IMPORT"
                ? "border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Upload size={15} /> Importar (1 ou Vários Arquivos)
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "EXPORT" ? (
            <>
              {/* Escopo de Exportação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportScope === opt.id
                        ? "bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)]"
                        : "bg-[var(--bg-elevated)]/40 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      {opt.icon}
                      <span>{opt.title}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {/* Seleção de 1 Obra */}
              {exportScope === "SINGLE" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Escolha a obra que deseja exportar:
                  </label>
                  <select
                    value={singleExportId}
                    onChange={(e) => setSingleExportId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      Obras selecionadas ({selectedExportIds.length} de {shelfItems.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExportIds(shelfItems.map((i) => i.id))}
                        className="text-xs text-[var(--accent-primary)] hover:underline font-semibold"
                      >
                        Marcar todas
                      </button>
                      <span className="text-[var(--text-muted)]">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedExportIds([])}
                        className="text-xs text-[var(--text-muted)] hover:underline"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-[var(--border-subtle)] rounded-xl divide-y divide-[var(--border-subtle)] bg-[var(--bg-base)]">
                    {shelfItems.map((it) => {
                      const checked = selectedExportIds.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => toggleExportId(it.id)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-[var(--bg-elevated)]/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {checked ? (
                              <CheckSquare size={15} className="text-[var(--accent-primary)] shrink-0" />
                            ) : (
                              <Square size={15} className="text-[var(--text-muted)] shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {it.titulo || it.obraTitulo}
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)] shrink-0 ml-2">
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
                <div className="p-3 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    Formato de saída para exportação em série:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat("UNIFIED")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        exportFormat === "UNIFIED"
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      1 Arquivo Unificado (.json)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat("SEPARATE_FILES")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        exportFormat === "SEPARATE_FILES"
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
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
                className="hidden"
                data-testid="portability-import-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)] rounded-2xl p-6 text-center cursor-pointer transition-all bg-[var(--bg-elevated)]/30"
              >
                <Upload size={26} className="mx-auto mb-2 text-[var(--accent-primary)]" />
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Clique para escolher 1 ou vários arquivos de backup (.json)
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Suporta backups de 1 obra individual ou da estante inteira em série.
                </p>
                {loadedFileNames.length > 0 && (
                  <div className="mt-3 text-xs text-emerald-400 font-semibold">
                    Arquivos carregados: {loadedFileNames.join(", ")}
                  </div>
                )}
              </div>

              {parsedImportItems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Obras encontradas para importar ({selectedImportIndexes.length} de {parsedImportItems.length}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedImportIndexes(parsedImportItems.map((_, idx) => idx))
                        }
                        className="text-xs text-[var(--accent-primary)] hover:underline font-semibold"
                      >
                        Selecionar todas
                      </button>
                      <span className="text-[var(--text-muted)]">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedImportIndexes([])}
                        className="text-xs text-[var(--text-muted)] hover:underline"
                      >
                        Desmarcar
                      </button>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-[var(--border-subtle)] rounded-xl divide-y divide-[var(--border-subtle)] bg-[var(--bg-base)]">
                    {parsedImportItems.map((item, idx) => {
                      const checked = selectedImportIndexes.includes(idx);
                      return (
                        <button
                          key={`${item.titulo}-${idx}`}
                          type="button"
                          onClick={() => toggleImportIndex(idx)}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-[var(--bg-elevated)]/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {checked ? (
                              <CheckSquare size={15} className="text-[var(--accent-primary)] shrink-0" />
                            ) : (
                              <Square size={15} className="text-[var(--text-muted)] shrink-0" />
                            )}
                            {item.capaUrl ? (
                              <img
                                src={item.capaUrl}
                                alt={item.titulo}
                                className="w-7 h-10 object-cover rounded border border-[var(--border-subtle)] shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-10 rounded bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                                <BookOpen size={12} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-[var(--text-primary)] block truncate">
                                {item.titulo}
                              </span>
                              <span className="text-[11px] text-[var(--text-muted)] block truncate">
                                {item.tipoObra || "MANGA"} • Cap. {item.progressoAtual || 0}
                                {item.marcadorOndeParou ? ` • ${item.marcadorOndeParou}` : ""}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer pt-1">
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
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            Fechar
          </button>

          {activeTab === "EXPORT" ? (
            <button
              type="button"
              disabled={isProcessing || shelfItems.length === 0}
              onClick={handleExecuteExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-lg"
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-lg"
            >
              <Check size={15} />
              Importar {selectedImportIndexes.length} Obra(s) para a Estante
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
