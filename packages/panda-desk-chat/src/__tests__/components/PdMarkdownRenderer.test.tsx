// Input: PdMarkdownRenderer markdown content prop
// Output: Bug D F1+F2 回归覆盖
// Pos: v2.27.0 Bug D 单元回归层
//
// 验证两条关键修复：
//   1) 空 fence（```\n```）不应渲染 PdCodeViewer 占位框（streaming 闪烁修复）
//   2) extractText 使用 \n\n 拼接多 text block（chatStore.ts:1115），段落 br/edge 保留
//      —— 这里通过 react-markdown 输出验证「双换行」被解析成两段独立 <p>，而单换行
//         仅产生一个 <p> 内的换行/合并文本。
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PdMarkdownRenderer } from '../../components/chat/PdMarkdownRenderer';

describe('PdMarkdownRenderer — Bug D F2: empty code fence', () => {
  it('应在空 fence 内容下返回 null，不渲染 PdCodeViewer 框', () => {
    const html = renderToStaticMarkup(<PdMarkdownRenderer content={'\n\n```\n```\n'} />);
    // PdCodeViewer 渲染时会包一层 my-4 div + code 容器；空 fence 早退后不应出现。
    expect(html).not.toContain('my-4');
    // 内联 inline-code 也不应被错误匹配
    expect(html).not.toMatch(/<code[^>]*>\s*<\/code>/);
  });

  it('正常含内容的 fence 仍应渲染 PdCodeViewer', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'```ts\nconst x = 1\n```'} />,
    );
    // PdCodeViewer 真实输出包含语言标签或 border 样式
    expect(html.length).toBeGreaterThan(50);
    expect(html).toMatch(/border|bg-|text-|console\.log/);
  });
});

describe('PdMarkdownRenderer — Bug D F1: \\n\\n 段落分隔', () => {
  it('双换行应解析为两个独立段落', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'第一段\n\n第二段'} />,
    );
    // react-markdown + remark-gfm 在 \n\n 输入下应输出 2 个 <p>
    const paragraphCount = (html.match(/<p[\s>]/g) ?? []).length;
    expect(paragraphCount).toBe(2);
  });

  it('单换行仅产生 1 个段落（用作 \\n\\n 修复的对照）', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'第一段\n第二段'} />,
    );
    const paragraphCount = (html.match(/<p[\s>]/g) ?? []).length;
    expect(paragraphCount).toBe(1);
  });
});
