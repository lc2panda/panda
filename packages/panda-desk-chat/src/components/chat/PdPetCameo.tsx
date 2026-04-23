// Input: Occasion type (empty_state, no_results, holiday, random)
// Output: Panda mascot SVG illustration with occasion message
// Pos: ChatPage empty state — centered above HeroComposer when no active session
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import React, { useMemo } from "react";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

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

/** Always panda — brand mascot, no random rotation */

function getEmptyStateMessages() {
  return [
    t('pet.emptyState.ready'),
    t('pet.emptyState.build'),
    t('pet.emptyState.start'),
    t('pet.emptyState.code'),
  ];
}

function getNoResultsMessages() {
  return [
    t('pet.noResults.nothing'),
    t('pet.noResults.empty'),
    t('pet.noResults.hmm'),
  ];
}

function getHolidayMessages() {
  return [
    t('pet.holiday.happy'),
    t('pet.holiday.break'),
  ];
}

function getRandomMessages() {
  return [
    t('pet.random.hi'),
    t('pet.random.bamboo'),
    t('pet.random.lucky'),
    t('pet.random.munches'),
  ];
}

function getOccasionMessages(occasion: PetCameoOccasion): string[] {
  switch (occasion) {
    case 'empty_state': return getEmptyStateMessages();
    case 'no_results': return getNoResultsMessages();
    case 'holiday': return getHolidayMessages();
    case 'random': return getRandomMessages();
  }
}

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
  const displayMessage = useMemo(
    () => message ?? pickRandom(getOccasionMessages(occasion)),
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
      aria-label={`Panda mascot: ${displayMessage}`}
    >
      <div
        className={cn(
          "pet-cameo__species",
          "block leading-none",
        )}
        aria-hidden="true"
        style={{ width: 80, height: 80 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="80" height="80">
          <circle cx="68" cy="68" r="44" fill="#1a1a1a" />
          <circle cx="188" cy="68" r="44" fill="#1a1a1a" />
          <ellipse cx="128" cy="148" rx="88" ry="80" fill="#f5f5f5" />
          <ellipse cx="92" cy="128" rx="28" ry="24" fill="#1a1a1a" transform="rotate(-8 92 128)" />
          <ellipse cx="164" cy="128" rx="28" ry="24" fill="#1a1a1a" transform="rotate(8 164 128)" />
          <circle cx="92" cy="126" r="8" fill="#f5f5f5" />
          <circle cx="164" cy="126" r="8" fill="#f5f5f5" />
          <circle cx="95" cy="123" r="3" fill="#ffffff" />
          <circle cx="167" cy="123" r="3" fill="#ffffff" />
          <ellipse cx="128" cy="158" rx="10" ry="7" fill="#1a1a1a" />
          <path d="M118 165 Q128 174 138 165" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
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
