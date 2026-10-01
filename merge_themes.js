const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────
// VSCode 主题基础目录解析
// VSCode 自动更新后版本 hash 目录名会变（如 645f29cc31 → 7debcd0e2a），
// 这里按优先级自动解析，更新后无需修改脚本：
//   1. 命令行参数：node merge_themes.js <themes 目录>
//   2. 环境变量：  VSCODE_THEME_BASE=<themes 目录>
//   3. 自动扫描所有常见安装位置，按 VSCode 语义版本号取最高
//   4. 兜底：使用仓库内缓存 themes/.base-cache（上次成功解析时自动写入）
// ─────────────────────────────────────────────────────────────
const REL_THEMES = path.join('resources', 'app', 'extensions', 'theme-defaults', 'themes');
const BASE_FILES = ['light_vs.json', 'light_plus.json', 'light_modern.json', '2026-light.json',
                    'dark_vs.json', 'dark_plus.json', 'dark_modern.json', '2026-dark.json'];
const cacheDir = path.join(__dirname, 'themes', '.base-cache');

function hasBaseFiles(dir) {
  return fs.existsSync(dir) && BASE_FILES.every(f => fs.existsSync(path.join(dir, f)));
}

function readVscodeVersion(themesDir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(
      path.join(themesDir, '..', '..', '..', 'package.json'), 'utf8'));
    return String(pkg.version || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  } catch {
    return [0, 0, 0];
  }
}

function compareVersion(a, b) {
  for (let i = 0; i < 3; i++) {
    if ((b[i] || 0) !== (a[i] || 0)) return (b[i] || 0) - (a[i] || 0);
  }
  return 0;
}

function collectInstallRoots() {
  const roots = [];
  const env = process.env;
  const push = p => { if (p && fs.existsSync(p) && !roots.includes(p)) roots.push(p); };
  // 用户级安装（自动更新走这个，会留下 hash 版本目录）
  push(path.join(env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code'));
  push(path.join(env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code Insiders'));
  // 系统级安装
  push(path.join(env.ProgramFiles || '', 'Microsoft VS Code'));
  push(path.join(env['ProgramFiles(x86)'] || '', 'Microsoft VS Code'));
  push(path.join(env.ProgramW6432 || '', 'Microsoft VS Code'));
  // scoop / 常见便携位置
  push(path.join(env.USERPROFILE || '', 'scoop', 'apps', 'vscode', 'current'));
  return roots;
}

function scanThemesDirs() {
  const found = [];
  for (const root of collectInstallRoots()) {
    let entries = [];
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    // 安装根自身（系统级安装没有 hash 子目录）
    const selfThemes = path.join(root, REL_THEMES);
    if (hasBaseFiles(selfThemes)) found.push(selfThemes);
    // hash 版本子目录（用户级自动更新安装）
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(root, entry.name, REL_THEMES);
      if (hasBaseFiles(candidate)) found.push(candidate);
    }
  }
  // 版本号最高者优先；版本号相同时（理论上不会）取最近修改
  return found.sort((a, b) =>
    compareVersion(readVscodeVersion(a), readVscodeVersion(b)) ||
    fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs
  );
}

function refreshCache(dir) {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    for (const f of BASE_FILES) {
      fs.copyFileSync(path.join(dir, f), path.join(cacheDir, f));
    }
  } catch (e) {
    console.warn('警告：基础主题缓存更新失败（不影响本次生成）: ' + e.message);
  }
}

function resolveThemeBase() {
  // 1/2. 显式覆盖
  const override = process.argv[2] || process.env.VSCODE_THEME_BASE;
  if (override) {
    const dir = path.resolve(override);
    if (!hasBaseFiles(dir)) {
      throw new Error('指定的 VSCODE_THEME_BASE 目录缺少基础主题文件: ' + dir);
    }
    return dir + path.sep;
  }
  // 3. 自动扫描
  const scanned = scanThemesDirs();
  if (scanned.length > 0) {
    refreshCache(scanned[0]);
    return scanned[0] + path.sep;
  }
  // 4. 仓库内缓存兜底（换机器、VSCode 路径异常时仍可生成）
  if (hasBaseFiles(cacheDir)) {
    console.warn('警告：未找到已安装的 VSCode，使用仓库内缓存的基础主题: ' + cacheDir);
    return cacheDir + path.sep;
  }
  throw new Error(
    '未找到 VSCode theme-defaults 目录。已检查: ' +
    collectInstallRoots().join('; ') +
    '\n可设置环境变量 VSCODE_THEME_BASE 指向 ...\\theme-defaults\\themes 后重试。'
  );
}

const basePath = resolveThemeBase();
console.log('Using theme base: ' + basePath + ' (VSCode ' + readVscodeVersion(basePath).join('.') + ')');

// 读取完整的主题链
const light_vs = JSON.parse(fs.readFileSync(basePath + 'light_vs.json', 'utf8'));
const light_plus = JSON.parse(fs.readFileSync(basePath + 'light_plus.json', 'utf8'));
const light_modern = JSON.parse(fs.readFileSync(basePath + 'light_modern.json', 'utf8'));
const light_2026 = JSON.parse(fs.readFileSync(basePath + '2026-light.json', 'utf8'));

const dark_vs = JSON.parse(fs.readFileSync(basePath + 'dark_vs.json', 'utf8'));
const dark_plus = JSON.parse(fs.readFileSync(basePath + 'dark_plus.json', 'utf8'));
const dark_modern = JSON.parse(fs.readFileSync(basePath + 'dark_modern.json', 'utf8'));
const dark_2026 = JSON.parse(fs.readFileSync(basePath + '2026-dark.json', 'utf8'));

// OC32 专属 tokenColors - Dark
const oc32DarkTokens = [
  { scope: "source.oc32asm", settings: { foreground: "#B070B0" } },
  { scope: ["comment.line.semicolon.oc32asm", "comment.block.oc32asm"], settings: { foreground: "#6A6A6A", fontStyle: "italic" } },
  { scope: "comment.line.hash.oc32asm", settings: { foreground: "#808080", fontStyle: "italic" } },
  { scope: "punctuation.definition.directive.oc32asm", settings: { foreground: "#C586C0" } },
  { scope: "entity.name.function.oc32asm", settings: { foreground: "#DCDCAA", fontStyle: "bold" } },
  { scope: "entity.name.label.local.oc32asm", settings: { foreground: "#9CDCFE", fontStyle: "italic" } },
  { scope: "meta.register-name.oc32asm", settings: { foreground: "#569CD6", fontStyle: "bold" } },
  { scope: [
    "keyword.control.jump.oc32asm", "keyword.control.syscall.oc32asm",
    "keyword.control.status.oc32asm", "keyword.control.addsub.oc32asm",
    "keyword.operator.arithmetic.oc32asm", "keyword.operator.compare.oc32asm",
    "keyword.operator.bitwise.oc32asm", "keyword.operator.move.oc32asm",
    "keyword.operator.memory.oc32asm"
  ], settings: { foreground: "#FF6B6B" } },
  { scope: "constant.numeric.hex.oc32asm", settings: { foreground: "#4EC9B0" } },
  { scope: "constant.numeric.binary.oc32asm", settings: { foreground: "#569CD6" } },
  { scope: "constant.numeric.decimal.oc32asm", settings: { foreground: "#B5CEA8" } },
  { scope: "string.quoted.double.oc32asm", settings: { foreground: "#CE9178" } },
  { scope: "punctuation.separator.comma.oc32asm", settings: { foreground: "#FF9E3D" } }
];

// OC32 专属 tokenColors - Light
const oc32LightTokens = [
  { scope: "source.oc32asm", settings: { foreground: "#7B2D8E" } },
  { scope: ["comment.line.semicolon.oc32asm", "comment.block.oc32asm"], settings: { foreground: "#808080", fontStyle: "italic" } },
  { scope: "comment.line.hash.oc32asm", settings: { foreground: "#A0A0A0", fontStyle: "italic" } },
  { scope: "punctuation.definition.directive.oc32asm", settings: { foreground: "#800080" } },
  { scope: "entity.name.function.oc32asm", settings: { foreground: "#795E26", fontStyle: "bold" } },
  { scope: "entity.name.label.local.oc32asm", settings: { foreground: "#001080", fontStyle: "italic" } },
  { scope: "meta.register-name.oc32asm", settings: { foreground: "#0000FF", fontStyle: "bold" } },
  { scope: [
    "keyword.control.jump.oc32asm", "keyword.control.syscall.oc32asm",
    "keyword.control.status.oc32asm", "keyword.control.addsub.oc32asm",
    "keyword.operator.arithmetic.oc32asm", "keyword.operator.compare.oc32asm",
    "keyword.operator.bitwise.oc32asm", "keyword.operator.move.oc32asm",
    "keyword.operator.memory.oc32asm"
  ], settings: { foreground: "#E05555" } },
  { scope: "constant.numeric.hex.oc32asm", settings: { foreground: "#007070" } },
  { scope: "constant.numeric.binary.oc32asm", settings: { foreground: "#0000D0" } },
  { scope: "constant.numeric.decimal.oc32asm", settings: { foreground: "#007000" } },
  { scope: "string.quoted.double.oc32asm", settings: { foreground: "#804000" } },
  { scope: "punctuation.separator.comma.oc32asm", settings: { foreground: "#C06400" } }
];

// 通用语言增强（非 OC32，作用于其他语言文件）- Dark
const extraDarkTokens = [
  // GCC __attribute__ 关键字（由 syntaxes/gcc-attribute.injection.json 注入 source.c/source.cpp）
  { scope: "keyword.other.attribute.gcc", settings: { foreground: "#E8A838", fontStyle: "italic" } }
];

// 通用语言增强 - Light
const extraLightTokens = [
  { scope: "keyword.other.attribute.gcc", settings: { foreground: "#9A5B00", fontStyle: "italic" } }
];

// 合并 colors: 后面的覆盖前面的
function mergeColors(...sources) {
  const result = {};
  for (const src of sources) {
    if (src && src.colors) {
      Object.assign(result, src.colors);
    }
  }
  return result;
}

// 合并 tokenColors: 按顺序拼接 (VSCode 会自动处理优先级)
function mergeTokenColors(...sources) {
  const result = [];
  for (const src of sources) {
    if (src && src.tokenColors) {
      result.push(...src.tokenColors);
    }
  }
  return result;
}

// 合并 semanticTokenColors
function mergeSemanticTokens(...sources) {
  const result = {};
  for (const src of sources) {
    if (src && src.semanticTokenColors) {
      Object.assign(result, src.semanticTokenColors);
    }
  }
  return result;
}

// 构建 Light 主题: light_vs → light_plus → light_modern → 2026-light → 通用增强 → OC32
const lightTheme = {
  name: "OC32 Assembly Light",
  type: "light",
  colors: mergeColors(light_vs, light_plus, light_modern, light_2026),
  tokenColors: mergeTokenColors(light_vs, light_plus, light_2026, ...[{tokenColors: extraLightTokens}], ...[{tokenColors: oc32LightTokens}]),
  semanticHighlighting: true,
  semanticTokenColors: mergeSemanticTokens(light_vs, light_plus, light_2026)
};

// 构建 Dark 主题: dark_vs → dark_plus → dark_modern → 2026-dark → 通用增强 → OC32
const darkTheme = {
  name: "OC32 Assembly Dark",
  type: "dark",
  colors: mergeColors(dark_vs, dark_plus, dark_modern, dark_2026),
  tokenColors: mergeTokenColors(dark_vs, dark_plus, dark_2026, ...[{tokenColors: extraDarkTokens}], ...[{tokenColors: oc32DarkTokens}]),
  semanticHighlighting: true,
  semanticTokenColors: mergeSemanticTokens(dark_vs, dark_plus, dark_2026)
};

fs.writeFileSync('themes/oc32asm-light.json', JSON.stringify(lightTheme, null, 2));
fs.writeFileSync('themes/oc32asm-dark.json', JSON.stringify(darkTheme, null, 2));

console.log('Light theme: ' + lightTheme.tokenColors.length + ' token rules, ' + Object.keys(lightTheme.colors).length + ' colors');
console.log('Dark theme: ' + darkTheme.tokenColors.length + ' token rules, ' + Object.keys(darkTheme.colors).length + ' colors');
console.log('Done!');
