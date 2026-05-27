import { describe, expect, it } from 'vitest';

/**
 * v2.27.2 Bug H 真补：production smoke test
 *
 * 验证 await import('mermaid') 真能拿到 default export，不再走 fallback。
 * v2.27.1 之前用 Function('s','return import(s)') 黑魔法，让 Vite 静态分析
 * 找不到字面量，packaged 构建里完全没有 mermaid chunk → packaged 100% 失效。
 * 本测试用真实 await import('mermaid')，不 mock，保证字面量被 Vite/Vitest 解析到。
 */
describe('Bug H 真补：标准字面量 await import("mermaid") 不再黑魔法', () => {
  it('真实 await import("mermaid") 能拿到 default export，且 mermaid.render 可用', async () => {
    const mod = await import('mermaid');
    expect(mod).toBeTruthy();
    const instance = (mod as any).default ?? mod;
    expect(instance).toBeTruthy();
    expect(typeof instance.render).toBe('function');
    expect(typeof instance.initialize).toBe('function');
  });

  it('mermaid 暴露的 API 与 PdMermaidRenderer.loadMermaid() 类型契约对齐', async () => {
    const mod = await import('mermaid');
    const instance = (mod as any).default ?? mod;
    // PdMermaidRenderer 依赖：initialize / render，二者必须为 function
    expect(instance.initialize).toBeInstanceOf(Function);
    expect(instance.render).toBeInstanceOf(Function);
  });
});
