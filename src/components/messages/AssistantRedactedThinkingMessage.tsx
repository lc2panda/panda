// Input: addMargin boolean
// Output: Matrix-themed redacted thinking indicator
// Pos: messages/ — 被隐藏/编辑过的 thinking 块展示
// 一旦我被修改，请更新 messages/README.md
import { c as _c } from "react/compiler-runtime";
import React from 'react';
import { Box, Text } from '../../ink.js';
import { isZh } from '../../utils/i18n.js';
import { isMatrixTheme } from '../MatrixTheme/isMatrixTheme.js';
import { MATRIX_SCALE } from '../MatrixTheme/matrixPalette.js';
type Props = {
  addMargin: boolean;
};
export function AssistantRedactedThinkingMessage(t0: Props) {
  const {
    addMargin: t1
  } = t0;
  const addMargin = t1 === undefined ? false : t1;
  const t2 = addMargin ? 1 : 0;
  const matrix = isMatrixTheme();

  const label = matrix
    ? (isZh() ? "\u27E9\u27E9 思考中…" : "\u27E9\u27E9 Thinking…")
    : (isZh() ? "✻ 思考中…" : "✻ Thinking…");

  return (
    <Box marginTop={t2}>
      <Text dimColor={!matrix} italic={true} color={matrix ? MATRIX_SCALE.SHADOW : undefined}>{label}</Text>
    </Box>
  );
}
