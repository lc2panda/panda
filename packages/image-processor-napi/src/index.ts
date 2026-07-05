import sharpModule from 'sharp'

export const sharp = sharpModule

interface NativeModule {
  hasClipboardImage(): boolean
  readClipboardImage(
    maxWidth?: number,
    maxHeight?: number,
  ): {
    png: Buffer
    width: number
    height: number
    originalWidth: number
    originalHeight: number
  } | null
}

function spawnSyncCompat(cmd: string, args: string[]): { stdout: string; exitCode: number } {
  if (typeof globalThis.Bun !== 'undefined') {
    const result = Bun.spawnSync({ cmd: [cmd, ...args], stdout: 'pipe', stderr: 'pipe' })
    return { stdout: new TextDecoder().decode(result.stdout), exitCode: result.exitCode }
  }
  const { spawnSync } = require('child_process')
  const result = spawnSync(cmd, args, { encoding: 'utf-8' })
  return { stdout: result.stdout || '', exitCode: result.status ?? 1 }
}

function createDarwinNativeModule(): NativeModule {
  return {
    hasClipboardImage(): boolean {
      try {
        const result = spawnSyncCompat('osascript', [
          '-e',
          'try\nthe clipboard as «class PNGf»\nreturn "yes"\non error\nreturn "no"\nend try',
        ])
        const output = result.stdout.trim()
        return output === 'yes'
      } catch {
        return false
      }
    },

    readClipboardImage(
      maxWidth?: number,
      maxHeight?: number,
    ) {
      try {
        // Use osascript to read clipboard image as PNG data and write to a temp file,
        // then read the temp file back
        const tmpPath = `/tmp/claude_clipboard_native_${Date.now()}.png`
        const script = `
set png_data to (the clipboard as «class PNGf»)
set fp to open for access POSIX file "${tmpPath}" with write permission
write png_data to fp
close access fp
return "${tmpPath}"
`
        const result = spawnSyncCompat('osascript', ['-e', script])

        if (result.exitCode !== 0) {
          return null
        }

        const fs = require('fs')
        const buffer: Buffer = fs.readFileSync(tmpPath)

        // Clean up temp file
        try {
          fs.unlinkSync(tmpPath)
        } catch {
          // ignore cleanup errors
        }

        if (buffer.length === 0) {
          return null
        }

        // Read PNG dimensions from IHDR chunk
        // PNG header: 8 bytes signature, then IHDR chunk
        // IHDR starts at offset 8 (4 bytes length) + 4 bytes "IHDR" + 4 bytes width + 4 bytes height
        let width = 0
        let height = 0
        if (buffer.length > 24 && buffer[12] === 0x49 && buffer[13] === 0x48 && buffer[14] === 0x44 && buffer[15] === 0x52) {
          width = buffer.readUInt32BE(16)
          height = buffer.readUInt32BE(20)
        }

        const originalWidth = width
        const originalHeight = height

        // If maxWidth/maxHeight are specified and the image exceeds them,
        // we still return the full PNG - the caller handles resizing via sharp
        // But we report the capped dimensions
        if (maxWidth && maxHeight) {
          if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height)
            width = Math.round(width * scale)
            height = Math.round(height * scale)
          }
        }

        return {
          png: buffer,
          width,
          height,
          originalWidth,
          originalHeight,
        }
      } catch {
        return null
      }
    },
  }
}

function createWin32NativeModule(): NativeModule {
  return {
    hasClipboardImage(): boolean {
      try {
        // 使用 PowerShell 快速检测（避免完整图片读取）
        const result = spawnSyncCompat('powershell.exe', [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::ContainsImage()',
        ])
        return result.stdout.trim() === 'True'
      } catch {
        return false
      }
    },

    readClipboardImage(maxWidth?: number, maxHeight?: number) {
      try {
        // 尝试 @napi-rs/clipboard（高性能路径）
        try {
          const { Clipboard } = require('@napi-rs/clipboard')
          const imageData = Clipboard.readImage?.()
          if (imageData && imageData.length > 0) {
            // 返回 PNG Buffer（假设 @napi-rs/clipboard 返回 PNG）
            const width = 0 // 需解析 PNG IHDR 或使用 sharp metadata
            const height = 0
            return {
              png: imageData,
              width,
              height,
              originalWidth: width,
              originalHeight: height,
            }
          }
        } catch {
          // @napi-rs/clipboard 未安装或失败，fallback 到 PowerShell
        }

        // PowerShell fallback（兼容路径）
        const tmpPath = `${process.env.TEMP || 'C:\\Temp'}\\claude_clipboard_${Date.now()}.png`
        const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
  $img.Save('${tmpPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
  $img.Dispose()
  Write-Output 'OK'
} else {
  Write-Output 'FAIL'
}
`
        const result = spawnSyncCompat('powershell.exe', [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          script,
        ])

        if (result.exitCode !== 0 || !result.stdout.includes('OK')) {
          return null
        }

        const fs = require('fs')
        const buffer: Buffer = fs.readFileSync(tmpPath)

        try {
          fs.unlinkSync(tmpPath)
        } catch {
          // 清理失败忽略
        }

        if (buffer.length === 0) {
          return null
        }

        // 解析 PNG 尺寸（复用 macOS 逻辑）
        let width = 0
        let height = 0
        if (
          buffer.length > 24 &&
          buffer[12] === 0x49 &&
          buffer[13] === 0x48 &&
          buffer[14] === 0x44 &&
          buffer[15] === 0x52
        ) {
          width = buffer.readUInt32BE(16)
          height = buffer.readUInt32BE(20)
        }

        const originalWidth = width
        const originalHeight = height

        if (maxWidth && maxHeight && (width > maxWidth || height > maxHeight)) {
          const scale = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }

        return {
          png: buffer,
          width,
          height,
          originalWidth,
          originalHeight,
        }
      } catch {
        return null
      }
    },
  }
}

export function getNativeModule(): NativeModule | null {
  if (process.platform === 'darwin') {
    return createDarwinNativeModule()
  }
  if (process.platform === 'win32') {
    return createWin32NativeModule()
  }
  return null
}

export default sharp
