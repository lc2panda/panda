// Input: 选中的 SessionEntry + 最近若干 transcript 行 + 当前 inline reply 草稿
// Output: 右侧 peek 面板（消息列表 + 底部 prompt 占位）
// Pos: src/components/AgentView/ —— Tier 1 简化版 peek（只读列出，inline reply 落地后即可发送）
//
// Tier 1 妥协说明：
//   - 真正的 inline reply 需要 session 间 IPC，这是 Tier 2 的范围
//   - 这里仅渲染最近 N 条消息预览 + 一个提示 "inline reply available in Tier 2"
//   - 用户可以按 Space 关闭面板再 Enter attach 进行回复

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box, Text } from '../../ink.js';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { getClaudeConfigHomeDir } from '../../utils/envUtils.js';
import { sanitizePath } from '../../utils/path.js';
import { jsonParse } from '../../utils/slowOperations.js';
import { errorMessage, isFsInaccessible } from '../../utils/errors.js';
import { logForDebugging } from '../../utils/debug.js';
import type { SessionEntry } from './types.js';

const MAX_MESSAGES = 8;
const MAX_LEN = 240;

async function readRecentMessages(sessionId: string, cwd: string): Promise<{ role: string; text: string }[]> {
  const key = sanitizePath(cwd);
  const path = join(getClaudeConfigHomeDir(), 'projects', key, `${sessionId}.jsonl`);
  try {
    const st = await stat(path);
    if (st.size === 0) return [];
    const buf = await readFile(path, 'utf8');
    const lines = buf.split('\n').reverse();
    const out: { role: string; text: string }[] = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = jsonParse(line) as { message?: { role?: string; content?: unknown } };
        const role = entry?.message?.role;
        if (role !== 'user' && role !== 'assistant') continue;
        const content = entry.message?.content;
        let text = '';
        if (typeof content === 'string') {
          text = content;
        } else if (Array.isArray(content)) {
          for (const block of content as Array<{ type?: string; text?: string }>) {
            if (block?.type === 'text' && typeof block.text === 'string') {
              text += block.text + ' ';
            }
          }
        }
        text = text.replace(/\s+/g, ' ').trim();
        if (!text) continue;
        out.push({
          role,
          text: text.length > MAX_LEN ? text.slice(0, MAX_LEN - 3) + '...' : text,
        });
        if (out.length >= MAX_MESSAGES) break;
      } catch {
        // ignore malformed line
      }
    }
    return out.reverse();
  } catch (e) {
    if (!isFsInaccessible(e)) {
      logForDebugging(`[agentView/peek] read ${sessionId} failed: ${errorMessage(e)}`);
    }
    return [];
  }
}

export type PeekPanelProps = {
  entry: SessionEntry;
};

export function PeekPanel(props: PeekPanelProps): React.ReactElement {
  const { entry } = props;
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!entry.sessionId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    void readRecentMessages(entry.sessionId, entry.cwd).then(msgs => {
      if (!cancelled) {
        setMessages(msgs);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [entry.sessionId, entry.cwd]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="suggestion" paddingX={1}>
      <Text bold color="suggestion">
        Peek · {entry.displayName}
      </Text>
      <Text dimColor>
        Session: {entry.sessionId ?? 'none'} · {entry.cwd}
      </Text>
      <Text> </Text>
      {loading ? (
        <Text dimColor>Loading recent messages…</Text>
      ) : messages.length === 0 ? (
        <Text dimColor>No prior messages. Press Enter to attach.</Text>
      ) : (
        messages.map((m, i) => (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text color={m.role === 'user' ? 'cyan' : 'green'} bold>
              {m.role === 'user' ? 'You' : 'Assistant'}
            </Text>
            <Text>{m.text}</Text>
          </Box>
        ))
      )}
      <Text> </Text>
      <Text dimColor>Space close · Enter attach · Inline reply: Tier 2 (use attach to chat)</Text>
    </Box>
  );
}
