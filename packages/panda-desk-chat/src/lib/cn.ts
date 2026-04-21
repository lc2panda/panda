// Input:  classname arguments (strings, objects, arrays, conditionals)
// Output: merged, deduplicated className string (Tailwind-aware)
// Pos:    utility — used by all components for conditional class composition
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
