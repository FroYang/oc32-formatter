#!/usr/bin/env bash
# build.sh - Linux/Unix 环境打包脚本（替代 build.ps1）
# 用法: chmod +x build.sh && ./build.sh
#       或直接: bash build.sh
#
# 可选环境变量:
#   OUTPUT_DIR   - 输出目录，默认当前目录 (.)
#   VERSION      - 覆盖版本号（从 package.json 读取）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NAME="oc32-asm-syntax"
PUBLISHER="FroYang"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

# --- 检查依赖 ---
if ! command -v zip &>/dev/null; then
    echo "错误: zip 未安装，请运行:"
    echo "  Ubuntu/Debian: sudo apt install -y zip"
    echo "  CentOS/RHEL:   sudo yum install -y zip"
    echo "  macOS:         brew install zip"
    exit 1
fi

echo "=== 读取 package.json 版本 ==="
VERSION="${VERSION:-$(python3 -c "import json; print(json.load(open('package.json'))['version'])")}"
echo "扩展: ${NAME}"
echo "版本: ${VERSION}"
echo "发布者: ${PUBLISHER}"

# --- 构建输出文件名 ---
mkdir -p "${OUTPUT_DIR}"
VSIX_FILE="${OUTPUT_DIR}/${NAME}-${VERSION}.vsix"

# --- 检查可用的打包工具 ---
echo ""
echo "=== 检测打包工具 ==="
HAS_NODE=false
HAS_NPM=false
if command -v node &>/dev/null || command -v nodejs &>/dev/null; then
    HAS_NODE=true
    echo "✅ Node.js 可用"
fi
if command -v npm &>/dev/null; then
    HAS_NPM=true
    echo "✅ npm 可用"
fi
if command -v npx &>/dev/null; then
    echo "✅ npx 可用"
fi

# --- 尝试使用 vsce 打包（需要 npm）---
if ${HAS_NODE} && ${HAS_NPM}; then
    echo ""
    echo "=== 使用 vsce 打包 ==="
    if [ ! -d "node_modules/@vscode/vsce" ]; then
        echo "正在安装 @vscode/vsce..."
        npm install --no-save @vscode/vsce@^2.15.0
    fi
    npx vsce package --out "${VSIX_FILE}"
    echo "✅ vsce 打包成功: ${VSIX_FILE}"
    echo ""
    echo "   安装方式:"
    echo "     code --install-extension \"${VSIX_FILE}\""
    exit 0
fi

# --- 手动打包（备选方案，无需 node/npm）---
echo ""
echo "=== 手动打包 VSIX（zip 格式）==="
echo "说明: VS Code 要求扩展文件必须在 extension/ 子目录下"

BUILD_TMP=$(mktemp -d)
trap 'rm -rf "$BUILD_TMP"' EXIT

echo "临时目录: ${BUILD_TMP}"

# 创建 extension 子目录（VS Code 要求）
mkdir -p "${BUILD_TMP}/extension"

# 复制所有需要打包的文件到 extension/ 目录
for src_file in \
    extension.js \
    package.json \
    language.configuration.json \
    icon.png \
    README.md \
    LICENSE \
    LICENSE.txt \
; do
    [ -f "${SCRIPT_DIR}/${src_file}" ] && cp "${SCRIPT_DIR}/${src_file}" "${BUILD_TMP}/extension/${src_file}"
done

# 递归复制子目录到 extension/
for dir in syntaxes themes; do
    if [ -d "${SCRIPT_DIR}/${dir}" ]; then
        cp -r "${SCRIPT_DIR}/${dir}" "${BUILD_TMP}/extension/${dir}"
        # 清理 .base-cache（构建缓存）
        find "${BUILD_TMP}/extension/${dir}/.base-cache" -type f -delete 2>/dev/null || true
        rmdir "${BUILD_TMP}/extension/${dir}/.base-cache" 2>/dev/null || true
    fi
done

# 生成 extension.vsixmanifest（VS Code 规范）
cat > "${BUILD_TMP}/extension/extension.vsixmanifest" << 'MANIFEST_EOF'
<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="FroYang.oc32-asm-syntax" Version="VERSION_PLACEHOLDER" Publisher="FroYang" />
    <DisplayName>OC32 Assembly Syntax</DisplayName>
    <Description xml:space="preserve">OC32 assembly language syntax highlighting and formatting</Description>
    <Categories>Programming Languages</Categories>
    <Tags>assembly,oc32,syntax,formatter</Tags>
    <GalleryFlags>Public</GalleryFlags>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies>
    <Dependency Id="Microsoft.VSCode" Version="1.74.0" />
  </Dependencies>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.ExtensionManifest" Path="extension/package.json" />
    <Asset Type="Microsoft.VisualStudio.Code.ExtensionFiles" Path="extension/" />
  </Assets>
</PackageManifest>
MANIFEST_EOF

# 替换版本号占位符
sed -i "s/VERSION_PLACEHOLDER/${VERSION}/g" "${BUILD_TMP}/extension/extension.vsixmanifest"

# 打包为 .vsix（本质是 ZIP）
# 使用子shell避免 cd 影响后续路径，VSIX_FILE 必须是绝对路径
ABSOLUTE_VSIX="$(realpath -m "${VSIX_FILE}")"
(cd "${BUILD_TMP}" && zip -r "${ABSOLUTE_VSIX}" . -x "*.DS_Store")

# --- 验证输出 ---
if [ -f "${VSIX_FILE}" ]; then
    SIZE=$(du -h "${VSIX_FILE}" | cut -f1)
    echo ""
    echo "✅ 打包成功!"
    echo "   文件: ${VSIX_FILE}"
    echo "   大小: ${SIZE}"
    echo ""
    echo "   安装方式:"
    echo "     code --install-extension \"${VSIX_FILE}\""
else
    echo "❌ 打包失败，未找到输出文件: ${VSIX_FILE}"
    exit 1
fi
