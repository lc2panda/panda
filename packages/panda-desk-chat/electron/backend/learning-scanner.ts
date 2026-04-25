// Input: 无（隐式遍历 ~/.pandacc/projects/<slug>/）/ projectSlug+slug 单读 / projectSlug+topic 单读
// Output: LearningPlanMeta[] | LearningFlashcardSet[] | LearningPlanDetail | null
// Pos: electron main — panda CLI /learn 命令落盘数据扫描器（learning-plans + flashcards）
//
// 数据来源（panda CLI bundled skill src/skills/bundled/learn.ts）：
//   /learn plan "主题"  →  <project_cwd>/working/learning-plans/<topic-slug>.md
//   /learn from <file>  →  <project_cwd>/working/flashcards/<topic>.json
//                          + 复习日志 <project_cwd>/working/flashcards/.review-log.json
//
// 项目枚举：复用 disk-session-scanner 的 PANDACC_ROOT + desanitizeProjectPath。
//
// 一旦我被修改，请更新我的头部注释，以及所属文件夹的 README.md。

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import {
  PANDACC_ROOT,
  desanitizeProjectPath,
} from './disk-session-scanner.js';

// ─── Types（renderer 端导出对应 LearningPlanMeta / LearningFlashcardSet / LearningPlanDetail）───

/** /learn plan 学习阶段（H2 section 解析）。 */
export interface LearningStage {
  /** H2 标题（去掉 markdown 前缀）。 */
  title: string;
  /** 该阶段全文（不含标题行）。 */
  body: string;
}

/** /learn plan 引用的素材 link（来自 markdown `[xxx](xxx)` + 带 `.pdf` 的纯文本路径）。 */
export interface LearningMaterialRef {
  /** 显示文本。 */
  title: string;
  /** 链接 URL 或文件路径。 */
  source: string;
  /** 'url' = http(s) / 'pdf' = .pdf 文件 / 'note' = 其他。 */
  kind: 'url' | 'pdf' | 'note';
}

/** 学习计划列表项（带摘要）。 */
export interface LearningPlanMeta {
  /** 唯一 id：`<projectSlug>:<slug>`。 */
  id: string;
  /** 项目目录名（panda CLI sanitize 后形态）。 */
  projectSlug: string;
  /** 项目原始 cwd（desanitize 还原）。 */
  projectCwd: string;
  /** H1 标题；缺失则取文件名。 */
  title: string;
  /** 文件 slug（去 .md 后缀）。 */
  slug: string;
  /** 摘要：去掉标题后的前 240 字。 */
  excerpt: string;
  /** 创建时间（ISO，birthtime fallback mtime）。 */
  createdAt: string;
  /** 更新时间（ISO，mtime）。 */
  updatedAt: string;
  /** 解析到的素材引用数。 */
  materialCount: number;
  /** 解析到的阶段数（H2 section）。 */
  stageCount: number;
}

/** 学习计划详情（含全文 + 阶段 + 素材）。 */
export interface LearningPlanDetail extends LearningPlanMeta {
  /** Markdown 全文。 */
  content: string;
  /** 解析到的阶段列表。 */
  stages: LearningStage[];
  /** 解析到的素材引用列表。 */
  materials: LearningMaterialRef[];
}

/** 闪卡 JSON 文件原始 schema（panda CLI 输出）。 */
export interface FlashcardEntry {
  id: number;
  q: string;
  a: string;
  stability?: number;
  difficulty?: number;
  lastReview?: string | null;
  nextReview?: string | null;
}

/** 闪卡集元数据 + 计算字段。 */
export interface LearningFlashcardSet {
  /** 唯一 id：`<projectSlug>:<topic>`。 */
  id: string;
  projectSlug: string;
  projectCwd: string;
  /** 文件名（不含 .json）。 */
  topic: string;
  /** JSON 中 source 字段（原始资料路径）。 */
  source: string;
  /** JSON 中 created（ISO）。 */
  created: string;
  /** ISO（mtime）。 */
  updatedAt: string;
  /** 卡片总数。 */
  totalCount: number;
  /** 今日（含之前）到期数。 */
  dueCount: number;
  /** 已复习过的卡片数（lastReview 非空）。 */
  learningCount: number;
  /** 卡片完整列表（renderer 自行渲染）。 */
  cards: FlashcardEntry[];
  /** 该项目的复习日志（来自 .review-log.json，可能为空）。 */
  reviewLog: ReviewLogEntry[];
}

/** 复习日志条目（panda CLI .review-log.json 中每条记录）。 */
export interface ReviewLogEntry {
  /** ISO 时间戳。 */
  at: string;
  /** 卡片 id（原始 JSON 中的 id 字段）。 */
  cardId?: number;
  /** 评分：0=忘了 1=困难 2=一般 3=容易。 */
  grade?: 0 | 1 | 2 | 3;
  /** topic（按文件名）。 */
  topic?: string;
  [key: string]: unknown;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TOPIC_SLUG_PATTERN = /^[\w\u4e00-\u9fff.\- ]+$/;

/** 校验 slug/topic：阻止路径穿越。 */
function isSafeName(name: string): boolean {
  if (!name) return false;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  return TOPIC_SLUG_PATTERN.test(name);
}

/**
 * 列出所有 panda CLI 项目目录（~/.pandacc/projects/<slug>/）。
 * 返回 (slug, cwd) 对。读取失败返回空数组。
 */
async function listProjectDirs(): Promise<Array<{ slug: string; cwd: string }>> {
  let entries: string[];
  try {
    entries = await fs.readdir(PANDACC_ROOT);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[learning-scanner] readdir failed: ${PANDACC_ROOT}`, err);
    }
    return [];
  }

  const out: Array<{ slug: string; cwd: string }> = [];
  for (const slug of entries) {
    const dirPath = path.join(PANDACC_ROOT, slug);
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    out.push({ slug, cwd: desanitizeProjectPath(slug) });
  }
  return out;
}

/**
 * 从 markdown 内容中抽取 H1 标题（首个 `# xxx`）。
 * 缺失返回 null。
 */
function extractH1(content: string): string | null {
  const m = content.match(/^#\s+(.+?)\s*$/m);
  return m && m[1] ? m[1].trim() : null;
}

/**
 * 切分 H2 section 为独立 stage 数组。
 * 以 `## ` 开头的行作为分隔；首段（H1+前言）不计入 stages。
 */
function extractStages(content: string): LearningStage[] {
  const lines = content.split(/\r?\n/);
  const stages: LearningStage[] = [];
  let current: { title: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current) {
        stages.push({
          title: current.title,
          body: current.bodyLines.join('\n').trim(),
        });
      }
      current = { title: (m[1] ?? '').trim(), bodyLines: [] };
      continue;
    }
    if (current) current.bodyLines.push(line);
  }
  if (current) {
    stages.push({
      title: current.title,
      body: current.bodyLines.join('\n').trim(),
    });
  }
  return stages;
}

/**
 * 从 markdown 中提取 material 引用：
 *   1. `[显示文本](url)` 形式
 *   2. 行内带 `.pdf` 的裸路径或纯文本（fallback）
 * 同 source 去重，最多 50 条。
 */
function extractMaterials(content: string): LearningMaterialRef[] {
  const out: LearningMaterialRef[] = [];
  const seen = new Set<string>();

  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(content)) !== null) {
    const title = (match[1] ?? '').trim();
    const source = (match[2] ?? '').trim();
    if (!title || !source) continue;
    if (seen.has(source)) continue;
    seen.add(source);
    const kind: LearningMaterialRef['kind'] = /^https?:\/\//i.test(source)
      ? 'url'
      : /\.pdf(?:\?|$|#)/i.test(source)
      ? 'pdf'
      : 'note';
    out.push({ title, source, kind });
    if (out.length >= 50) return out;
  }

  // Fallback：行内裸 .pdf 路径（仅接受 ASCII 文件名 — 避免吞掉「论文：xxx.pdf」前缀汉字）
  const pdfRe = /(?:^|[\s(])([A-Za-z0-9_./\-]+\.pdf)(?=[\s)]|$)/gm;
  while ((match = pdfRe.exec(content)) !== null) {
    const source = (match[1] ?? '').trim();
    if (!source || seen.has(source)) continue;
    seen.add(source);
    out.push({ title: path.basename(source), source, kind: 'pdf' });
    if (out.length >= 50) return out;
  }

  return out;
}

/**
 * 生成摘要：剔除 H1 后的前 240 字（按行 join），超出 trim 加省略号。
 */
function buildExcerpt(content: string): string {
  const noH1 = content.replace(/^#\s+.*$/m, '').trim();
  const text = noH1.replace(/\s+/g, ' ').trim();
  if (text.length <= 240) return text;
  return text.slice(0, 240).trimEnd() + '…';
}

/**
 * 读 <project_cwd>/working/flashcards/.review-log.json（若存在）。
 * 兼容三种 schema：数组直接形态 / { entries: [...] } / { logs: [...] }。
 *
 * 注意：参数 cwd 是项目原始工作目录（已 desanitize），需自行拼 working/flashcards。
 */
async function readReviewLog(cwd: string): Promise<ReviewLogEntry[]> {
  const filePath = path.join(cwd, 'working', 'flashcards', '.review-log.json');
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[learning-scanner] readReviewLog failed: ${filePath}`, err);
    }
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ReviewLogEntry[];
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.entries)) return obj.entries as ReviewLogEntry[];
      if (Array.isArray(obj.logs)) return obj.logs as ReviewLogEntry[];
    }
    return [];
  } catch (err) {
    console.warn(`[learning-scanner] review-log JSON parse failed: ${filePath}`, err);
    return [];
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * 扫所有 panda CLI 项目下的 working/learning-plans/*.md。
 * 任一项目读取失败均跳过，确保单点损坏不阻塞列表。
 * 排序：updatedAt DESC。
 */
export async function scanLearningPlans(): Promise<LearningPlanMeta[]> {
  const projects = await listProjectDirs();
  const out: LearningPlanMeta[] = [];

  for (const { slug, cwd } of projects) {
    const dir = path.join(cwd, 'working', 'learning-plans');
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        console.warn(`[learning-scanner] readdir plans failed: ${dir}`, err);
      }
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const planSlug = file.slice(0, -'.md'.length);
      if (!isSafeName(planSlug)) continue;

      const filePath = path.join(dir, file);
      let stat: Awaited<ReturnType<typeof fs.stat>>;
      let content: string;
      try {
        stat = await fs.stat(filePath);
        content = await fs.readFile(filePath, 'utf-8');
      } catch (err) {
        console.warn(`[learning-scanner] read plan failed: ${filePath}`, err);
        continue;
      }

      const title = extractH1(content) ?? planSlug;
      const stages = extractStages(content);
      const materials = extractMaterials(content);
      const excerpt = buildExcerpt(content);

      out.push({
        id: `${slug}:${planSlug}`,
        projectSlug: slug,
        projectCwd: cwd,
        title,
        slug: planSlug,
        excerpt,
        createdAt: (stat.birthtime ?? stat.mtime).toISOString(),
        updatedAt: stat.mtime.toISOString(),
        materialCount: materials.length,
        stageCount: stages.length,
      });
    }
  }

  out.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return out;
}

/**
 * 扫所有 panda CLI 项目下的 working/flashcards/*.json（排除 .review-log.json）。
 * 每个 set 计算 dueCount / learningCount / totalCount，附带项目级 reviewLog。
 * 排序：updatedAt DESC。
 */
export async function scanFlashcards(): Promise<LearningFlashcardSet[]> {
  const projects = await listProjectDirs();
  const out: LearningFlashcardSet[] = [];
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  for (const { slug, cwd } of projects) {
    const dir = path.join(cwd, 'working', 'flashcards');
    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        console.warn(`[learning-scanner] readdir flashcards failed: ${dir}`, err);
      }
      continue;
    }

    // 项目级 review log（同一项目所有 set 共享）
    const reviewLog = await readReviewLog(cwd);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      if (file.startsWith('.')) continue; // 跳 .review-log.json 等隐藏
      const topic = file.slice(0, -'.json'.length);
      if (!isSafeName(topic)) continue;

      const filePath = path.join(dir, file);
      let stat: Awaited<ReturnType<typeof fs.stat>>;
      let raw: string;
      try {
        stat = await fs.stat(filePath);
        raw = await fs.readFile(filePath, 'utf-8');
      } catch (err) {
        console.warn(`[learning-scanner] read flashcard failed: ${filePath}`, err);
        continue;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch (err) {
        console.warn(`[learning-scanner] flashcard JSON parse failed: ${filePath}`, err);
        continue;
      }

      const cardsRaw = Array.isArray(parsed.cards) ? parsed.cards : [];
      const cards: FlashcardEntry[] = [];
      for (const c of cardsRaw) {
        if (!c || typeof c !== 'object') continue;
        const obj = c as Record<string, unknown>;
        const id = typeof obj.id === 'number' ? obj.id : Number(obj.id);
        const q = typeof obj.q === 'string' ? obj.q : '';
        const a = typeof obj.a === 'string' ? obj.a : '';
        if (!Number.isFinite(id) || !q) continue;
        cards.push({
          id,
          q,
          a,
          ...(typeof obj.stability === 'number' ? { stability: obj.stability } : {}),
          ...(typeof obj.difficulty === 'number' ? { difficulty: obj.difficulty } : {}),
          ...(typeof obj.lastReview === 'string' || obj.lastReview === null
            ? { lastReview: obj.lastReview as string | null }
            : {}),
          ...(typeof obj.nextReview === 'string' || obj.nextReview === null
            ? { nextReview: obj.nextReview as string | null }
            : {}),
        });
      }

      let dueCount = 0;
      let learningCount = 0;
      for (const c of cards) {
        if (typeof c.nextReview === 'string' && c.nextReview && c.nextReview <= todayStr) {
          dueCount += 1;
        }
        if (typeof c.lastReview === 'string' && c.lastReview) {
          learningCount += 1;
        }
      }

      out.push({
        id: `${slug}:${topic}`,
        projectSlug: slug,
        projectCwd: cwd,
        topic: typeof parsed.topic === 'string' && parsed.topic ? parsed.topic : topic,
        source: typeof parsed.source === 'string' ? parsed.source : '',
        created: typeof parsed.created === 'string' ? parsed.created : stat.mtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
        totalCount: cards.length,
        dueCount,
        learningCount,
        cards,
        reviewLog: reviewLog.filter(
          (r) => !r.topic || r.topic === topic, // 只挂同 topic 或全局未标 topic
        ),
      });
    }
  }

  out.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return out;
}

/**
 * 读取单个学习计划详情（markdown 全文 + 阶段 + 素材）。
 * 校验 projectSlug / slug 安全，避免路径穿越。
 */
export async function readPlan(
  projectSlug: string,
  slug: string,
): Promise<LearningPlanDetail | null> {
  if (!isSafeName(projectSlug) || !isSafeName(slug)) return null;

  const cwd = desanitizeProjectPath(projectSlug);
  const filePath = path.join(cwd, 'working', 'learning-plans', `${slug}.md`);

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  let content: string;
  try {
    stat = await fs.stat(filePath);
    content = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[learning-scanner] readPlan failed: ${filePath}`, err);
    }
    return null;
  }

  const title = extractH1(content) ?? slug;
  const stages = extractStages(content);
  const materials = extractMaterials(content);
  const excerpt = buildExcerpt(content);

  return {
    id: `${projectSlug}:${slug}`,
    projectSlug,
    projectCwd: cwd,
    title,
    slug,
    excerpt,
    createdAt: (stat.birthtime ?? stat.mtime).toISOString(),
    updatedAt: stat.mtime.toISOString(),
    materialCount: materials.length,
    stageCount: stages.length,
    content,
    stages,
    materials,
  };
}

/**
 * 读取单个闪卡集（含完整 cards 数组 + 项目级 reviewLog）。
 * 校验 projectSlug / topic 安全，避免路径穿越。
 */
export async function readFlashcards(
  projectSlug: string,
  topic: string,
): Promise<LearningFlashcardSet | null> {
  if (!isSafeName(projectSlug) || !isSafeName(topic)) return null;

  const cwd = desanitizeProjectPath(projectSlug);
  const filePath = path.join(cwd, 'working', 'flashcards', `${topic}.json`);

  let stat: Awaited<ReturnType<typeof fs.stat>>;
  let raw: string;
  try {
    stat = await fs.stat(filePath);
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(`[learning-scanner] readFlashcards failed: ${filePath}`, err);
    }
    return null;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    console.warn(`[learning-scanner] flashcard JSON parse failed: ${filePath}`, err);
    return null;
  }

  const cardsRaw = Array.isArray(parsed.cards) ? parsed.cards : [];
  const cards: FlashcardEntry[] = [];
  for (const c of cardsRaw) {
    if (!c || typeof c !== 'object') continue;
    const obj = c as Record<string, unknown>;
    const id = typeof obj.id === 'number' ? obj.id : Number(obj.id);
    const q = typeof obj.q === 'string' ? obj.q : '';
    const a = typeof obj.a === 'string' ? obj.a : '';
    if (!Number.isFinite(id) || !q) continue;
    cards.push({
      id,
      q,
      a,
      ...(typeof obj.stability === 'number' ? { stability: obj.stability } : {}),
      ...(typeof obj.difficulty === 'number' ? { difficulty: obj.difficulty } : {}),
      ...(typeof obj.lastReview === 'string' || obj.lastReview === null
        ? { lastReview: obj.lastReview as string | null }
        : {}),
      ...(typeof obj.nextReview === 'string' || obj.nextReview === null
        ? { nextReview: obj.nextReview as string | null }
        : {}),
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  let dueCount = 0;
  let learningCount = 0;
  for (const c of cards) {
    if (typeof c.nextReview === 'string' && c.nextReview && c.nextReview <= todayStr) {
      dueCount += 1;
    }
    if (typeof c.lastReview === 'string' && c.lastReview) {
      learningCount += 1;
    }
  }

  const reviewLog = await readReviewLog(cwd);

  return {
    id: `${projectSlug}:${topic}`,
    projectSlug,
    projectCwd: cwd,
    topic: typeof parsed.topic === 'string' && parsed.topic ? parsed.topic : topic,
    source: typeof parsed.source === 'string' ? parsed.source : '',
    created: typeof parsed.created === 'string' ? parsed.created : stat.mtime.toISOString(),
    updatedAt: stat.mtime.toISOString(),
    totalCount: cards.length,
    dueCount,
    learningCount,
    cards,
    reviewLog: reviewLog.filter((r) => !r.topic || r.topic === topic),
  };
}
