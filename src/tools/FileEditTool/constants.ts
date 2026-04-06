// In its own file to avoid circular dependencies
export const FILE_EDIT_TOOL_NAME = 'Edit'

// Permission pattern for granting session-level access to the project's .pandacc/ folder
export const CLAUDE_FOLDER_PERMISSION_PATTERN = '/.pandacc/**'

// Permission pattern for granting session-level access to the global ~/.pandacc/ folder
export const GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN = '~/.pandacc/**'

export const FILE_UNEXPECTEDLY_MODIFIED_ERROR =
  'File content has changed since it was last read. This commonly happens when a linter or formatter run via Bash rewrites the file. Call Read on this file to refresh, then retry the edit.'
