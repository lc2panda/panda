// Input:  MCPTool.mapToolResultToToolResultBlockParam(各种格式的 content)
// Output: ToolResultBlockParam 验证 — 确保防御性处理包装/非包装内容
// Pos:    src/tools/MCPTool/MCPTool.test.ts — unit tests for MCP 工具结果映射

import { describe, expect, test } from 'bun:test';
import { MCPTool } from './MCPTool';

describe('MCPTool.mapToolResultToToolResultBlockParam', () => {
  const toolUseID = 'test_tool_use_123';

  test('should handle direct MCP content array (standard format)', () => {
    const directContent = [
      { type: 'text' as const, text: 'Hello from MCP tool' }
    ];

    const result = MCPTool.mapToolResultToToolResultBlockParam(directContent, toolUseID);

    expect(result).toEqual({
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: directContent,
    });
  });

  test('should unwrap {data: content} structure from call method', () => {
    const wrappedContent = {
      data: [
        { type: 'text' as const, text: 'Wrapped content' }
      ],
      mcpMeta: { server: 'test-server' }
    };

    const result = MCPTool.mapToolResultToToolResultBlockParam(wrappedContent, toolUseID);

    expect(result).toEqual({
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: wrappedContent.data, // Should unwrap to just the data
    });
  });

  test('should unwrap {data: content} without mcpMeta', () => {
    const wrappedContent = {
      data: [
        { type: 'text' as const, text: 'No meta' }
      ]
    };

    const result = MCPTool.mapToolResultToToolResultBlockParam(wrappedContent, toolUseID);

    expect(result.content).toEqual(wrappedContent.data);
  });

  test('should handle empty content array', () => {
    const emptyContent: any[] = [];

    const result = MCPTool.mapToolResultToToolResultBlockParam(emptyContent, toolUseID);

    expect(result.content).toEqual([]);
  });

  test('should handle string content (edge case)', () => {
    const stringContent = 'Plain string response';

    const result = MCPTool.mapToolResultToToolResultBlockParam(stringContent, toolUseID);

    expect(result.content).toBe(stringContent);
  });

  test('should handle null gracefully', () => {
    const result = MCPTool.mapToolResultToToolResultBlockParam(null, toolUseID);

    expect(result.content).toBeNull();
  });

  test('should handle undefined gracefully', () => {
    const result = MCPTool.mapToolResultToToolResultBlockParam(undefined, toolUseID);

    expect(result.content).toBeUndefined();
  });

  test('should not unwrap arrays (even if they have a "data" property)', () => {
    // Edge case: array-like object with data property
    const arrayLikeContent = [
      { type: 'text' as const, text: 'Item 1' },
      { type: 'text' as const, text: 'Item 2' }
    ];
    (arrayLikeContent as any).data = 'should not unwrap';

    const result = MCPTool.mapToolResultToToolResultBlockParam(arrayLikeContent, toolUseID);

    // Should treat as direct content, not unwrap
    expect(result.content).toBe(arrayLikeContent);
  });

  test('should handle nested {data: {data: ...}} structure', () => {
    // Extreme edge case: double wrapping
    const doubleWrapped = {
      data: {
        data: [
          { type: 'text' as const, text: 'Double wrapped' }
        ]
      }
    };

    const result = MCPTool.mapToolResultToToolResultBlockParam(doubleWrapped, toolUseID);

    // Should unwrap once, leaving inner {data: ...}
    expect(result.content).toEqual(doubleWrapped.data);
  });

  test('should preserve tool_use_id correctly', () => {
    const customToolUseID = 'custom_id_xyz_789';
    const content = [{ type: 'text' as const, text: 'Test' }];

    const result = MCPTool.mapToolResultToToolResultBlockParam(content, customToolUseID);

    expect(result.tool_use_id).toBe(customToolUseID);
  });

  test('should always return type "tool_result"', () => {
    const content = [{ type: 'text' as const, text: 'Test' }];

    const result = MCPTool.mapToolResultToToolResultBlockParam(content, toolUseID);

    expect(result.type).toBe('tool_result');
  });
});
