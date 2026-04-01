import { registerBundledSkill } from '../bundledSkills.js'

const RUN_SKILL_GENERATOR_PROMPT = `# Run Skill Generator

You are generating a \`run-*\` skill for this project — a repeatable recipe for building and running the application locally.

## Phase 1: Discover

Investigate the project to understand how it builds and runs:

1. Read the top-level README, CONTRIBUTING, or similar docs
2. Check package manager files: package.json, Makefile, Cargo.toml, pyproject.toml, go.mod, Gemfile, etc.
3. Look for existing run/start/dev scripts
4. Check for Docker/docker-compose files
5. Look for .env.example or similar config templates
6. Identify the main entry point(s)

Build a mental model of:
- Prerequisites (language runtime, system deps, services like databases)
- Install/setup steps
- Build command(s)
- Run command(s) for development
- How to verify it's working (health check URL, expected output, etc.)

## Phase 2: Test the Recipe

Actually run the steps you discovered. Fix any issues you encounter. The goal is a recipe that works from a fresh clone.

Common issues to handle:
- Missing environment variables (document which are required)
- Port conflicts
- Database migrations
- Asset compilation
- Native dependencies

## Phase 3: Write the Skill

Create the skill file at \`.pandacc/skills/run-<project-name>/SKILL.md\` using this format:

\`\`\`markdown
---
name: run-<project-name>
description: Build and run <project-name> locally
allowed-tools:
  - Bash(*)
  - Read
when_to_use: "Use when the user wants to run, start, build, or launch the application locally. Examples: 'run it', 'start the server', 'build and run', 'launch locally'."
---

# Run <Project Name>

## Prerequisites
- List runtime requirements
- List system dependencies
- List required services

## Setup (first time only)
### 1. Install dependencies
\\\`\\\`\\\`bash
<install command>
\\\`\\\`\\\`

### 2. Configure environment
\\\`\\\`\\\`bash
<env setup, e.g. cp .env.example .env>
\\\`\\\`\\\`

**Success criteria**: Dependencies installed without errors.

## Build
\\\`\\\`\\\`bash
<build command>
\\\`\\\`\\\`

**Success criteria**: Build completes with exit code 0.

## Run
\\\`\\\`\\\`bash
<run/dev command>
\\\`\\\`\\\`

**Success criteria**: <how to verify it's running — URL to hit, expected output, etc.>

## Common Issues
- <issue>: <fix>
\`\`\`

## Phase 4: Confirm

Show the user the generated SKILL.md and ask for confirmation before saving. Mention:
- Where the skill was saved
- How to invoke it: \`/run-<project-name>\`
- That they can edit the SKILL.md to refine it
- That \`/verify\` can reference this skill for automated verification
`

export function registerRunSkillGeneratorSkill(): void {
  registerBundledSkill({
    name: 'run-skill-generator',
    description:
      'Generate a run-* skill for this project by discovering, testing, and documenting the build and run process.',
    userInvocable: true,
    async getPromptForCommand(args) {
      let prompt = RUN_SKILL_GENERATOR_PROMPT
      if (args) {
        prompt += `\n## Additional context\n\n${args}`
      }
      return [{ type: 'text', text: prompt }]
    },
  })
}
