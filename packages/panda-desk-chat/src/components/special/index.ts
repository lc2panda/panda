// Input: Special component modules
// Output: Barrel re-exports for all special components
// Pos: Special layer — public API surface

export { PdSkeleton } from "./PdSkeleton";
export type { PdSkeletonProps } from "./PdSkeleton";

export { PdProgressBar } from "./PdProgressBar";
export type { PdProgressBarProps } from "./PdProgressBar";

export { PdEmptyState } from "./PdEmptyState";
export type { PdEmptyStateProps } from "./PdEmptyState";

export { PdSearchInput } from "./PdSearchInput";
export type { PdSearchInputProps } from "./PdSearchInput";

export { PdSegmentedControl } from "./PdSegmentedControl";
export type { PdSegmentedControlProps, PdSegmentedOption } from "./PdSegmentedControl";

export { PdDirectoryPicker } from "./PdDirectoryPicker";
export type { PdDirectoryPickerProps } from "./PdDirectoryPicker";

export { PdPetAvatar } from "./PdPetAvatar";
export type { PdPetAvatarProps, PetSpecies, PetMood } from "./PdPetAvatar";

export { PdCommandPalette } from "./PdCommandPalette";
export type { PdCommandPaletteProps, Command } from "./PdCommandPalette";

export { PdSessionSwitcher } from "./PdSessionSwitcher";
export type { PdSessionSwitcherProps, SessionItem } from "./PdSessionSwitcher";

export { PdPetMood } from "./PdPetMood";
export type { PdPetMoodProps } from "./PdPetMood";
export type { PetMoodState, PetMoodConfig } from "./PdPetMood";

export { PdFilePickerPopup } from "./PdFilePickerPopup";
export type {
  PdFilePickerPopupProps,
  PdFileEntry,
  PdFileEntryType,
} from "./PdFilePickerPopup";

export { PdSlashCommandPopup } from "./PdSlashCommandPopup";
export type { PdSlashCommandPopupProps, PdSlashCommand } from "./PdSlashCommandPopup";
