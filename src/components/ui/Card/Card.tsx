import React from "react";
import styles from "./Card.module.css";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  className = "",
  ...rest
}) => {
  return (
    <div
      className={`${styles.card} ${interactive ? styles.interactive : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
