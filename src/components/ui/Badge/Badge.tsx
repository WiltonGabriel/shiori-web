import React from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "brand"
    | "success"
    | "warning"
    | "danger"
    | "neutral"
    | "mangadex"
    | "kitsu"
    | "openlibrary"
    | "anilist"
    | "lendo"
    | "planejado"
    | "engavetado"
    | "terminou"
    | "abdicou";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
}) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
