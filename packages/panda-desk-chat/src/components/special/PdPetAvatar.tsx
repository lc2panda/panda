// Input: species, mood, size, animated props
// Output: Panda mascot avatar with inline SVG (always panda, species prop kept for API compat)
// Pos: Special layer — personality/mascot display element
import React, { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type PetSpecies =
  | "panda" | "cat" | "dog" | "fox" | "rabbit"
  | "bear" | "owl" | "penguin" | "koala" | "hamster"
  | "deer" | "wolf" | "dragon" | "phoenix";

export type PetMood =
  | "happy" | "sad" | "excited" | "sleepy" | "angry" | "neutral";

export interface PdPetAvatarProps {
  species: PetSpecies;
  mood?: PetMood;
  size?: "xs" | "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const sizeMap: Record<string, { container: string; svgSize: number }> = {
  xs: { container: "w-6 h-6", svgSize: 20 },
  sm: { container: "w-8 h-8", svgSize: 28 },
  md: { container: "w-10 h-10", svgSize: 34 },
  lg: { container: "w-14 h-14", svgSize: 48 },
};

/** Inline panda face SVG — matches public/icon.svg design */
function PandaSvg({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
    >
      {/* Ears */}
      <circle cx="68" cy="68" r="44" fill="#1a1a1a" />
      <circle cx="188" cy="68" r="44" fill="#1a1a1a" />
      {/* Face */}
      <ellipse cx="128" cy="148" rx="88" ry="80" fill="#f5f5f5" />
      {/* Eye patches */}
      <ellipse cx="92" cy="128" rx="28" ry="24" fill="#1a1a1a" transform="rotate(-8 92 128)" />
      <ellipse cx="164" cy="128" rx="28" ry="24" fill="#1a1a1a" transform="rotate(8 164 128)" />
      {/* Eyes */}
      <circle cx="92" cy="126" r="8" fill="#f5f5f5" />
      <circle cx="164" cy="126" r="8" fill="#f5f5f5" />
      {/* Eye highlights */}
      <circle cx="95" cy="123" r="3" fill="#ffffff" />
      <circle cx="167" cy="123" r="3" fill="#ffffff" />
      {/* Nose */}
      <ellipse cx="128" cy="158" rx="10" ry="7" fill="#1a1a1a" />
      {/* Mouth */}
      <path d="M118 165 Q128 174 138 165" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export const PdPetAvatar = forwardRef<HTMLDivElement, PdPetAvatarProps>(
  ({ species, mood = "neutral", size = "md", animated = false, className }, ref) => {
    const s = sizeMap[size] ?? sizeMap.md;

    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-species={species}
        data-mood={mood}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "bg-[var(--pd-color-bg-hover)] select-none",
          s.container,
          animated && "animate-bounce",
          className,
        )}
      >
        <PandaSvg size={s.svgSize} />
      </div>
    );
  },
);

PdPetAvatar.displayName = "PdPetAvatar";
