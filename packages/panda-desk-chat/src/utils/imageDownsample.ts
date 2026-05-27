// Input: dataURL (base64 图片) + 可选尺寸/大小阈值
// Output: DownsampleResult — 含处理后 dataURL、尺寸信息、是否缩放标记
// Pos: Renderer 层工具函数，由 PdComposer handlePaste/handleFileSelect/handleDrop 调用

/**
 * v2.27.5 方案 A：Renderer 端 Canvas 预降采样
 * 超过 MAX_DIMENSION 的图片在发送到 CLI 前自动等比缩放，
 * 防止 panda-cli imageResizer.ts 2000×2000 硬拒触发 process.exit(1)。
 *
 * 一旦修改此文件，请更新所属文件夹 README.md 及头部注释。
 */

export const MAX_DIMENSION = 1900; // 留 100px buffer，避免边界打架
export const MAX_BASE64_BYTES = 4_700_000; // panda-cli 5MB 限制的 buffer

export interface DownsampleResult {
  dataUrl: string;
  mediaType: string;
  originalWidth: number;
  originalHeight: number;
  finalWidth: number;
  finalHeight: number;
  wasResized: boolean;
}

/**
 * 从 dataURL 解析 mediaType（如 "image/png"）。
 */
function parseMediaType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

/**
 * 检测 dataURL 图片尺寸，超 MAX_DIMENSION 则用 Canvas 等比缩放到 MAX_DIMENSION。
 * 若 base64 size 超 MAX_BASE64_BYTES，进一步以 jpeg quality 0.85 重导出。
 *
 * 在 jsdom/Node 环境下（无 Image/canvas），直接返回 wasResized=false 跳过处理。
 */
export async function downsampleImageIfNeeded(dataUrl: string): Promise<DownsampleResult> {
  const mediaType = parseMediaType(dataUrl);

  // 在非浏览器环境（vitest node mode）优雅降级
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      dataUrl,
      mediaType,
      originalWidth: 0,
      originalHeight: 0,
      finalWidth: 0,
      finalHeight: 0,
      wasResized: false,
    };
  }

  // 加载图片以获取原始尺寸
  const { width: originalWidth, height: originalHeight } = await loadImageDimensions(dataUrl);

  const needsResize =
    originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION;
  const base64Size = dataUrl.length * 0.75; // 粗估 base64 decoded size
  const needsQualityDrop = base64Size > MAX_BASE64_BYTES;

  if (!needsResize && !needsQualityDrop) {
    return {
      dataUrl,
      mediaType,
      originalWidth,
      originalHeight,
      finalWidth: originalWidth,
      finalHeight: originalHeight,
      wasResized: false,
    };
  }

  // 计算目标尺寸（等比，取限制更紧的轴）
  let finalWidth = originalWidth;
  let finalHeight = originalHeight;
  if (needsResize) {
    const ratio = Math.min(
      MAX_DIMENSION / originalWidth,
      MAX_DIMENSION / originalHeight,
    );
    finalWidth = Math.round(originalWidth * ratio);
    finalHeight = Math.round(originalHeight * ratio);
  }

  // Canvas 缩放
  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    // canvas 不可用，原样返回
    return {
      dataUrl,
      mediaType,
      originalWidth,
      originalHeight,
      finalWidth: originalWidth,
      finalHeight: originalHeight,
      wasResized: false,
    };
  }

  const img = await loadImage(dataUrl);
  ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

  // 优先保持原格式；若 base64 仍超限则降为 jpeg
  let outputType = needsQualityDrop ? 'image/jpeg' : mediaType;
  // png/webp 不支持 quality 参数，统一用 jpeg 做质量降级
  if (outputType === 'image/png' && needsQualityDrop) {
    outputType = 'image/jpeg';
  }
  const quality = needsQualityDrop ? 0.85 : undefined;
  const resultDataUrl = quality !== undefined
    ? canvas.toDataURL(outputType, quality)
    : canvas.toDataURL(outputType);

  return {
    dataUrl: resultDataUrl,
    mediaType: outputType,
    originalWidth,
    originalHeight,
    finalWidth,
    finalHeight,
    wasResized: true,
  };
}

// ── 内部辅助 ────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  const img = await loadImage(src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}
