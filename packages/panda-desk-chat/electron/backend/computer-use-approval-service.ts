// Input:  ApprovalRequest { action, payload, sessionId?, risk } + ~/.pandacc/computer-use-policy.json
// Output: ApprovalResult { approved, reason } — policy decision or pending IPC prompt (30s timeout)
// Pos:    Desk Chat backend gate for all computer-use actions; called by future v2.28+ integration
import fs from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComputerUseAction = 'click' | 'keystroke' | 'screenshot' | 'open-app' | 'execute';
export type ComputerUseRisk = 'low' | 'medium' | 'high';
export type PolicyAction = 'allow' | 'deny' | 'prompt';
export type ApprovalReason = 'auto-allow' | 'auto-deny' | 'user-approved' | 'user-denied' | 'timeout';

export interface ApprovalRequest {
  action: ComputerUseAction;
  payload: unknown;
  sessionId?: string;
  risk: ComputerUseRisk;
}

export interface ApprovalResult {
  approved: boolean;
  reason: ApprovalReason;
}

export interface ComputerUsePolicy {
  defaultAction: PolicyAction;
  perActionRules: Partial<Record<ComputerUseAction, PolicyAction>>;
  sessionWhitelist: string[];
}

const POLICY_PATH = path.join(os.homedir(), '.pandacc', 'computer-use-policy.json');

const DEFAULT_POLICY: ComputerUsePolicy = {
  defaultAction: 'deny',
  perActionRules: {},
  sessionWhitelist: [],
};

const APPROVAL_TIMEOUT_MS = 30_000;

// ─── Internal pending map: requestId → resolve fn ────────────────────────────

interface PendingEntry {
  resolve: (result: ApprovalResult) => void;
  timer: ReturnType<typeof setTimeout>;
}

class ComputerUseApprovalService extends EventEmitter {
  private _pending = new Map<string, PendingEntry>();
  private _requestCounter = 0;

  // ─── Policy I/O ─────────────────────────────────────────────────────────────

  async getPolicy(): Promise<ComputerUsePolicy> {
    try {
      if (!fs.existsSync(POLICY_PATH)) {
        return { ...DEFAULT_POLICY, perActionRules: {}, sessionWhitelist: [] };
      }
      const raw = fs.readFileSync(POLICY_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ComputerUsePolicy>;
      return {
        defaultAction: parsed.defaultAction ?? DEFAULT_POLICY.defaultAction,
        perActionRules: parsed.perActionRules ?? {},
        sessionWhitelist: parsed.sessionWhitelist ?? [],
      };
    } catch {
      return { ...DEFAULT_POLICY, perActionRules: {}, sessionWhitelist: [] };
    }
  }

  async updatePolicy(policy: ComputerUsePolicy): Promise<{ ok: boolean }> {
    try {
      const dir = path.dirname(POLICY_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(POLICY_PATH, JSON.stringify(policy, null, 2), 'utf8');
      return { ok: true };
    } catch (err) {
      return { ok: false };
    }
  }

  // ─── Approval gate ──────────────────────────────────────────────────────────

  async requestApproval(input: ApprovalRequest): Promise<ApprovalResult> {
    const policy = await this.getPolicy();

    // Session whitelist check: whitelisted sessions get auto-allow regardless of policy
    if (input.sessionId && policy.sessionWhitelist.includes(input.sessionId)) {
      return { approved: true, reason: 'auto-allow' };
    }

    // Resolve effective action from per-action rule or default
    const effective: PolicyAction =
      policy.perActionRules[input.action] ?? policy.defaultAction;

    if (effective === 'allow') {
      return { approved: true, reason: 'auto-allow' };
    }

    if (effective === 'deny') {
      return { approved: false, reason: 'auto-deny' };
    }

    // effective === 'prompt' → emit IPC event and wait up to APPROVAL_TIMEOUT_MS
    return this._waitForUserDecision(input);
  }

  // ─── IPC response entry-point (called by handler when renderer responds) ───

  respondToApproval(requestId: string, approved: boolean): void {
    const entry = this._pending.get(requestId);
    if (!entry) return;
    clearTimeout(entry.timer);
    this._pending.delete(requestId);
    entry.resolve({
      approved,
      reason: approved ? 'user-approved' : 'user-denied',
    });
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private _waitForUserDecision(input: ApprovalRequest): Promise<ApprovalResult> {
    const requestId = `cu-${Date.now()}-${++this._requestCounter}`;

    return new Promise<ApprovalResult>((resolve) => {
      const timer = setTimeout(() => {
        this._pending.delete(requestId);
        resolve({ approved: false, reason: 'timeout' });
      }, APPROVAL_TIMEOUT_MS);

      this._pending.set(requestId, { resolve, timer });

      // Emit event so ipcMain can forward to renderer
      this.emit('approval-requested', { requestId, ...input });
    });
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────
export const computerUseApprovalService = new ComputerUseApprovalService();
