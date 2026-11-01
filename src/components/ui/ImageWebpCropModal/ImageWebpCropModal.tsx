import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Sparkles,
  Link2,
  ClipboardPaste,
} from "lucide-react";

export type CropTargetMode = "CAPA" | "BANNER" | "AMBOS";

export interface ImageWebpCropResult {
  capaWebp?: string;
  bannerWebp?: string;
}

interface ImageWebpCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string;
  initialMode?: CropTargetMode;
  onApply: (result: ImageWebpCropResult) => void;
}

interface CropTransform {
  zoom: number;
  offsetX: number; // -100 to 100 (%)
  offsetY: number; // -100 to 100 (%)
}

const COVER_WIDTH = 600;
const COVER_HEIGHT = 900; // 2:3
const BANNER_WIDTH = 1280;
const BANNER_HEIGHT = 720; // 16:9

export const ImageWebpCropModal: React.FC<ImageWebpCropModalProps> = ({
  isOpen,
  onClose,
  initialImageUrl = "",
  initialMode = "AMBOS",
  onApply,
}) => {
  const [mode, setMode] = useState<CropTargetMode>(initialMode);
  const [activePreviewTab, setActivePreviewTab] = useState<"CAPA" | "BANNER">(
    initialMode === "BANNER" ? "BANNER" : "CAPA"
  );
  const [sourceDataUrl, setSourceDataUrl] = useState<string>(initialImageUrl);
  const [urlInput, setUrlInput] = useState<string>("");
  const [quality, setQuality] = useState<number>(0.85);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [coverTransform, setCoverTransform] = useState<CropTransform>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const [bannerTransform, setBannerTransform] = useState<CropTransform>({
    zoom: 1.15,
    offsetX: 0,
    offsetY: 0,
  });

  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [webpStats, setWebpStats] = useState<{ capaKb?: number; bannerKb?: number }>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setActivePreviewTab(initialMode === "BANNER" ? "BANNER" : "CAPA");
      if (initialImageUrl) {
        setSourceDataUrl(initialImageUrl);
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialImageUrl, initialMode]);

  // Carrega a imagem no elemento HTMLImageElement para desenho no Canvas
  useEffect(() => {
    if (!sourceDataUrl) {
      setLoadedImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setLoadedImage(img);
      setErrorMsg(null);
    };
    img.onerror = () => {
      setLoadedImage(null);
      setErrorMsg(
        "Não foi possível carregar esta URL diretamente para recorte (bloqueio CORS do site de origem). Baixe ou copie a imagem e cole aqui com Ctrl+V!"
      );
    };
    img.src = sourceDataUrl;
  }, [sourceDataUrl]);

  const renderToCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      img: HTMLImageElement,
      targetWidth: number,
      targetHeight: number,
      transform: CropTransform
    ) => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Calcula escala base para cobrir o frame ("object-fit: cover")
      const scaleX = targetWidth / img.width;
      const scaleY = targetHeight / img.height;
      const baseScale = Math.max(scaleX, scaleY);
      const finalScale = baseScale * transform.zoom;

      const drawWidth = img.width * finalScale;
      const drawHeight = img.height * finalScale;

      const maxPanX = Math.max(0, (drawWidth - targetWidth) / 2);
      const maxPanY = Math.max(0, (drawHeight - targetHeight) / 2);

      const centerX = (targetWidth - drawWidth) / 2 + (transform.offsetX / 100) * maxPanX;
      const centerY = (targetHeight - drawHeight) / 2 + (transform.offsetY / 100) * maxPanY;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, centerX, centerY, drawWidth, drawHeight);
    },
    []
  );

  // Atualiza o canvas visível em tempo real
  useEffect(() => {
    if (!loadedImage || !canvasRef.current) return;
    const isBanner = activePreviewTab === "BANNER";
    const targetW = isBanner ? BANNER_WIDTH : COVER_WIDTH;
    const targetH = isBanner ? BANNER_HEIGHT : COVER_HEIGHT;
    const transform = isBanner ? bannerTransform : coverTransform;

    renderToCanvas(canvasRef.current, loadedImage, targetW, targetH, transform);

    try {
      const dataUrl = canvasRef.current.toDataURL("image/webp", quality);
      const kb = Math.round(((dataUrl.length - 22) * 3) / 4 / 1024);
      setWebpStats((prev) =>
        isBanner ? { ...prev, bannerKb: kb } : { ...prev, capaKb: kb }
      );
    } catch {
      // Caso a imagem externa não permita exportação de canvas
    }
  }, [
    loadedImage,
    activePreviewTab,
    coverTransform,
    bannerTransform,
    quality,
    renderToCanvas,
  ]);

  const readFileAsDataUrl = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP, AVIF).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSourceDataUrl(reader.result);
        setCoverTransform({ zoom: 1, offsetX: 0, offsetY: 0 });
        setBannerTransform({ zoom: 1.15, offsetX: 0, offsetY: 0 });
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Suporte a Ctrl+V para colar imagem direto da área de transferência
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            readFileAsDataUrl(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, readFileAsDataUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileAsDataUrl(file);
    }
    e.target.value = "";
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loadedImage) return;
    const currentTransform = activePreviewTab === "BANNER" ? bannerTransform : coverTransform;
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: currentTransform.offsetX,
      initialOffsetY: currentTransform.offsetY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStateRef.current.dragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;

    const nextOffsetX = Math.max(
      -100,
      Math.min(100, dragStateRef.current.initialOffsetX + dx * 0.45)
    );
    const nextOffsetY = Math.max(
      -100,
      Math.min(100, dragStateRef.current.initialOffsetY + dy * 0.45)
    );

    if (activePreviewTab === "BANNER") {
      setBannerTransform((prev) => ({
        ...prev,
        offsetX: Math.round(nextOffsetX),
        offsetY: Math.round(nextOffsetY),
      }));
    } else {
      setCoverTransform((prev) => ({
        ...prev,
        offsetX: Math.round(nextOffsetX),
        offsetY: Math.round(nextOffsetY),
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStateRef.current.dragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const currentTransform = activePreviewTab === "BANNER" ? bannerTransform : coverTransform;
  const updateCurrentTransform = (patch: Partial<CropTransform>) => {
    if (activePreviewTab === "BANNER") {
      setBannerTransform((prev) => ({ ...prev, ...patch }));
    } else {
      setCoverTransform((prev) => ({ ...prev, ...patch }));
    }
  };

  const handleApplyWebp = () => {
    if (!loadedImage) {
      setErrorMsg("Selecione ou cole uma imagem antes de aplicar.");
      return;
    }
    setIsProcessing(true);
    try {
      const result: ImageWebpCropResult = {};

      if (mode === "CAPA" || mode === "AMBOS") {
        const tempCanvas = document.createElement("canvas");
        renderToCanvas(tempCanvas, loadedImage, COVER_WIDTH, COVER_HEIGHT, coverTransform);
        result.capaWebp = tempCanvas.toDataURL("image/webp", quality);
      }

      if (mode === "BANNER" || mode === "AMBOS") {
        const tempCanvas = document.createElement("canvas");
        renderToCanvas(tempCanvas, loadedImage, BANNER_WIDTH, BANNER_HEIGHT, bannerTransform);
        result.bannerWebp = tempCanvas.toDataURL("image/webp", quality);
      }

      onApply(result);
      onClose();
    } catch {
      setErrorMsg(
        "Falha ao converter a imagem para WebP. Se for uma URL externa com bloqueio CORS, copie a imagem e cole aqui (Ctrl+V)."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Estúdio de Recorte e Conversão WebP"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                Recorte & Otimização Automática WebP
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  WebP Leve
                </span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Ajuste o enquadramento da Capa (2:3) e do Banner (16:9). Tudo é convertido para WebP automaticamente.
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Seletor de Modo: Capa, Banner ou Ambos */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-elevated)]/50 p-2 rounded-xl border border-[var(--border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-secondary)] px-2">
              O que deseja gerar desta imagem?
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "AMBOS", label: "Capa (2:3) + Banner (16:9)" },
                  { id: "CAPA", label: "Apenas Capa (2:3)" },
                  { id: "BANNER", label: "Apenas Banner (16:9)" },
                ] as { id: CropTargetMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMode(opt.id);
                    if (opt.id === "CAPA") setActivePreviewTab("CAPA");
                    if (opt.id === "BANNER") setActivePreviewTab("BANNER");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === opt.id
                      ? "bg-[var(--accent-primary)] text-white shadow-sm"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Entrada de Imagem (Upload, Colar ou URL) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              data-testid="webp-crop-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="sm:col-span-5 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--accent-primary)]/15 hover:bg-[var(--accent-primary)]/25 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-xs font-bold transition-colors"
            >
              <Upload size={15} /> Escolher Arquivo de Imagem
            </button>

            <div className="sm:col-span-7 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Link2
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Ou cole URL da imagem / pressione Ctrl+V..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    setSourceDataUrl(urlInput.trim());
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-subtle)]"
              >
                Carregar
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Abas de alternância entre visualização da Capa (2:3) e Banner (16:9) quando em modo AMBOS */}
          {mode === "AMBOS" && loadedImage && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActivePreviewTab("CAPA")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  activePreviewTab === "CAPA"
                    ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                1. Ajustar Capa Vertical (2:3) {webpStats.capaKb ? `• ~${webpStats.capaKb} KB` : ""}
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("BANNER")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  activePreviewTab === "BANNER"
                    ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                2. Ajustar Banner Panorâmico (16:9) {webpStats.bannerKb ? `• ~${webpStats.bannerKb} KB` : ""}
              </button>
            </div>
          )}

          {/* Área de Preview e Arraste no Canvas */}
          <div className="relative flex flex-col items-center justify-center bg-slate-950/90 border border-[var(--border-subtle)] rounded-2xl p-4 min-h-[270px] select-none overflow-hidden">
            {loadedImage ? (
              <>
                <div className="text-[11px] text-slate-300 mb-2 flex items-center gap-2">
                  <span>
                    Arraste a imagem abaixo para posicionar o recorte de{" "}
                    <strong className="text-white">
                      {activePreviewTab === "BANNER" ? "Banner 16:9 (1280×720)" : "Capa 2:3 (600×900)"}
                    </strong>
                  </span>
                </div>
                <div
                  className={`relative overflow-hidden rounded-xl border-2 border-[var(--accent-primary)] shadow-xl cursor-grab active:cursor-grabbing ${
                    activePreviewTab === "BANNER"
                      ? "w-full max-w-[460px] aspect-video"
                      : "w-[190px] sm:w-[210px] aspect-[2/3]"
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="w-full h-full object-contain block touch-none"
                  />
                </div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center text-center py-10 px-4 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/40 transition-colors mb-3">
                  <ImageIcon size={26} />
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Clique para enviar uma imagem ou pressione <kbd className="px-1.5 py-0.5 text-xs bg-[var(--bg-elevated)] rounded border border-[var(--border-subtle)]">Ctrl+V</kbd>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                  <ClipboardPaste size={12} /> Conversão instantânea para WebP de alta eficiência
                </p>
              </div>
            )}
          </div>

          {/* Controles de Zoom, Posição e Qualidade WebP */}
          {loadedImage && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--bg-elevated)]/40 p-3.5 rounded-xl border border-[var(--border-subtle)]">
              <div>
                <label className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  <span className="flex items-center gap-1">
                    <ZoomIn size={12} /> Zoom ({currentTransform.zoom.toFixed(2)}x)
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCurrentTransform({ zoom: 1, offsetX: 0, offsetY: 0 })}
                    className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-0.5"
                  >
                    <RotateCcw size={10} /> Resetar
                  </button>
                </label>
                <div className="flex items-center gap-2">
                  <ZoomOut size={13} className="text-[var(--text-muted)]" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={currentTransform.zoom}
                    onChange={(e) => updateCurrentTransform({ zoom: Number(e.target.value) })}
                    className="w-full accent-[var(--accent-primary)]"
                  />
                  <ZoomIn size={13} className="text-[var(--text-muted)]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Enquadramento Vertical ({currentTransform.offsetY}%)
                </label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={currentTransform.offsetY}
                  onChange={(e) => updateCurrentTransform({ offsetY: Number(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} className="text-emerald-400" /> Compressão WebP ({Math.round(quality * 100)}%)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {activePreviewTab === "BANNER"
                      ? webpStats.bannerKb
                        ? `~${webpStats.bannerKb} KB`
                        : ""
                      : webpStats.capaKb
                        ? `~${webpStats.capaKb} KB`
                        : ""}
                  </span>
                </label>
                <input
                  type="range"
                  min={0.6}
                  max={0.95}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!loadedImage || isProcessing}
            onClick={handleApplyWebp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Check size={15} />
            {isProcessing
              ? "Convertendo para WebP..."
              : mode === "AMBOS"
                ? "Aplicar Capa + Banner em WebP"
                : mode === "BANNER"
                  ? "Aplicar Banner em WebP"
                  : "Aplicar Capa em WebP"}
          </button>
        </div>
      </div>
    </div>
  );
};
