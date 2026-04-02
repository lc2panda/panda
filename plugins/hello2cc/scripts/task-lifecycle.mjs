#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateTaskDefinition } from './lib/task-quality.mjs';

function readStdinJson() {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    process.stderr.write(`task-lifecycle.mjs: failed to parse stdin JSON: ${error.message}\n`);
    return {};
  }
}

const payload = readStdinJson();
const feedback = validateTaskDefinition(payload);

if (feedback) {
  process.stderr.write(`${feedback} Tighten the task spec or completion evidence before marking it done.\n`);
  process.exit(2);
}

