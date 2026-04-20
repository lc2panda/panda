// Input: terminal cols + isLoading flag
// Output: 6 行字符雨 banner（idle 稀疏 / loading 密集）
// Pos: MatrixTheme 主显示组件，由 LogoV2 / REPL 调用
// 一旦我被修改，请更新 MatrixTheme/README.md

import * as React from 'react';
import { Box } from '../../ink.js';
import { MatrixCharRain } from './MatrixCharRain.js';

interface MatrixBannerProps {
  cols: number;
  /** 是否处于 thinking / loading 状态，density 和 fps 会增大 */
  isLoading?: boolean;
  /** 高度（行数），默认 6 */
  height?: number;
}

/**
 * Matrix 主题常驻 banner。
 * - idle: 稀疏字符雨（density 0.2 / 20fps）
 * - loading: 密集字符雨（density 0.4 / 30fps）
 */
export function MatrixBanner({ cols, isLoading = false, height = 6 }: MatrixBannerProps): React.ReactNode {
  return (
    <Box flexDirection="column">
      <MatrixCharRain
        rows={height}
        cols={cols}
        density={isLoading ? 0.4 : 0.2}
        fps={isLoading ? 30 : 20}
        charSet="mixed"
        headLength={isLoading ? 5 : 3}
        tailLength={isLoading ? 6 : 4}
      />
    </Box>
  );
}
