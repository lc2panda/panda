export function initBundledWorkflows(): void {
  // Bundled workflows are registered here at startup.
  // In the original build, this would register built-in workflow definitions
  // via registerWorkflow(). In this decompiled build, no bundled workflows
  // are available — the registry starts empty and workflows can be added
  // at runtime via the WorkflowTool API.
}
