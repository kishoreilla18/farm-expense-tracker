"use client";

import React from "react";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  confirmText?: string;
}

export function SubmitButton({
  children,
  loadingText = "Processing...",
  className = "btn-primary w-full",
  confirmText,
  onClick,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirmText) {
      if (!window.confirm(confirmText)) {
        e.preventDefault();
        return;
      }
    }
    if (onClick) onClick(e);
  };

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      onClick={handleClick}
      className={`${className} transition-all duration-150 active:scale-[0.97] ${
        pending ? "opacity-75 cursor-not-allowed pointer-events-none" : ""
      }`}
      {...props}
    >
      {pending ? (
        <span className="inline-flex items-center justify-center gap-1.5">
          <svg className="h-3.5 w-3.5 animate-spin text-current shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{loadingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
