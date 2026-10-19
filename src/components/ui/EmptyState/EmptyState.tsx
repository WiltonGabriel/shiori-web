import React from "react";
import { Link } from "react-router-dom";
import styles from "./EmptyState.module.css";
import { Button } from "../Button/Button";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
  children,
}) => {
  const renderActionButton = (act: EmptyStateAction) => {
    const btn = (
      <Button
        variant={act.variant || "primary"}
        size="md"
        onClick={act.onClick}
      >
        {act.icon}
        <span>{act.label}</span>
      </Button>
    );

    if (act.href) {
      return (
        <Link to={act.href} key={act.label} style={{ textDecoration: "none" }}>
          {btn}
        </Link>
      );
    }

    return React.cloneElement(btn, { key: act.label });
  };

  return (
    <div className={`${styles.emptyState} ${className}`} role="status">
      <div className={styles.iconWrapper}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}

      {(action || secondaryAction || children) && (
        <div className={styles.actions}>
          {action && renderActionButton(action)}
          {secondaryAction &&
            renderActionButton({
              ...secondaryAction,
              variant: secondaryAction.variant || "secondary",
            })}
          {children}
        </div>
      )}
    </div>
  );
};
