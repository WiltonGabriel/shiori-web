import React, { useRef, useState, useEffect, useCallback } from "react";
import styles from "./HorizontalScroller.module.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  step?: number;
  showArrows?: boolean;
  showFade?: boolean;
  ariaLabel?: string;
  enableMouseDrag?: boolean;
}

export const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({
  children,
  className = "",
  contentClassName = "",
  step = 260,
  showArrows = true,
  showFade = true,
  ariaLabel = "Barra de rolagem horizontal",
  enableMouseDrag = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Estados para mouse dragging suave
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const checkScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);

    if (!overflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollState();

    const handleScroll = () => {
      checkScrollState();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkScrollState);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScrollState();
      });
      resizeObserver.observe(el);
      Array.from(el.children).forEach((child) => resizeObserver?.observe(child));
    }

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollState);
      resizeObserver?.disconnect();
    };
  }, [checkScrollState, children]);

  // Suporte a mouse wheel tilt / shift
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || !hasOverflow) return;

    // Suporte explícito a tilt horizontal (mouses Logitech MX Master, G502, Razer, etc.)
    if (Math.abs(e.deltaX) > 0) {
      el.scrollLeft += e.deltaX;
      return;
    }

    // Se o usuário estiver segurando Shift enquanto usa a roda vertical
    if (e.shiftKey) {
      el.scrollLeft += e.deltaY;
    }
  };

  const scrollByAmount = (amount: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Mouse drag handlers (opcional)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMouseDrag) return;
    const el = containerRef.current;
    if (!el || !hasOverflow) return;

    isDragging.current = true;
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftStart.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !enableMouseDrag) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    el.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Determinar classe de máscara de gradiente
  let maskClass = "";
  if (showFade && hasOverflow) {
    if (canScrollLeft && canScrollRight) {
      maskClass = styles.maskBoth;
    } else if (canScrollLeft) {
      maskClass = styles.maskLeft;
    } else if (canScrollRight) {
      maskClass = styles.maskRight;
    }
  }

  return (
    <div className={`${styles.wrapper} ${className}`} role="region" aria-label={ariaLabel}>
      {showArrows && hasOverflow && canScrollLeft && (
        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonLeft}`}
          onClick={() => scrollByAmount(-step)}
          aria-label="Rolar para a esquerda"
          title="Rolar para a esquerda"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        ref={containerRef}
        className={`${styles.scroller} ${maskClass} ${contentClassName}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        tabIndex={0}
        style={{ cursor: enableMouseDrag && hasOverflow ? "grab" : "auto" }}
      >
        {children}
      </div>

      {showArrows && hasOverflow && canScrollRight && (
        <button
          type="button"
          className={`${styles.navButton} ${styles.navButtonRight}`}
          onClick={() => scrollByAmount(step)}
          aria-label="Rolar para a direita"
          title="Rolar para a direita"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};
