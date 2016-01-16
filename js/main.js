/*
 *   6502 JavaScript Emulator and Assembler
 *   http://damnbrain.com/
 *
 *   The MIT License (MIT)
 *
 *   Copyright (c) 2015 Felipe Alfonso
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 *
 */
(function (scope) {
    'use strict';
    var codeTag,
        errorOutputTag,
        objectCode,
        btnAsm,
        btnRun,
        btnReset,
        btnDebug,
        btnStop,
        btnDump,
        btnPause,
        btnStep,
        objOutput,
        dbgContainer,
        memFromInput,
        memCountInput,
        instrInput,
        memOutput,
        registerOutputTag,
        debugFlag = true,
        lastMessage,
        lastColor,
        allowHotkeys = false,
        breakpoint,
        mnemonics = {
            // ADC IM
            0x69: 'ADC',
            // ADC ZP
            0x65: 'ADC',
            // ADC ZPX   
            0x75: 'ADC',
            // ADC AB
            0x6D: 'ADC',
            // ADC ABX
            0x7D: 'ADC',
            // ADC ABY
            0x79: 'ADC',
            // ADC IDX
            0x61: 'ADC',
            // ADC IDY
            0x71: 'ADC',
            // AND IM
            0x29: 'AND',
            // AND ZP
            0x25: 'AND',
            // AND ZPX
            0x35: 'AND',
            // AND AB
            0x2D: 'AND',
            // AND ABX
            0x3D: 'AND',
            // AND ABY
            0x39: 'AND',
            // AND IDX
            0x21: 'AND',
            // AND IDY
            0x31: 'AND',
            // ASL ACC
            0x0A: 'ASL',
            // ASL ZP
            0x06: 'ASL',
            // ASL ZPX
            0x16: 'ASL',
            // ASL AB
            0x0E: 'ASL',
            // ASL ABX
            0x1E: 'ASL',
            // BCC REL
            0x90: 'BCC',
            // BCS REL
            0xB0: 'BCS',
            // BEQ REL
            0xF0: 'BEQ',
            // BIT ZP
            0x24: 'BIT',
            // BIP AB
            0x2C: 'BIT',
            // BMI REL
            0x30: 'BMI',
            // BNE REL
            0xD0: 'BNE',
            // BPL REL
            0x10: 'BPL',
            // BRK
            0x00: 'BRK',
            // BVC REL
            0x50: 'BVC',
            // BVS REL
            0x70: 'BVS',
            // CLC IMP
            0x18: 'CLC',
            // CLD IMP
            0xD8: 'CLD',
            // CLI IMP
            0x58: 'CLI',
            // CLV IMP
            0xB8: 'CLV',
            // CMP IM
            0xC9: 'CMP',
            // CMP ZP
            0xC5: 'CMP',
            // CMP ZPX
            0xD5: 'CMP',
            // CMP AB
            0xCD: 'CMP',
            // CMP ABX
            0xDD: 'CMP',
            // CMP ABY
            0xD9: 'CMP',
            // CMP IDX
            0xC1: 'CMP',
            // CMP IDY
            0xD1: 'CMP',
            // CPX IM
            0xE0: 'CPX',
            // CPX ZP
            0xE4: 'CPX',
            // CPX AB
            0xEC: 'CPX',
            // CPY IM
            0xC0: 'CPY',
            // CPY ZP
            0xC4: 'CPY',
            // CPY AB
            0xCC: 'CPY',
            // DEC ZP
            0xC6: 'DEC',
            // DEC ZPX
            0xD6: 'DEC',
            // DEC AB
            0xCE: 'DEC',
            // DEC ABX
            0xDE: 'DEC',
            // DEX
            0xCA: 'DEX',
            // DEY
            0x88: 'DEY',
            // EOR IM
            0x49: 'EOR',
            // EOR ZP
            0x45: 'EOR',
            // EOR ZPX
            0x55: 'EOR',
            // EOR AB
            0x4D: 'EOR',
            // EOR ABX
            0x5D: 'EOR',
            // EOR ABY
            0x59: 'EOR',
            // EOR IDX
            0x41: 'EOR',
            // EOR IDY
            0x51: 'EOR',
            // INC ZP
            0xE6: 'INC',
            // INC ZPX
            0xF6: 'INC',
            // INC AB
            0xEE: 'INC',
            // INC ABX
            0xFE: 'INC',
            // INX
            0xE8: 'INX',
            // INY
            0xC8: 'INY',
            // JMP AB
            0x4C: 'JMP',
            // JMP ID
            0x6C: 'JMP',
            // JSR AB
            0x20: 'JSR',
            // LDA IM
            0xA9: 'LDA',
            // LDA ZP
            0xA5: 'LDA',
            // LDA ZPX
            0xB5: 'LDA',
            // LDA AB
            0xAD: 'LDA',
            // LDA ABX
            0xBD: 'LDA',
            // LDA ABY
            0xB9: 'LDA',
            // LDA IDX
            0xA1: 'LDA',
            // LDA IDY
            0xB1: 'LDA',
            // LDX IM
            0xA2: 'LDX',
            // LDX ZP
            0xA6: 'LDX',
            // LDX ZPY
            0xB6: 'LDX',
            // LDX AB
            0xAE: 'LDX',
            // LDX ABY
            0xBE: 'LDX',
            // LDY IM
            0xA0: 'LDY',
            // LDY ZP
            0xA4: 'LDY',
            // LDY ZPX
            0xB4: 'LDY',
            // LDY AB
            0xAC: 'LDY',
            // LDY ABX
            0xBC: 'LDY',
            // LSR A
            0x4A: 'LSR',
            // LSR ZP
            0x46: 'LSR',
            // LSR ZPX
            0x56: 'LSR',
            // LSR AB
            0x4E: 'LSR',
            // LSR ABX
            0x5E: 'LSR',
            // NOP
            0xEA: 'NOP',
            // ORA IM
            0x09: 'ORA',
            // ORA ZP
            0x05: 'ORA',
            // ORA ZPX
            0x15: 'ORA',
            // ORA AB
            0x0D: 'ORA',
            // ORA ABX
            0x1D: 'ORA',
            // ORA ABY
            0x19: 'ORA',
            // ORA IDX
            0x01: 'ORA',
            // ORA IDY
            0x11: 'ORA',
            // PHA
            0x48: 'PHA',
            // PHP
            0x08: 'PHP',
            // PLA
            0x68: 'PLA',
            // PLP
            0x28: 'PLP',
            // ROL A
            0x2A: 'ROL',
            // ROL ZP
            0x26: 'ROL',
            // ROL ZPX
            0x36: 'ROL',
            // ROL AB
            0x2E: 'ROL',
            // ROL ABX
            0x3E: 'ROL',
            // ROR A
            0x6A: 'ROR',
            // ROR ZP
            0x66: 'ROR',
            // ROR ZPX
            0x76: 'ROR',
            // ROR AB
            0x6E: 'ROR',
            // ROR ABX
            0x7E: 'ROR',
            // RTI
            0x40: 'RTI',
            // RTS
            0x60: 'RTS',
            // SBC IM
            0xE9: 'SBC',
            // SBC ZP
            0xE5: 'SBC',
            // SBC ZPX
            0xF5: 'SBC',
            // SBC AB
            0xED: 'SBC',
            // SBC ABX
            0xFD: 'SBC',
            // SBC ABY
            0xF9: 'SBC',
            // SBC IDX
            0xE1: 'SBC',
            // SBC IDY
            0xF1: 'SBC',
            // SEC
            0x38: 'SEC',
            // SED
            0xF8: 'SED',
            // SEI
            0x78: 'SEI',
            // STA ZP
            0x85: 'STA',
            // STA ZPX
            0x95: 'STA',
            // STA AB
            0x8D: 'STA',
            // STA ABX
            0x9D: 'STA',
            // STA ABY
            0x99: 'STA',
            // STA IDX
            0x81: 'STA',
            // STA IDY
            0x91: 'STA',
            // STX ZP
            0x86: 'STX',
            // STX ZPX
            0x96: 'STX',
            // STX AB
            0x8E: 'STX',
            // STY ZP
            0x84: 'STY',
            // STY ZPX
            0x94: 'STY',
            // STY AB
            0x8C: 'STY',
            // TAX
            0xAA: 'TAX',
            // TAY
            0xA8: 'TAY',
            // TSX
            0xBA: 'TSX',
            // TXA
            0x8A: 'TXA',
            // TXS
            0x9A: 'TXS',
            // TYA
            0x98: 'TYA'
        },
        saveSourceCode = function () {
            try {
                localStorage.setItem('6502SourceCode3', codeTag.value);
            } catch (e) {
                // no access to localStorage.
            }
        },
        restoreSourceCode = function () {
            try {
                var data = localStorage.getItem('6502SourceCode3');
                if (data != null) {
                    codeTag.value = data;
                }
            } catch (e) {
                // no access to localStorage
            }
        },
        assembleSourceCode = function () {
            errorOutputTag.innerHTML = '';
            try {
                objectCode = ASM6502.processSource((codeTag.value + '\n').toUpperCase());
                btnRun.disabled = false;
                btnDump.disabled = false;
                errorOutputTag.innerHTML = 'Correctly assembled.';
                errorOutputTag.style.color = '#00AA11';
            } catch (e) {
                errorOutputTag.innerHTML = 'ASM ERROR: ' + e;
                errorOutputTag.style.color = '#ff0000';
                btnRun.disabled = true;
                btnDump.disabled = true;
            }
            saveSourceCode();
        },
        onButtonAssemble = function (e) {
            assembleSourceCode();
            CPU6502.burn(objectCode, 0x0000);
            CPU6502.setByte(0x0600, 0x9B);
            CPU6502.setByte(0xE401, 1);
        },
        onButtonStop = function (e) {
            CPU6502.stop();
            CPU6502.setByte(0x0600, 0x9B);
            CPU6502.setByte(0xE401, 1);
        },
        onButtonRun = function (e) {
            try {
                errorOutputTag.innerHTML = 'Running program';
                errorOutputTag.style.color = '#00AA11';
                CPU6502.run(breakpoint.value);
            } catch (e) {
                errorOutputTag.innerHTML = 'EMU ERROR: ' + e;
                errorOutputTag.style.color = '#ff0000';
                btnRun.disabled = true;
            }
        },
        onButtonReset = function (e) {
            CPU6502.reset();
        },
        dec8ToHex = function (dec) {
            var h = dec.toString(16);
            return ('00'.substr(0, 2 - h.length) + h).toUpperCase();
        },
        dec16ToHex = function (dec) {
            var h = dec.toString(16);
            return ('0000'.substr(0, 4 - h.length) + h).toUpperCase();
        },
        updateRegisterData = function () {
            setTimeout(updateRegisterData, 16);
            var log = CPU6502.popLog(),
                ins = CPU6502.currentInstruction();

            instrInput.value = ins in mnemonics ? mnemonics[ins] : 'NOP';
            instrInput.title = ins in mnemonics ? dec8ToHex(ins) : '$EA';
            if (log) {
                errorOutputTag.innerHTML = log;
                errorOutputTag.style.color = '#00AA11';
            }
            if (debugFlag == true) {
                registerOutputTag.innerHTML = CPU6502.dumpRegisters();
                var from = parseInt(memFromInput.value, 16);
                var count = parseInt(memCountInput.value);
                if (!isNaN(from) && !isNaN(count)) {
                    if (from + count < CPU6502.RAM.length - 1) {
                        memOutput.innerHTML = CPU6502.dumpMemory(from, count, 16);
                    }
                }
            }
        },
        onKeyDownInEditor = function (e) {
            if (e.keyCode == 9) {
                e.preventDefault();
                var s = this.selectionStart;
                this.value = this.value.substring(0, this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
                this.selectionEnd = s + 1;
            }
        },
        onKeyUpInEditor = function (e) {
            saveSourceCode();
            assembleSourceCode();
        },
        onButtonDebug = function (e) {
            debugFlag = btnDebug.checked;
            if (debugFlag) {
                dbgContainer.style.display = 'inline';
            } else {
                dbgContainer.style.display = 'none';
            }
        },
        checkMemoryLimits = function () {
            var from = parseInt(memFromInput.value, 16);
            var count = parseInt(memCountInput.value);
            if (!isNaN(from) && !isNaN(count)) {
                if (from + count < CPU6502.RAM.length) {
                    if (lastColor && lastMessage) {
                        errorOutputTag.innerHTML = lastMessage;
                        errorOutputTag.style.color = lastColor;
                        lastColor = lastMessage = undefined;
                    }
                } else {
                    if (!lastColor && !lastMessage) {
                        lastMessage = errorOutputTag.innerHTML;
                        lastColor = errorOutputTag.style.color;
                    }
                    errorOutputTag.innerHTML = 'DBG ERROR: Out of memory range.';
                    errorOutputTag.style.color = '#ff0000';
                }
            }
        },
        onFromChanged = function (e) {
            checkMemoryLimits();
        },
        onCountChanged = function (e) {
            checkMemoryLimits();
        },
        onBtnDump = function (e) {
            objOutput.innerHTML = ASM6502.dumpObjectCodeToHex(objectCode[0]);
            document.getElementById('size').innerHTML = objectCode[0].length + ' BYTES';
        },
        onButtonPause = function (e) {
            CPU6502.pause();
        },
        onButtonStep = function (e) {
            CPU6502.step();
        },
        setEventHandlers = function () {
            btnAsm.addEventListener('click', onButtonAssemble);
            btnRun.addEventListener('click', onButtonRun);
            btnReset.addEventListener('click', onButtonReset);
            codeTag.addEventListener('keydown', onKeyDownInEditor);
            codeTag.addEventListener('keyup', onKeyUpInEditor);
            btnDebug.addEventListener('click', onButtonDebug);
            memFromInput.addEventListener('keyup', onFromChanged);
            memCountInput.addEventListener('keyup', onCountChanged);
            btnDump.addEventListener('click', onBtnDump);
            btnPause.addEventListener('click', onButtonPause);
            btnStep.addEventListener('click', onButtonStep);
            updateRegisterData();
        },
        showSpecsPopup = function () {
            var w = window.open('', '', 'width=400,height=150');
            w.document.write('<div style="font-family:Verdana;font-size:12px;"><b><u>Specs:</u></b><br>' +
                '- 64 KB of memory.<br>' +
                '- Screen memory starts at $F100 and ends at $F4FF.<br>' +
                '- Text memory starts at $0600 and ends at $09FF.<br>' +
                '- Background color is defined at address $E400.<br>' +
                '- Text color is defined at address $E401.<br>' +
                '- Color values go from $0 to $F.<br>' +
                '- Input address is $E300.<br></div>');
            w.document.title = '6502 Emulator Specs';
            w.document.close();
        };
    scope.showSpecsPopup = showSpecsPopup;
    scope.addEventListener('load', function () {
        codeTag = document.getElementById('source');
        errorOutputTag = document.getElementById('error-output');
        btnAsm = document.getElementById('btn-asm');
        btnRun = document.getElementById('btn-run');
        btnReset = document.getElementById('btn-reset');
        btnDebug = document.getElementById('btn-debug');
        registerOutputTag = document.getElementById('register-output');
        memFromInput = document.getElementById('mem-from');
        memCountInput = document.getElementById('mem-count');
        memOutput = document.getElementById('memory-output');
        btnDump = document.getElementById('btn-dump');
        objOutput = document.getElementById('object-output');
        dbgContainer = document.getElementById('debug');
        btnPause = document.getElementById('btn-pause');
        btnStep = document.getElementById('btn-step');
        instrInput = document.getElementById('instr');
        breakpoint = document.getElementById('breakpoint');
        btnRun.disabled = false;
        btnDump.disabled = false;
        btnDebug.checked = true;
        onButtonDebug(null);
        setEventHandlers();
        restoreSourceCode();
        assembleSourceCode();
        breakpoint.value = dec16ToHex(parseInt(breakpoint.value));
        window.addEventListener('keydown', function (e) {
            if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                onButtonAssemble();
                e.preventDefault();
                return false;
            }
            if (e.keyCode == 8) {
                if (!allowHotkeys) return;
                e.preventDefault();
            }

        });
        codeTag.addEventListener('focus', function (e) {
            allowHotkeys = false;
        });
        codeTag.addEventListener('blur', function (e) {
            allowHotkeys = true;
        });

        function readSingleFile(e) {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                var contents = e.target.result;
                displayContents(contents);
            };
            reader.readAsText(file);
        }

        function displayContents(contents) {
            CPU6502.stop();
            CPU6502.reset();
            codeTag.value = contents;
            CPU6502.burn(objectCode, 0x0000);
            CPU6502.setByte(0x0600, 0x9B);
            CPU6502.setByte(0xE401, 1);
            document.getElementById('file-input').value = "";
        }

        document.getElementById('file-input')
            .addEventListener('change', readSingleFile, false);
    });
}(window));