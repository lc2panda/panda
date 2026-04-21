// Input: src URL, alt text, size, fallback letter props
// Output: Circular avatar with image or letter fallback
// Pos: Atom layer — identity display primitive
import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface PdAvatarProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg";
  fallback?: string;
  className?: string;
}

const sizeStyles: Record<string, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-lg",
};

function hashColor(letter: string): string {
  const colors = [
    "var(--pd-color-bamboo-500)",
    "var(--pd-color-terra-500)",
    "var(--pd-color-accent)",
    "var(--pd-color-warning)",
    "var(--pd-color-error)",
  ];
  const idx = (letter.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

export const PdAvatar = forwardRef<HTMLDivElement, PdAvatarProps>(
  ({ src, alt = "", size = "md", fallback, className }, ref) => {
    const [imgError, setImgError] = useState(false);
    const letter = (fallback || alt || "?").charAt(0).toUpperCase();
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        role="img"
        aria-label={alt || fallback || "avatar"}
        className={cn(
          "inline-flex items-center justify-center rounded-full overflow-hidden",
          "shrink-0 select-none font-medium",
          sizeStyles[size],
          className,
        )}
        style={!showImage ? { backgroundColor: hashColor(letter) } : undefined}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white">{letter}</span>
        )}
      </div>
    );
  },
);

PdAvatar.displayName = "PdAvatar";
