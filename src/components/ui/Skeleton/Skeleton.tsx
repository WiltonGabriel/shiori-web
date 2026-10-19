import React from "react";
import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  animation?: "shimmer" | "pulse" | "none";
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "text",
  width,
  height,
  borderRadius,
  animation = "shimmer",
  className = "",
  style = {},
}) => {
  const customStyle: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(borderRadius ? { borderRadius } : {}),
  };

  const animClass =
    animation === "shimmer" ? styles.shimmer : animation === "pulse" ? styles.pulse : "";
  const variantClass = styles[variant] || "";

  return (
    <span
      className={`${styles.skeleton} ${variantClass} ${animClass} ${className}`}
      style={customStyle}
      aria-hidden="true"
    />
  );
};

export const CatalogCardSkeleton: React.FC = () => {
  return (
    <div className={styles.cardSkeleton}>
      <Skeleton variant="rectangular" height={260} borderRadius="var(--radius-md)" />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
        <Skeleton variant="rectangular" width={60} height={20} borderRadius="var(--radius-sm)" />
        <Skeleton variant="rectangular" width={85} height={20} borderRadius="var(--radius-sm)" />
      </div>
      <Skeleton variant="text" width="85%" height={18} />
      <Skeleton variant="text" width="45%" height={14} />
      <Skeleton
        variant="rectangular"
        height={36}
        borderRadius="var(--radius-md)"
        style={{ marginTop: "auto" }}
      />
    </div>
  );
};

export const ShelfCardSkeleton: React.FC = () => {
  return (
    <div className={styles.shelfCardSkeleton}>
      <Skeleton
        variant="rectangular"
        width={82}
        height={110}
        borderRadius="var(--radius-md)"
        style={{ flexShrink: 0 }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="rectangular" width={40} height={16} borderRadius="var(--radius-sm)" />
        </div>
        <Skeleton variant="text" width="40%" height={12} />
        <Skeleton
          variant="rectangular"
          height={6}
          borderRadius="var(--radius-sm)"
          style={{ marginTop: "0.25rem" }}
        />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
          <Skeleton variant="rectangular" width={36} height={28} borderRadius="var(--radius-sm)" />
          <Skeleton variant="rectangular" width={70} height={28} borderRadius="var(--radius-sm)" />
        </div>
      </div>
    </div>
  );
};
