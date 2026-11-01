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
import styles from "./ImageWebpCropModal.module.css";

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
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Estúdio de Recorte e Conversão WebP"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>
              <Crop size={18} />
            </div>
            <div>
              <h3 className={styles.title}>
                Recorte & Otimização Automática WebP
                <span className={styles.badge}>
                  WebP Leve
                </span>
              </h3>
              <p className={styles.subtitle}>
                Ajuste o enquadramento da Capa (2:3) e do Banner (16:9). Tudo é convertido para WebP automaticamente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.iconButton}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Seletor de Modo: Capa, Banner ou Ambos */}
          <div className={styles.modeBar}>
            <span className={styles.modeLabel}>
              O que deseja gerar desta imagem?
            </span>
            <div className={styles.modeOptions}>
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
                  className={`${styles.chip} ${mode === opt.id ? styles.chipActive : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Entrada de Imagem (Upload, Colar ou URL) */}
          <div className={styles.inputBar}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.visuallyHidden}
              data-testid="webp-crop-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.uploadButton}
            >
              <Upload size={15} /> Escolher Arquivo de Imagem
            </button>

            <div className={styles.urlGroup}>
              <div className={styles.urlField}>
                <Link2
                  size={14}
                  className={styles.urlIcon}
                />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Ou cole URL da imagem / pressione Ctrl+V..."
                  className={styles.urlInput}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    setSourceDataUrl(urlInput.trim());
                  }
                }}
                className={styles.secondaryButton}
              >
                Carregar
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className={styles.error}>
              {errorMsg}
            </div>
          )}

          {/* Abas de alternância entre visualização da Capa (2:3) e Banner (16:9) quando em modo AMBOS */}
          {mode === "AMBOS" && loadedImage && (
            <div className={styles.previewTabs}>
              <button
                type="button"
                onClick={() => setActivePreviewTab("CAPA")}
                className={`${styles.tab} ${activePreviewTab === "CAPA" ? styles.tabActive : ""}`}
              >
                1. Ajustar Capa Vertical (2:3) {webpStats.capaKb ? `• ~${webpStats.capaKb} KB` : ""}
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("BANNER")}
                className={`${styles.tab} ${activePreviewTab === "BANNER" ? styles.tabActive : ""}`}
              >
                2. Ajustar Banner Panorâmico (16:9) {webpStats.bannerKb ? `• ~${webpStats.bannerKb} KB` : ""}
              </button>
            </div>
          )}

          {/* Área de Preview e Arraste no Canvas */}
          <div className={styles.previewArea}>
            {loadedImage ? (
              <>
                <div className={styles.previewHint}>
                  <span>
                    Arraste a imagem abaixo para posicionar o recorte de{" "}
                    <strong>
                      {activePreviewTab === "BANNER" ? "Banner 16:9 (1280×720)" : "Capa 2:3 (600×900)"}
                    </strong>
                  </span>
                </div>
                <div
                  className={`${styles.canvasFrame} ${
                    activePreviewTab === "BANNER" ? styles.canvasFrameBanner : styles.canvasFrameCover
                  }`}
                >
                  <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={styles.canvas}
                  />
                </div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={styles.emptyState}
              >
                <div className={styles.emptyIcon}>
                  <ImageIcon size={26} />
                </div>
                <p className={styles.emptyTitle}>
                  Clique para enviar uma imagem ou pressione <kbd className={styles.kbd}>Ctrl+V</kbd>
                </p>
                <p className={styles.emptyHint}>
                  <ClipboardPaste size={12} /> Conversão instantânea para WebP de alta eficiência
                </p>
              </div>
            )}
          </div>

          {/* Controles de Zoom, Posição e Qualidade WebP */}
          {loadedImage && (
            <div className={styles.controls}>
              <div>
                <label className={styles.controlLabel}>
                  <span className={styles.controlTitle}>
                    <ZoomIn size={12} /> Zoom ({currentTransform.zoom.toFixed(2)}x)
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCurrentTransform({ zoom: 1, offsetX: 0, offsetY: 0 })}
                    className={styles.resetButton}
                  >
                    <RotateCcw size={10} /> Resetar
                  </button>
                </label>
                <div className={styles.sliderRow}>
                  <ZoomOut size={13} className={styles.sliderIcon} />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={currentTransform.zoom}
                    onChange={(e) => updateCurrentTransform({ zoom: Number(e.target.value) })}
                    className={styles.slider}
                  />
                  <ZoomIn size={13} className={styles.sliderIcon} />
                </div>
              </div>

              <div>
                <label className={styles.controlLabel}>
                  Enquadramento Vertical ({currentTransform.offsetY}%)
                </label>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={currentTransform.offsetY}
                  onChange={(e) => updateCurrentTransform({ offsetY: Number(e.target.value) })}
                  className={styles.slider}
                />
              </div>

              <div>
                <label className={styles.controlLabel}>
                  <span className={styles.controlTitle}>
                    <Sparkles size={12} className={styles.sparkIcon} /> Compressão WebP ({Math.round(quality * 100)}%)
                  </span>
                  <span className={styles.sizeStat}>
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
                  className={styles.sliderEmerald}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.ghostButton}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!loadedImage || isProcessing}
            onClick={handleApplyWebp}
            className={styles.primaryButton}
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
