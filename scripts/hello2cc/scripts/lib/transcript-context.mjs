import { existsSync, readFileSync } from 'node:fs';
import {
  deriveAgentCapabilities,
  deriveToolCapabilities,
  normalizeAgentTypes,
  normalizeToolNames,
} from './session-capabilities.mjs';

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function normalizePath(path) {
  return String(path || '').trim();
}

function recordSessionId(record) {
  return String(record?.session_id || record?.sessionId || '').trim();
}

function isSessionSystemRecord(record, sessionId) {
  if (!record || record.type !== 'system') return false;
  if (sessionId && recordSessionId(record) && recordSessionId(record) !== sessionId) {
    return false;
  }

  return true;
}

function isSessionRecord(record, sessionId) {
  if (!record || typeof record !== 'object') return false;
  if (sessionId && recordSessionId(record) && recordSessionId(record) !== sessionId) {
    return false;
  }

  return true;
}

function sessionSnapshotFromRecord(record) {
  if (!record || typeof record !== 'object') return {};

  const mainModel = String(record.model || '').trim();
  const outputStyle = String(record.output_style || '').trim();
  const toolNames = normalizeToolNames(record.tools);
  const agentTypes = normalizeAgentTypes(record.agents);

  return {
    ...(mainModel ? { mainModel } : {}),
    ...(outputStyle ? { outputStyle } : {}),
    ...(toolNames.length ? { toolNames } : {}),
    ...(agentTypes.length ? { agentTypes } : {}),
    ...(toolNames.length ? deriveToolCapabilities(toolNames) : {}),
    ...(agentTypes.length ? deriveAgentCapabilities(agentTypes) : {}),
  };
}

function teamSnapshotFromRecord(record) {
  if (!record || typeof record !== 'object') return {};

  const teamName = String(record.teamName || record.team_name || '').trim();
  const agentName = String(record.agentName || record.agent_name || '').trim();

  return {
    ...(teamName ? { teamName } : {}),
    ...(agentName ? { agentName } : {}),
  };
}

export function extractSessionContextFromTranscript(transcriptPath, sessionId = '') {
  const path = normalizePath(transcriptPath);
  if (!path || !existsSync(path)) return {};

  try {
    const raw = readFileSync(path, 'utf8');
    const records = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map(parseJsonLine)
      .filter(Boolean);

    let best = {};
    for (const record of records) {
      if (!isSessionRecord(record, String(sessionId || '').trim())) continue;

      const teamSnapshot = teamSnapshotFromRecord(record);
      if (Object.keys(teamSnapshot).length > 0) {
        best = {
          ...best,
          ...teamSnapshot,
        };
      }

      if (!isSessionSystemRecord(record, String(sessionId || '').trim())) continue;

      const snapshot = sessionSnapshotFromRecord(record);
      if (Object.keys(snapshot).length === 0) continue;
      best = {
        ...best,
        ...snapshot,
      };
    }

    return best;
  } catch {
    return {};
  }
}
