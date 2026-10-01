---
name: oc32-syntax-color-sync
description: Add or change OC32 assembly syntax highlighting colors, or inject colors for keywords in other languages (e.g. GCC __attribute__ in C files). Use when the user asks to add a token color (comma, register, comment), change existing colors, or introduce a new grammar scope. Keeps grammar, both themes, and merge script in sync. Do not use for repackaging the .vsix alone.
---

# OC32 语法高亮配色同步

修改插件的语法高亮时，同一个变更必须落在多处，漏一处就会在重新生成主题或打包时回退。先判断变更类型，再按对应清单同步。

## A. OC32 汇编 token 改色（4 处）

1. `syntaxes/oc32asm.tmLanguage.json` — 在 `patterns` 数组中新增/修改匹配规则，scope 命名一律以 `.oc32asm` 结尾，例如 `punctuation.separator.comma.oc32asm`。
2. `themes/oc32asm-dark.json` — 由脚本生成，不要手改。
3. `themes/oc32asm-light.json` — 由脚本生成，不要手改。
4. `merge_themes.js` — 在 `oc32DarkTokens` 和 `oc32LightTokens` 两个数组中各加一条。

## B. 其他语言的关键字注入（如 C 文件的 __attribute__，4 处）

当目标语言的内置语法没有对应 scope（先在 VSCode 内置语法 `resources/app/extensions/<lang>/syntaxes/` 中确认），用 injection grammar：

1. 新建 `syntaxes/<name>.injection.json`，含 `scopeName`、`injectionSelector`（兼容旧版 VSCode/分支，如 `L:source.c -comment -string`）和匹配规则。
2. `package.json` 的 `contributes.grammars` 注册该文件（注入语法不写 `language` 字段），**必须同时写 `injectTo`: ["source.c", ...]** —— 新版 VSCode（1.138 实测）只按 `injectTo` 注册注入，grammar 文件里的 `injectionSelector` 不再被读取，漏写则注入静默不生效。
3. `merge_themes.js` 的 `extraDarkTokens` / `extraLightTokens` 数组加配色（这是通用 scope，不带 `.oc32asm` 后缀）。
4. 运行脚本重新生成两个主题。

### 语义高亮覆盖（C/C++ 文件必查）

C/C++ 扩展默认开启 enhancedColorization，语义令牌（semantic token）永远覆盖 TextMate 颜色。`Inspect Editor Tokens and Scopes` 中若显示 `semantic token type: macro`，注入 scope 即使生效也不会显色。处理方式：
- 先确认 IntelliSense 模式正确（GCC 项目需 `C_Cpp.default.intelliSenseMode: gcc-x64`，msvc 模式下 EDG 不认识 `__attribute__` 会回退为 macro 令牌；gcc 模式下作为关键字不发射语义令牌，TextMate 注入色即可显示）。该设置属于用户/项目环境，不要硬塞进插件的 configurationDefaults 影响他人全部 C 工程。
- 仅设 intelliSenseMode 不够：cpptools 会查询 `compilerPath`（PATH 中找到 cl.exe 时）自动改回 msvc，表现为"打开文件瞬间颜色正确，1~2 秒后失效"，C/C++ 输出日志可见 `IntelliSenseMode was changed ... to windows-msvc-x64 ... compilerPath: cl.exe`。必须把 `C_Cpp.default.compilerPath` 显式指向真实 GCC（如 `C:\oc32\bin\oc32-none-elf-gcc.exe`，先验证 `gcc --version` 与 `gcc -E -dM` 可查询）；或设为空串禁用编译器探测。配置写入用户/工作区设置，不进插件。
- 无法按单个令牌文本禁用语义着色；整语言关闭会牺牲类型/函数语义色，需用户明确同意。

## 配色约定

- 注释：暗灰色系（dark `#6A6A6A`/`#808080`，light `#808080`/`#A0A0A0`）
- 所有指令（9 个 keyword scope 合并数组）：红色系（dark `#FF6B6B`，light `#E05555`），不按指令分类着色
- 寄存器 `meta.register-name.oc32asm`：蓝色加粗（dark `#569CD6`，light `#0000FF`），与立即数严格区分
- 立即数：十六进制青色、二进制蓝色、十进制绿色
- OC32 未匹配字符的默认色：暗紫（dark `#B070B0`，light `#7B2D8E`），通过 `source.oc32asm` scope 实现，禁止用顶层 `colors.editor.foreground`（会影响所有文件）
- GCC `__attribute__`（`keyword.other.attribute.gcc`）：琥珀金斜体（dark `#E8A838`，light `#9A5B00`）

## 关键约束

- 主题基于完整的 VSCode 2026 主题链（`*_vs → *_plus → *_modern → 2026-*`）合并而成，自定义规则追加在最后以获得最高优先级；不要删除或精简通用 tokenColors，否则 C/Python 等其他文件会失去高亮。
- OC32 专属 scope 只能匹配 OC32 语法，不要用裸全局 scope 名（如 `punctuation.separator.comma`），避免污染其他语言；跨语言增强必须走 B 类注入流程。
- `merge_themes.js` 自动解析 VSCode 基础主题：扫描用户级/系统级/Insiders/scoop 安装位置，按 `resources/app/package.json` 的语义版本号取最新（VSCode 自动更新后 hash 目录名变化无需改脚本）；找不到时回退到仓库内 `themes/.base-cache`（每次成功解析自动刷新）；可用环境变量 `VSCODE_THEME_BASE` 或命令行参数强制指定。禁止再硬编码版本路径。
- 改完后运行 `node merge_themes.js` 验证脚本不报错，并用 Grep 确认新 scope 同时出现在两个主题文件中。

## 打包与安装后验证

用户要求发布时再打包，不要主动执行：

```powershell
& "c:\Program Files\nodejs\npx.cmd" vsce package
```

- 从 .vsix 安装（或覆盖安装）后必须 **Reload Window / 完全重启 VSCode**：TextMate 语法和注入语法只在启动时注册，运行中安装不会加载，热激活扩展代码不代表语法已生效。判断方法：对比扩展目录创建时间与 `%APPDATA%\Code\logs\<最新会话>` 的启动时间，安装晚于启动就需要重载。
- 用户报告"颜色没生效"时先验证 TextMate 层：可用 vscode-textmate + vscode-oniguruma 加载 VSCode 内置语法和注入文件离线分词，确认 scope 正确；再排查 C/C++ 扩展语义高亮（`C_Cpp.enhancedColorization`，默认开启）是否覆盖。
- 安装新版本前确认 `%USERPROFILE%\.vscode\extensions` 下没有历史手工复制的同名/旧版扩展目录（目录名无版本号、publisher 不同），重复 scopeName 会产生冲突，必须删除。

