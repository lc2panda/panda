// Input: mocked fs.readFile responses
// Output: OAuthStatus assertions for getOAuthStatus()
// Pos: unit test for electron/backend/oauth-service.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:fs/promises before importing the module under test
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: () => '/home/test',
}));

import { readFile } from 'node:fs/promises';
import { getOAuthStatus } from '../oauth-service';

const mockReadFile = readFile as ReturnType<typeof vi.fn>;

const VALID_ACCOUNT = {
  accountUuid: 'uuid-1234',
  emailAddress: 'user@example.com',
  displayName: 'Test User',
  organizationUuid: 'org-uuid',
  organizationName: 'Test Org',
  organizationRole: 'member',
  subscriptionCreatedAt: '2025-01-01T00:00:00Z',
  billingType: 'pro',
  hasExtraUsageEnabled: true,
};

describe('getOAuthStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns authenticated=true with mapped fields when oauthAccount is present', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({ oauthAccount: VALID_ACCOUNT }),
    );

    const result = await getOAuthStatus('/home/test/.pandacc');

    expect(result.authenticated).toBe(true);
    if (!result.authenticated) throw new Error('expected authenticated');
    expect(result.source).toBe('config');
    expect(result.email).toBe('user@example.com');
    expect(result.displayName).toBe('Test User');
    expect(result.organizationName).toBe('Test Org');
    expect(result.accountUuid).toBe('uuid-1234');
    expect(result.subscriptionCreatedAt).toBe('2025-01-01T00:00:00Z');
    expect(result.billingType).toBe('pro');
    expect(result.hasExtraUsageEnabled).toBe(true);
  });

  it('returns authenticated=false reason=no-oauthAccount when field is missing', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({ someOtherKey: 42 }));

    const result = await getOAuthStatus('/home/test/.pandacc');

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error('expected not authenticated');
    expect(result.source).toBe('none');
    expect(result.reason).toBe('no-oauthAccount');
  });

  it('returns authenticated=false reason=no-config when file does not exist', async () => {
    const err = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    mockReadFile.mockRejectedValueOnce(err);

    const result = await getOAuthStatus('/home/test/.pandacc');

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error('expected not authenticated');
    expect(result.reason).toBe('no-config');
  });

  it('returns authenticated=false reason=parse-error when JSON is malformed', async () => {
    mockReadFile.mockResolvedValueOnce('{ not valid json @@@ }');

    const result = await getOAuthStatus('/home/test/.pandacc');

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error('expected not authenticated');
    expect(result.reason).toBe('parse-error');
  });

  it('uses default ~/.pandacc.json path when configDir is omitted', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({}));

    await getOAuthStatus(); // no arg → homedir() + '/.pandacc.json'

    expect(mockReadFile).toHaveBeenCalledWith('/home/test/.pandacc.json', 'utf-8');
  });

  it('returns authenticated=false reason=no-oauthAccount when oauthAccount is null', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({ oauthAccount: null }));

    const result = await getOAuthStatus('/home/test/.pandacc');

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error('expected not authenticated');
    expect(result.reason).toBe('no-oauthAccount');
  });

  it('returns authenticated=false reason=no-oauthAccount when emailAddress is missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({ oauthAccount: { accountUuid: 'uid' } }), // no emailAddress
    );

    const result = await getOAuthStatus('/home/test/.pandacc');

    expect(result.authenticated).toBe(false);
    if (result.authenticated) throw new Error('expected not authenticated');
    expect(result.reason).toBe('no-oauthAccount');
  });
});
