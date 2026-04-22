// Input: Occasion type (empty_state, no_results, holiday, random)
// Output: Cute panda character illustration with message
// Pos: ChatPage empty state — centered above HeroComposer when no active session
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useMemo } from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type PetCameoOccasion =
  | "empty_state"
  | "no_results"
  | "holiday"
  | "random";

export interface PdPetCameoProps {
  occasion: PetCameoOccasion;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const SPECIES_POOL = [
  "\uD83D\uDC3C", // panda
  "\uD83D\uDC3B", // bear
  "\uD83E\uDD8A", // fox
  "\uD83D\uDC31", // cat
  "\uD83D\uDC36", // dog
  "\uD83D\uDC30", // rabbit
  "\uD83D\uDC28", // koala
  "\uD83E\uDD81", // lion
  "\uD83D\uDC2F", // tiger
  "\uD83D\uDC2E", // cow
  "\uD83D\uDC37", // pig
  "\uD83D\uDC38", // frog
  "\uD83E\uDD89", // owl
  "\uD83D\uDC27", // penguin
] as const;

const EMPTY_STATE_MESSAGES = [
  "Ready to help!",
  "What shall we build?",
  "Start a conversation",
  "Let's code together!",
] as const;

const NO_RESULTS_MESSAGES = [
  "Nothing found here...",
  "No results yet!",
  "Hmm, that's empty.",
] as const;

const HOLIDAY_MESSAGES = [
  "Happy coding holiday!",
  "Take a break & celebrate!",
] as const;

const RANDOM_MESSAGES = [
  "Hi there!",
  "Bamboo break?",
  "Feeling lucky!",
  "*munches bamboo*",
] as const;

const OCCASION_MESSAGES: Record<PetCameoOccasion, readonly string[]> = {
  empty_state: EMPTY_STATE_MESSAGES,
  no_results: NO_RESULTS_MESSAGES,
  holiday: HOLIDAY_MESSAGES,
  random: RANDOM_MESSAGES,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const PdPetCameo: React.FC<PdPetCameoProps> = ({ occasion, message }) => {
  // Pick species + fallback message once on mount (useMemo with empty deps
  // is intentional — we want stable picks per mount, not per render).
  const species = useMemo(() => pickRandom(SPECIES_POOL), []);
  const displayMessage = useMemo(
    () => message ?? pickRandom(OCCASION_MESSAGES[occasion]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occasion, message],
  );

  return (
    <div
      className={cn(
        "pet-cameo",
        "flex flex-col items-center gap-[var(--pd-space-2)]",
        "select-none",
      )}
      role="img"
      aria-label={`Pet cameo: ${displayMessage}`}
    >
      <span
        className={cn(
          "pet-cameo__species",
          "block text-[4rem] leading-none",
        )}
        aria-hidden="true"
      >
        {species}
      </span>
      <p
        className={cn(
          "text-[var(--pd-text-sm)]",
          "text-[var(--pd-color-fg-muted)]",
          "font-[var(--pd-font-medium)]",
          "text-center",
        )}
      >
        {displayMessage}
      </p>
    </div>
  );
};

PdPetCameo.displayName = "PdPetCameo";
