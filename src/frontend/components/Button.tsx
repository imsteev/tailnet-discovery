import React from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger";

type ButtonSize = "sm" | "md" | "lg";

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
  className?: string;
}

const getVariantStyles = (variant: ButtonVariant): string => {
  const variants = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white",
    success: "bg-success-500 hover:bg-success-600 text-white",
    warning: "bg-warning-500 hover:bg-warning-600 text-white",
    danger: "bg-danger-500 hover:bg-danger-600 text-white",
  };
  return variants[variant];
};

const getSizeStyles = (size: ButtonSize): string => {
  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return sizes[size];
};

export default function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  children,
  className = "",
}: Props) {
  const baseStyles =
    "border-none rounded cursor-pointer transition-colors font-medium";
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  const combinedClassName =
    `${baseStyles} ${variantStyles} ${sizeStyles} ${disabledStyles} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {children}
    </button>
  );
}
