# Sarasa Mono SC — Manual Download Required

The Sarasa Gothic font package is ~200MB and cannot be auto-downloaded.

## Steps

1. Visit https://github.com/be5invis/Sarasa-Gothic/releases
2. Download the latest `SarasaMonoSC-TTF-*.7z` or `SarasaMonoSC-TTF-*.zip`
3. Extract and convert to woff2, or find pre-built woff2 files
4. Place the following files in this directory:
   - `SarasaMonoSC-Regular.woff2`
   - `SarasaMonoSC-Bold.woff2`

## Alternative: Use fonttools to subset + convert

```bash
pip install fonttools brotli
pyftsubset SarasaMonoSC-Regular.ttf \
  --output-file=SarasaMonoSC-Regular.woff2 \
  --flavor=woff2 \
  --layout-features='*' \
  --text-file=gb2312-charset.txt
```

Until the woff2 files are placed here, the system falls back to JetBrains Mono → system monospace.
