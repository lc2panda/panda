// Input: species, mood, size, animated props
// Output: Decorative pet avatar with emoji placeholder (14 species)
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

const speciesEmoji: Record<PetSpecies, string> = {
  panda: "\u{1F43C}",
  cat: "\u{1F431}",
  dog: "\u{1F436}",
  fox: "\u{1F98A}",
  rabbit: "\u{1F430}",
  bear: "\u{1F43B}",
  owl: "\u{1F989}",
  penguin: "\u{1F427}",
  koala: "\u{1F428}",
  hamster: "\u{1F439}",
  deer: "\u{1F98C}",
  wolf: "\u{1F43A}",
  dragon: "\u{1F409}",
  phoenix: "\u{1F985}",
};

const sizeStyles: Record<string, { container: string; emoji: string }> = {
  xs: { container: "w-6 h-6", emoji: "text-sm" },
  sm: { container: "w-8 h-8", emoji: "text-lg" },
  md: { container: "w-10 h-10", emoji: "text-2xl" },
  lg: { container: "w-14 h-14", emoji: "text-3xl" },
};

export const PdPetAvatar = forwardRef<HTMLDivElement, PdPetAvatarProps>(
  ({ species, mood = "neutral", size = "md", animated = false, className }, ref) => {
    const emoji = speciesEmoji[species] ?? speciesEmoji.panda;
    const s = sizeStyles[size];

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
        <span className={s.emoji}>{emoji}</span>
      </div>
    );
  },
);

PdPetAvatar.displayName = "PdPetAvatar";
