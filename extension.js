const vscode = require('vscode');

const oc32Instructions = [
    'ADD', 'ADDC', 'SUB', 'SUBB', 'MUL', 'MULU', 'DIV', 'DIVU',
    'CMP', 'CMPU', 'CLO', 'CLZ', 'SEB', 'SEH', 'AND', 'OR', 'XOR', 'NAND', 'NOR',
    'EBF', 'MBF', 'RV', 'RVB', 'MOV', 'RDSR', 'WRSR', 'SBSR', 'CBSR', 'TBSR',
    'MOVZ', 'MOVNZ', 'MOVH', 'LW', 'LWI', 'LWIF', 'LWAS', 'LB', 'LBU', 'SW', 'SWI', 'SWAT', 'SB',
    'RETE', 'J', 'JZ', 'JNZ', 'JL', 'JLZ', 'JLNZ', 'SYSC', 'TRAPZ', 'TRAPNZ',
    'RR', 'SR', 'SL', 'SA'
];

const oc32Registers = [
    'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
    'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
    'R16', 'R17', 'R18', 'R19', 'R20', 'R21', 'R22', 'R23',
    'R24', 'R25', 'R26', 'R27', 'R28', 'R29', 'R30', 'R31'
];

function formatOC32Assembly(text, options) {
    const lines = text.split('\n');
    const formattedLines = [];
    let indentLevel = 0;
    const indentSize = options.indentSize || 4;
    const uppercaseKeywords = options.uppercaseKeywords !== false;
    const alignOperands = options.alignOperands !== false;

    let maxInstructionLength = 0;
    if (alignOperands) {
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith(';') && !trimmedLine.startsWith('.') && !trimmedLine.startsWith('#')) {
                const parts = trimmedLine.split(/\s+/);
                if (oc32Instructions.includes(parts[0].toUpperCase())) {
                    maxInstructionLength = Math.max(maxInstructionLength, parts[0].length);
                }
            }
        }
    }

    for (const line of lines) {
        let formattedLine = line;

        if (!line.trim()) {
            formattedLines.push(line);
            continue;
        }

        if (line.trim().startsWith(';')) {
            const commentIndent = ' '.repeat(indentLevel * indentSize);
            formattedLine = commentIndent + '\t' + line.trim();
            formattedLines.push(formattedLine);
            continue;
        }

        if (line.trim().startsWith('/*')) {
            const commentIndent = ' '.repeat(indentLevel * indentSize);
            formattedLine = commentIndent + line.trim();
            formattedLines.push(formattedLine);
            continue;
        }

        if (line.trim().startsWith('.')) {
            formattedLine = line.trim();
            formattedLines.push(formattedLine);
            continue;
        }

        if (line.trim().startsWith('#')) {
            formattedLine = line.trim();
            formattedLines.push(formattedLine);
            continue;
        }

        if (line.trim().endsWith(':')) {
            formattedLine = line.trim();
            indentLevel = 0;
            formattedLines.push(formattedLine);
            continue;
        }

        const parts = line.trim().split(/\s+/);
        if (parts.length > 0) {
            let instruction = parts[0];
            const operands = parts.slice(1);

            if (uppercaseKeywords) {
                instruction = instruction.toUpperCase();
            }

            if (oc32Instructions.includes(instruction.toUpperCase())) {
                let instructionPart = instruction;
                if (alignOperands) {
                    instructionPart = instruction.padEnd(maxInstructionLength, ' ');
                }

                let operandsPart = operands.join(' ');

                if (uppercaseKeywords) {
                    for (const reg of oc32Registers) {
                        operandsPart = operandsPart.replace(new RegExp(reg.toLowerCase(), 'g'), reg);
                    }
                }

                const indent = ' '.repeat(indentLevel * indentSize);
                if (alignOperands) {
                    formattedLine = indent + '\t' + instructionPart + '\t' + operandsPart;
                } else {
                    formattedLine = indent + '\t' + instructionPart + ' ' + operandsPart;
                }

                indentLevel = 0;
            } else {
                const indent = ' '.repeat(indentLevel * indentSize);
                formattedLine = indent + '\t' + line.trim();
            }
        }

        formattedLines.push(formattedLine);
    }

    return formattedLines.join('\n');
}

function activate(context) {
    console.log('OC32 Assembly Formatter activated');

    const formatCommand = vscode.commands.registerCommand('oc32-formatter.formatDocument', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit(edit => {
                const text = editor.document.getText();
                const options = {
                    tabSize: editor.options.tabSize || 4,
                    uppercaseKeywords: vscode.workspace.getConfiguration('oc32-formatter').get('uppercaseKeywords'),
                    alignOperands: vscode.workspace.getConfiguration('oc32-formatter').get('alignOperands')
                };
                const formattedText = formatOC32Assembly(text, options);
                const range = new vscode.Range(
                    editor.document.positionAt(0),
                    editor.document.positionAt(text.length)
                );
                edit.replace(range, formattedText);
            });
        }
    });

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('oc32asm', {
            provideDocumentFormattingEdits(document, options, token) {
                const text = document.getText();
                const formattedText = formatOC32Assembly(text, {
                    indentSize: options.tabSize,
                    uppercaseKeywords: vscode.workspace.getConfiguration('oc32-formatter').get('uppercaseKeywords'),
                    alignOperands: vscode.workspace.getConfiguration('oc32-formatter').get('alignOperands')
                });
                return [
                    vscode.TextEdit.replace(
                        new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(text.length)
                        ),
                        formattedText
                    )
                ];
            }
        })
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('asm', {
            provideDocumentFormattingEdits(document, options, token) {
                const text = document.getText();
                const formattedText = formatOC32Assembly(text, {
                    indentSize: options.tabSize,
                    uppercaseKeywords: vscode.workspace.getConfiguration('oc32-formatter').get('uppercaseKeywords'),
                    alignOperands: vscode.workspace.getConfiguration('oc32-formatter').get('alignOperands')
                });
                return [
                    vscode.TextEdit.replace(
                        new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(text.length)
                        ),
                        formattedText
                    )
                ];
            }
        })
    );

    context.subscriptions.push(formatCommand);
}

function deactivate() {}

module.exports = { activate, deactivate };
