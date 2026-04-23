// Input:  Tool name string
// Output: Matching specialized renderer component (or null for generic fallback)
// Pos:    Chat > tool-renderers — barrel export + dispatcher for tool-specific UIs
import type React from "react";
import type { ToolCallStatus } from "../PdToolCallCard";

/* -------------------------------------------------------------------------- */
/*  Shared props interface for all renderers                                  */
/* -------------------------------------------------------------------------- */

export interface ToolRendererProps {
  input: Record<string, unknown>;
  result?: string;
  status: ToolCallStatus;
  toolName: string;
  isError?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Lazy-loaded renderers                                                     */
/* -------------------------------------------------------------------------- */

import { BashRenderer } from "./BashRenderer";
import { FileRenderer } from "./FileRenderer";
import { SearchRenderer } from "./SearchRenderer";
import { AgentRenderer } from "./AgentRenderer";
import { WebRenderer } from "./WebRenderer";

export { BashRenderer, FileRenderer, SearchRenderer, AgentRenderer, WebRenderer };

/* -------------------------------------------------------------------------- */
/*  Dispatcher                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Returns the specialized renderer for a given tool name,
 * or `null` if the tool should use the generic JSON display.
 */
export function getToolRenderer(
  toolName: string,
): React.ComponentType<ToolRendererProps> | null {
  switch (toolName) {
    case "Bash":
    case "BashTool":
      return BashRenderer;

    case "Read":
    case "ReadTool":
    case "Write":
    case "WriteTool":
    case "Edit":
    case "FileEditTool":
      return FileRenderer;

    case "Grep":
    case "GrepTool":
    case "Glob":
    case "GlobTool":
      return SearchRenderer;

    case "Agent":
    case "AgentTool":
      return AgentRenderer;

    case "WebSearch":
    case "WebFetch":
      return WebRenderer;

    default:
      return null;
  }
}
