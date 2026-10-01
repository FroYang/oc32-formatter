# OC32 Assembly Formatter - VS Code Extension

## 项目文件

```
d:\share\oc32-formatter\
├── extension.js              # 扩展主文件
├── package.json              # 扩展清单
├── syntaxes/
│   └── oc32asm.tmLanguage.json  # 语法高亮定义
├── themes/
│   ├── oc32asm-dark.json     # 暗色主题
│   └── oc32asm-light.json    # 亮色主题
├── language.configuration.json  # 语言配置
├── README.md
├── package.bat               # Windows 打包脚本
└── package.sh                # Linux/Mac 打包脚本
```

## 生成 VSIX 文件

### 方法 1: 手动安装 Node.js 后打包

1. 安装 Node.js: https://nodejs.org/
2. 打开命令行，进入项目目录:
   ```bash
   cd d:\share\oc32-formatter
   npm install -g @vscode/vsce
   vsce package
   ```
3. 生成 `oc32-assembly-formatter-0.1.0.vsix`

### 方法 2: 直接使用（无需打包）

将整个 `oc32-formatter` 文件夹分享给朋友，朋友在 VSCode 中：
1. 按 `Ctrl+Shift+P`
2. 输入 `Extensions: Install from Extension Manifest`
3. 选择 `d:\share\oc32-formatter\package.json`

### 方法 3: 创建 ZIP 分享

```bash
# 在项目目录外执行
cd d:\share
zip -r oc32-formatter.zip oc32-formatter
```

朋友下载后解压，使用方法 2 安装。

## 安装到 VSCode

### 安装 VSIX
1. 打开 VSCode
2. `Ctrl+Shift+X` 打开扩展
3. 点击顶部 `...` 菜单
4. 选择 "Install from VSIX..."
5. 选择 `oc32-assembly-formatter-0.1.0.vsix`

### 从源码安装
1. 在 VSCode 中打开 `oc32-formatter` 文件夹
2. 按 `F5` 运行扩展开发宿主
3. 新窗口会加载扩展

## 使用

1. 打开 `.S` 或 `.s` 文件
2. 右键 → "Format Document" 或按 `Ctrl+Shift+F`
3. 代码自动格式化
4. 切换主题: `Ctrl+K Ctrl+T` 选择 OC32 主题
