// Input: number of bytes
// Output: human-readable size string ("1.2 MB" / "256 KB" / "0 B")
// Pos: Lib layer — shared across update card / asset readouts
//
// Source 1:1: cc-haha desktop/src/lib/formatBytes.ts (~12 行)

export function formatBytes(bytes?: number): string {
  if (typeof bytes !== 'number' || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}
