# OC32 Assembly Formatter

A VS Code extension to format OC32 assembly code with rich syntax highlighting.

## Features

- Format OC32 assembly code with proper indentation
- Align operands for consistent readability
- Convert keywords and registers to uppercase
- Rich syntax highlighting with dark/light themes
- Support for `.S` and `.s` file extensions

## Installation

### Method 1: Install from VSIX (Recommended for sharing)

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X`)
4. Click the three dots `...` in the top right
5. Select "Install from VSIX..."
6. Navigate to the downloaded `.vsix` file

### Method 2: Install from Source

1. Download/clone this repository
2. Open the folder in VS Code
3. Press `F5` to run in extension development host
4. Or use `vsce package` to create a VSIX file

## Configuration

Settings in `settings.json`:

```json
{
  "oc32-formatter.indentSize": 4,
  "oc32-formatter.uppercaseKeywords": true,
  "oc32-formatter.alignOperands": true
}
```

## Usage

1. Open an OC32 assembly file (`.S` or `.s`)
2. Right-click → "Format Document"
3. Or use keyboard shortcut: `Ctrl+Shift+F`

## Supported Instructions

- **Arithmetic**: ADD, ADDC, SUB, SUBB, MUL, MULU, DIV, DIVU
- **Comparison**: CMP, CMPU
- **Bit manipulation**: CLO, CLZ, AND, OR, XOR, NAND, NOR, RV, RVB, EBF, MBF, SEB, SEH
- **Memory**: LW, SW, LB, SB, LWI, LWIF, LWAS, SWI, SWAT
- **Control flow**: J, JZ, JNZ, JL, JLZ, JLNZ, RETE
- **System calls**: SYSC, TRAPZ, TRAPNZ
- **Shift**: RV, RVB, SL, SA, SR
- **Move**: MOV, MOVZ, MOVNZ, MOVH
- **Status register**: RDSR, WRSR, SBSR, CBSR, TBSR

## Syntax Highlighting

### Dark Theme

| Element | Color |
|---------|-------|
| Instructions | Red (#FF6B6B) |
| Registers (R0-R31) | Blue (#569CD6) |
| Hex constants | Teal (#4EC9B0) |
| Binary constants | Blue (#569CD6) |
| Decimal constants | Light Green (#B5CEA8) |
| Comments | Gray (#6A6A6A / #808080) |
| Function labels | Yellow (#DCDCAA) |
| Local labels | Light Blue (#9CDCFE) |
| Directives | Purple (#C586C0) |
| Strings | Orange (#CE9178) |

### Light Theme

Same color scheme optimized for light backgrounds.

Switch themes via **File > Preferences > Theme > Color Theme**.

## Example

Before:
```assembly
add r1, r0, r2
sub r3, r1, r4
j [r7+0]
```

After:
```assembly
ADD     R1, R0, R2
SUB     R3, R1, R4
J       [R7+0]
```

## Building

```bash
# Install vsce
npm install -g @vscode/vsce

# Package as VSIX
vsce package

# Or use the batch script (Windows)
package.bat

# Or use the shell script (Linux/Mac)
./package.sh
```

## License

MIT
