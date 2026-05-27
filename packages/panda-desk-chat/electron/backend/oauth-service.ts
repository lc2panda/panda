// Input: configDir path (default ~/.pandacc), reads <configDir>.json
// Output: OAuthStatus — authenticated + account fields, or unauthenticated + reason
// Pos: electron/backend — read-only accessor for panda-cli written ~/.pandacc.json oauthAccount.
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ─── Public types ────────────────────────────────────────────────────────────

export type OAuthStatusAuthenticated = {
  authenticated: true;
  source: 'config';
  email: string;
  displayName: string;
  organizationName: string;
  accountUuid: string;
  subscriptionCreatedAt?: string;
  billingType?: string;
  hasExtraUsageEnabled?: boolean;
};

export type OAuthStatusUnauthenticated = {
  authenticated: false;
  source: 'none';
  reason: 'no-config' | 'no-oauthAccount' | 'parse-error';
};

export type OAuthStatus = OAuthStatusAuthenticated | OAuthStatusUnauthenticated;

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Read panda-cli's ~/.pandacc.json and extract the top-level `oauthAccount`
 * object to determine current login state.
 *
 * MVP scope: read-only, no Keychain access, no OAuth flow.
 * Failures always return { authenticated: false } — never throws.
 *
 * @param configDir  Base config directory (default: ~/.pandacc).
 *                   Config file is read from `<configDir>.json` (e.g. ~/.pandacc.json).
 */
export async function getOAuthStatus(configDir?: string): Promise<OAuthStatus> {
  const baseDir = configDir ?? join(homedir(), '.pandacc');
  // panda-cli stores account info in <configDir>.json (sibling file, not inside dir)
  const configFile = `${baseDir}.json`;

  let raw: string;
  try {
    raw = await readFile(configFile, 'utf-8');
  } catch {
    return { authenticated: false, source: 'none', reason: 'no-config' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { authenticated: false, source: 'none', reason: 'parse-error' };
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('oauthAccount' in parsed)
  ) {
    return { authenticated: false, source: 'none', reason: 'no-oauthAccount' };
  }

  const acct = (parsed as Record<string, unknown>).oauthAccount;

  if (
    typeof acct !== 'object' ||
    acct === null ||
    typeof (acct as Record<string, unknown>).emailAddress !== 'string' ||
    typeof (acct as Record<string, unknown>).accountUuid !== 'string'
  ) {
    return { authenticated: false, source: 'none', reason: 'no-oauthAccount' };
  }

  const a = acct as Record<string, unknown>;

  return {
    authenticated: true,
    source: 'config',
    accountUuid: a.accountUuid as string,
    email: a.emailAddress as string,
    displayName: typeof a.displayName === 'string' ? a.displayName : '',
    organizationName: typeof a.organizationName === 'string' ? a.organizationName : '',
    subscriptionCreatedAt:
      typeof a.subscriptionCreatedAt === 'string' ? a.subscriptionCreatedAt : undefined,
    billingType: typeof a.billingType === 'string' ? a.billingType : undefined,
    hasExtraUsageEnabled:
      typeof a.hasExtraUsageEnabled === 'boolean' ? a.hasExtraUsageEnabled : undefined,
  };
}
