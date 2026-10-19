import React from "react";
import styles from "./Input.module.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leadingIcon, className = "", id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {leadingIcon && <span className={styles.leadingIcon}>{leadingIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={`${styles.input} ${leadingIcon ? styles.hasLeadingIcon : ""} ${
              error ? styles.hasError : ""
            } ${className}`}
            {...rest}
          />
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
        {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
