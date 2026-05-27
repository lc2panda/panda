// Input: PdMarkdownRenderer markdown content prop（mermaid fence/无 lang 但起首关键字/普通 code）
// Output: v2.27.0 P1 Mermaid 分支识别回归覆盖
// Pos: v2.27.0 P1 Mermaid 单元回归层（独立文件，与 PdMarkdownRenderer.test.tsx 隔离）
//
// 验证三条关键行为：
//   1) lang='mermaid' 显式 fence → 走 PdMermaidRenderer
//   2) 无 lang 但内容以 mermaid 关键字起首（graph/flowchart/...）→ 走 PdMermaidRenderer
//   3) 普通 ```ts code block → 走 PdCodeViewer，不误识别为 mermaid
//
// 实现说明：vitest test environment 是 'node'，react-markdown 在 SSR 同步路径下
// 内部走异步管线，pre/code override 不会被同步触发。为可靠测试 PdMarkdownRenderer
// 内的 mermaid 分支逻辑，mock react-markdown 让 components.pre 被同步调用一次，
// 输入按 fence 字面分词为 <pre><code class="language-X">...code...</code></pre>，
// 复刻 react-markdown 在真实运行时给 pre override 的入参形态。
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-markdown', () => ({
  default: ({ children, components }: { children: string; components: any }) => {
    const text = String(children ?? '');
    const m = text.match(/^```(\w*)\n([\s\S]*?)\n?```\s*$/);
    if (m && components?.pre) {
      const lang = m[1] || undefined;
      const code = m[2];
      const codeNode = React.createElement(
        'code',
        { className: lang ? `language-${lang}` : undefined },
        code,
      );
      return components.pre({ children: codeNode, node: codeNode }) as any;
    }
    return React.createElement('div', null, text);
  },
}));

import { PdMarkdownRenderer } from '../../components/chat/PdMarkdownRenderer';

describe('PdMarkdownRenderer — v2.27.0 P1: Mermaid 分支识别', () => {
  it('显式 ```mermaid fence 应走 PdMermaidRenderer（命中 placeholder "Rendering diagram..."）', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'```mermaid\ngraph TD\nA-->B\n```'} />,
    );
    expect(html).toContain('Rendering diagram');
    expect(html).not.toContain('code-viewer-area');
  });

  it('无 lang 但内容以 mermaid 关键字 graph 起首应走 PdMermaidRenderer', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'```\ngraph TD\nA-->B\n```'} />,
    );
    expect(html).toContain('Rendering diagram');
    expect(html).not.toContain('code-viewer-area');
  });

  it('无 lang 但内容以 mermaid 关键字 sequenceDiagram 起首应走 PdMermaidRenderer', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'```\nsequenceDiagram\nA->>B: hi\n```'} />,
    );
    expect(html).toContain('Rendering diagram');
  });

  it('普通 ```ts code block 不应走 PdMermaidRenderer（PdCodeViewer 回归保险）', () => {
    const html = renderToStaticMarkup(
      <PdMarkdownRenderer content={'```ts\nconst x = 1\n```'} />,
    );
    expect(html).not.toContain('Rendering diagram');
    expect(html).toContain('code-viewer-area');
    expect(html).toContain('language-ts');
  });
});
