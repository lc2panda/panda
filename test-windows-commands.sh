#!/bin/bash

# 测试 Windows 命令解析完整性
# 2026-07-14 21:35 +08:00

echo "======================================"
echo "Windows Command Resolution Test"
echo "======================================"
echo ""

# 测试 .cmd 脚本命令
echo "Testing .cmd scripts:"
echo "-------------------------------------"

cmdScripts=(
  "npm" "npx" "yarn" "pnpm"
  "uv" "uvx" "pip" "pipx" "poetry" "pdm"
  "gem" "bundle"
  "cargo"
  "gradle" "mvn" "make" "cmake"
)

cmd_found=0
cmd_missing=0

for cmd in "${cmdScripts[@]}"; do
  if grep -q "'$cmd'" /Users/panda/Downloads/cc-panda/src/services/mcp/client.ts; then
    echo "✅ $cmd"
    ((cmd_found++))
  else
    echo "❌ $cmd (MISSING)"
    ((cmd_missing++))
  fi
done

echo ""
echo "Testing .exe executables:"
echo "-------------------------------------"

exeCommands=(
  "node" "python" "python3" "py"
  "deno" "bun"
  "docker" "podman"
  "go" "java" "dotnet"
)

exe_found=0
exe_missing=0

for cmd in "${exeCommands[@]}"; do
  if grep -q "'$cmd'" /Users/panda/Downloads/cc-panda/src/services/mcp/client.ts; then
    echo "✅ $cmd"
    ((exe_found++))
  else
    echo "❌ $cmd (MISSING)"
    ((exe_missing++))
  fi
done

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo ".cmd scripts: $cmd_found found, $cmd_missing missing (total: ${#cmdScripts[@]})"
echo ".exe commands: $exe_found found, $exe_missing missing (total: ${#exeCommands[@]})"
echo "Total commands: $((cmd_found + exe_found)) / $((${#cmdScripts[@]} + ${#exeCommands[@]}))"
echo ""

# 验证关键 Python 工具
echo "======================================"
echo "Key Python Tools Verification"
echo "======================================"

key_python_tools=("uv" "uvx" "pip" "pipx" "poetry" "pdm")
python_ok=true

for tool in "${key_python_tools[@]}"; do
  if grep -q "'$tool'" /Users/panda/Downloads/cc-panda/src/services/mcp/client.ts; then
    echo "✅ Python tool '$tool' is in cmdScripts"
  else
    echo "❌ Python tool '$tool' is MISSING"
    python_ok=false
  fi
done

echo ""

if [ "$python_ok" = true ]; then
  echo "✅ All Python tools are properly configured"
  exit 0
else
  echo "❌ Some Python tools are missing"
  exit 1
fi
