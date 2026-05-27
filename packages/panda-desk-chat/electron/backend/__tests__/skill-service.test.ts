// Input: skill-service.ts 的单元测试
// Output: listSkills / getSkill 功能验证
// Pos: electron/backend/__tests__ — skill-service 单元测试

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'panda-skill-test-'));
  process.env['PANDA_CONFIG_DIR'] = tmpDir;
  await fs.mkdir(path.join(tmpDir, 'skills'), { recursive: true });
});

afterEach(async () => {
  delete process.env['PANDA_CONFIG_DIR'];
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function loadService() {
  return import('../skill-service?v=' + Date.now());
}

async function createSkill(name: string, frontmatter: string, body = '# Body') {
  const dir = path.join(tmpDir, 'skills', name);
  await fs.mkdir(dir, { recursive: true });
  const content = `---\n${frontmatter}\n---\n\n${body}`;
  await fs.writeFile(path.join(dir, 'SKILL.md'), content);
  return dir;
}

describe('listSkills', () => {
  it('skills 目录不存在时返回空列表', async () => {
    await fs.rm(path.join(tmpDir, 'skills'), { recursive: true });
    const { listSkills } = await loadService();
    const result = await listSkills();
    expect(result).toEqual([]);
  });

  it('空 skills 目录返回空列表', async () => {
    const { listSkills } = await loadService();
    const result = await listSkills();
    expect(result).toEqual([]);
  });

  it('扫描 skills 目录并解析 frontmatter', async () => {
    await createSkill(
      'browser-mcp',
      'name: "Browser MCP"\ndescription: "Browser automation skill"\nversion: "1.0.0"',
    );
    await createSkill(
      'feishu-calendar',
      'name: "Feishu Calendar"\ndescription: "Feishu calendar skill"',
    );
    const { listSkills } = await loadService();
    const result = await listSkills();
    expect(result.length).toBe(2);
    const names = result.map((s: import('../skill-service').SkillServiceItem) => s.name).sort();
    expect(names).toEqual(['browser-mcp', 'feishu-calendar']);
  });

  it('解析 description 和 version 字段', async () => {
    await createSkill(
      'test-skill',
      'description: "Test skill description"\nversion: "2.0.0"',
    );
    const { listSkills } = await loadService();
    const result = await listSkills();
    const skill = result.find((s: import('../skill-service').SkillServiceItem) => s.name === 'test-skill')!;
    expect(skill.description).toBe('Test skill description');
    expect(skill.version).toBe('2.0.0');
    expect(skill.hasSkillMd).toBe(true);
  });

  it('跳过无 SKILL.md 的目录（仍作为条目列出）', async () => {
    const dir = path.join(tmpDir, 'skills', 'no-md-skill');
    await fs.mkdir(dir, { recursive: true });
    const { listSkills } = await loadService();
    const result = await listSkills();
    expect(result.length).toBe(1);
    expect(result[0]!.name).toBe('no-md-skill');
    expect(result[0]!.hasSkillMd).toBe(false);
  });
});

describe('getSkill', () => {
  it('不存在的 skill 返回 null', async () => {
    const { getSkill } = await loadService();
    expect(await getSkill('nonexistent')).toBeNull();
  });

  it('返回 SKILL.md 内容和 body', async () => {
    await createSkill(
      'my-skill',
      'description: "My skill"\nversion: "1.2.3"',
      '## Usage\nJust use it.',
    );
    const { getSkill } = await loadService();
    const detail = await getSkill('my-skill');
    expect(detail).not.toBeNull();
    expect(detail!.description).toBe('My skill');
    expect(detail!.version).toBe('1.2.3');
    expect(detail!.body).toContain('## Usage');
    expect(detail!.rawContent).toContain('---');
  });

  it('_meta.json 存在时解析 meta', async () => {
    await createSkill('meta-skill', 'description: "With meta"');
    await fs.writeFile(
      path.join(tmpDir, 'skills', 'meta-skill', '_meta.json'),
      JSON.stringify({ slug: 'meta-skill', version: '1.0.0', ownerId: 'user123' }),
    );
    const { getSkill } = await loadService();
    const detail = await getSkill('meta-skill');
    expect(detail!.meta).toBeDefined();
    expect(detail!.meta!['slug']).toBe('meta-skill');
    expect(detail!.meta!['ownerId']).toBe('user123');
  });
});
