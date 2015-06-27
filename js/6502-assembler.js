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
    var ASM6502 = {},
        modeIndex = [
            'IMM',
            'ZP',
            'ZPX',
            'ZPY',
            'AB',
            'ABX',
            'ABY',
            'IND',
            'IDX',
            'IDY',
            'IMP',
            'REL',
            'A'
        ],
        lookupTable = {
            // Source of lookup table:
            // https://github.com/skilldrick/easy6502/blob/gh-pages/simulator/assembler.js
            //MN  IMM    ZP    ZPX   ZPY   AB    ABX   ABY  IND   IDX   IDY   IMP   REL    A
            ADC: [0x69, 0x65, 0x75, null, 0x6d, 0x7d, 0x79, null, 0x61, 0x71, null, null, null],
            AND: [0x29, 0x25, 0x35, null, 0x2d, 0x3d, 0x39, null, 0x21, 0x31, null, null, null],
            ASL: [null, 0x06, 0x16, null, 0x0e, 0x1e, null, null, null, null, null, null, 0x0a],
            BIT: [null, 0x24, null, null, 0x2c, null, null, null, null, null, null, null, null],
            BPL: [null, null, null, null, null, null, null, null, null, null, null, 0x10, null],
            BMI: [null, null, null, null, null, null, null, null, null, null, null, 0x30, null],
            BVC: [null, null, null, null, null, null, null, null, null, null, null, 0x50, null],
            BVS: [null, null, null, null, null, null, null, null, null, null, null, 0x70, null],
            BCC: [null, null, null, null, null, null, null, null, null, null, null, 0x90, null],
            BCS: [null, null, null, null, null, null, null, null, null, null, null, 0xb0, null],
            BNE: [null, null, null, null, null, null, null, null, null, null, null, 0xd0, null],
            BEQ: [null, null, null, null, null, null, null, null, null, null, null, 0xf0, null],
            BRK: [null, null, null, null, null, null, null, null, null, null, 0x00, null, null],
            CMP: [0xc9, 0xc5, 0xd5, null, 0xcd, 0xdd, 0xd9, null, 0xc1, 0xd1, null, null, null],
            CPX: [0xe0, 0xe4, null, null, 0xec, null, null, null, null, null, null, null, null],
            CPY: [0xc0, 0xc4, null, null, 0xcc, null, null, null, null, null, null, null, null],
            DEC: [null, 0xc6, 0xd6, null, 0xce, 0xde, null, null, null, null, null, null, null],
            EOR: [0x49, 0x45, 0x55, null, 0x4d, 0x5d, 0x59, null, 0x41, 0x51, null, null, null],
            CLC: [null, null, null, null, null, null, null, null, null, null, 0x18, null, null],
            SEC: [null, null, null, null, null, null, null, null, null, null, 0x38, null, null],
            CLI: [null, null, null, null, null, null, null, null, null, null, 0x58, null, null],
            SEI: [null, null, null, null, null, null, null, null, null, null, 0x78, null, null],
            CLV: [null, null, null, null, null, null, null, null, null, null, 0xb8, null, null],
            CLD: [null, null, null, null, null, null, null, null, null, null, 0xd8, null, null],
            SED: [null, null, null, null, null, null, null, null, null, null, 0xf8, null, null],
            INC: [null, 0xe6, 0xf6, null, 0xee, 0xfe, null, null, null, null, null, null, null],
            JMP: [null, null, null, null, 0x4c, null, null, 0x6c, null, null, null, null, null],
            JSR: [null, null, null, null, 0x20, null, null, null, null, null, null, null, null],
            LDA: [0xa9, 0xa5, 0xb5, null, 0xad, 0xbd, 0xb9, null, 0xa1, 0xb1, null, null, null],
            LDX: [0xa2, 0xa6, null, 0xb6, 0xae, null, 0xbe, null, null, null, null, null, null],
            LDY: [0xa0, 0xa4, 0xb4, null, 0xac, 0xbc, null, null, null, null, null, null, null],
            LSR: [null, 0x46, 0x56, null, 0x4e, 0x5e, null, null, null, null, 0x4a, null, null],
            NOP: [null, null, null, null, null, null, null, null, null, null, 0xea, null, null],
            ORA: [0x09, 0x05, 0x15, null, 0x0d, 0x1d, 0x19, null, 0x01, 0x11, null, null, null],
            TAX: [null, null, null, null, null, null, null, null, null, null, 0xaa, null, null],
            TXA: [null, null, null, null, null, null, null, null, null, null, 0x8a, null, null],
            DEX: [null, null, null, null, null, null, null, null, null, null, 0xca, null, null],
            INX: [null, null, null, null, null, null, null, null, null, null, 0xe8, null, null],
            TAY: [null, null, null, null, null, null, null, null, null, null, 0xa8, null, null],
            TYA: [null, null, null, null, null, null, null, null, null, null, 0x98, null, null],
            DEY: [null, null, null, null, null, null, null, null, null, null, 0x88, null, null],
            INY: [null, null, null, null, null, null, null, null, null, null, 0xc8, null, null],
            ROR: [null, 0x66, 0x76, null, 0x6e, 0x7e, null, null, null, null, null, null, 0x6a],
            ROL: [null, 0x26, 0x36, null, 0x2e, 0x3e, null, null, null, null, null, null, 0x2a],
            RTI: [null, null, null, null, null, null, null, null, null, null, 0x40, null, null],
            RTS: [null, null, null, null, null, null, null, null, null, null, 0x60, null, null],
            SBC: [0xe9, 0xe5, 0xf5, null, 0xed, 0xfd, 0xf9, null, 0xe1, 0xf1, null, null, null],
            STA: [null, 0x85, 0x95, null, 0x8d, 0x9d, 0x99, null, 0x81, 0x91, null, null, null],
            TXS: [null, null, null, null, null, null, null, null, null, null, 0x9a, null, null],
            TSX: [null, null, null, null, null, null, null, null, null, null, 0xba, null, null],
            PHA: [null, null, null, null, null, null, null, null, null, null, 0x48, null, null],
            PLA: [null, null, null, null, null, null, null, null, null, null, 0x68, null, null],
            PHP: [null, null, null, null, null, null, null, null, null, null, 0x08, null, null],
            PLP: [null, null, null, null, null, null, null, null, null, null, 0x28, null, null],
            STX: [null, 0x86, null, 0x96, 0x8e, null, null, null, null, null, null, null, null],
            STY: [null, 0x84, 0x94, null, 0x8c, null, null, null, null, null, null, null, null]
        },
        mnemonics = [
            'ADC', 'AND', 'ASL', 'BCC',
            'BCS', 'BEQ', 'BIT', 'BMI',
            'BNE', 'BPL', 'BRK', 'BVC',
            'BVS', 'CLC', 'CLD', 'CLI',
            'CLV', 'CMP', 'CPX', 'CPY',
            'DEC', 'DEX', 'DEY', 'EOR',
            'INC', 'INX', 'INY', 'JMP',
            'JSR', 'LDA', 'LDX', 'LDY',
            'LSR', 'NOP', 'ORA', 'PHA',
            'PHP', 'PLA', 'PLP', 'ROL',
            'ROR', 'RTI', 'RTS', 'SBC',
            'SEC', 'SED', 'SEI', 'STA',
            'STX', 'STY', 'TAX', 'TAY',
            'TSX', 'TXA', 'TXS', 'TYA'
        ],
        directives = [
            'BYTE', 'WORD'
        ],
        branchNmemonics = [
            'BCC',
            'BCS',
            'BEQ',
            'BMI',
            'BNE',
            'BPL',
            'BVC',
            'BVS'
        ],
        Lexer = (function () {
            return function (source) {
                var index = 0,
                    tokens = [],
                    errors = [],
                    eof = function (step) {
                        return index + step >= source.length;
                    },
                    peek = function (step) {
                        step = step || 0;
                        if (!eof(step)) {
                            return source[index + step];
                        }
                        return null;
                    },
                    lex = function () {
                        while (!eof(0) && peek(0) != null) {
                            if (peek(0) == ';') {
                                while (!eof(0) && peek(0) != '\n') {
                                    ++index;
                                }
                                --index;
                            } else if (peek(0) == '"') {
                                ++index;
                                while (!eof(0) && peek(0) != '"') {
                                    tokens.push({
                                        type: 'immediate_dec',
                                        value: '' + peek(0).charCodeAt(0) & 0xFF
                                    });
                                    tokens.push({
                                        type: 'comma',
                                        value: ','
                                    });
                                    ++index;
                                }
                                if (peek(0) != '"') {
                                    throw 'Missing " in string literal';
                                }
                            } else if (peek(0) == "'") {
                                ++index;
                                if (peek(1) == "'") {
                                    tokens.push({
                                        type: 'immediate_dec',
                                        value: '' + peek(0).charCodeAt(0) & 0xFF
                                    });
                                    index++;
                                } else {
                                    throw 'Missing \' in char literal';
                                }
                            } else if (peek(0) == '*') {
                                tokens.push({
                                    type: 'asterisk',
                                    value: '*'
                                });
                            } else if (peek(0) == '=') {
                                tokens.push({
                                    type: 'equal',
                                    value: '='
                                });
                            } else if (peek(0) == '\n') {
                                tokens.push({
                                    type: 'newline',
                                    value: peek(0)
                                });
                            } else if (peek(0).search(/[a-zA-Z]/g) >= 0) {
                                var str = '';
                                while (!eof(0) && peek(0).search(/[a-zA-Z]/g) >= 0) {
                                    str += peek(0);
                                    ++index;
                                }
                                str = str.toUpperCase();
                                if (mnemonics.indexOf(str) >= 0) {
                                    tokens.push({
                                        type: 'mnemonic',
                                        value: str
                                    });
                                } else if (str.length == 1 && str.search(/(X|Y|A)/g) >= 0) {
                                    tokens.push({
                                        type: 'register',
                                        value: str
                                    });
                                } else if (peek(0) != null && (peek(0) == '\n' || peek(0).search(/( |\t)+/g) >= 0 || peek(0) == ')' || peek(0) == ',' || peek(0) == ':' )) {
                                    if (peek(0) == ':') {
                                        tokens.push({
                                            type: 'label_dec',
                                            value: str
                                        });
                                    } else {
                                        tokens.push({
                                            type: 'label',
                                            value: str
                                        });
                                    }
                                } else {
                                    errors.push('Invalid component ' + str);
                                    break;
                                }
                                --index;
                            } else if (!eof(0) && peek(0).search(/( |\t)+/g) >= 0) {
                                while (!eof(0) && peek(0).search(/( |\t)+/g) >= 0) {
                                    ++index;
                                }
                                /* tokens.push({
                                     type: 'space',
                                     value: ''
                                 });*/
                                --index;
                            } else if (peek(0) == ',') {
                                tokens.push({
                                    type: 'comma',
                                    value: ','
                                });
                            } else if (peek(0) == '#') {
                                ++index;
                                if (peek(0) == '$') {
                                    ++index;
                                    var st = '';
                                    while (!eof(0) && peek(0).search(/([\da-fA-F])/g) >= 0) {
                                        st += peek(0);
                                        ++index;
                                    }
                                    tokens.push({
                                        type: 'immediate_hex',
                                        value: st
                                    });
                                    --index;
                                } else if (!eof(0) && peek(0).search(/[0-9]/g) >= 0) {
                                    var str = '';
                                    while (!eof(0) && peek(0).search(/[0-9]/g) >= 0) {
                                        str += peek(0);
                                        ++index;
                                    }
                                    --index;
                                    tokens.push({
                                        type: 'immediate_dec',
                                        value: str
                                    });
                                } else {
                                    errors.push('Invalid immediate mode.');
                                }
                            } else if (peek(0) == '$') {
                                ++index;
                                var st = '';
                                while (!eof(0) && peek(0).search(/([\da-fA-F])/g) >= 0) {
                                    st += peek(0);
                                    ++index;
                                }
                                tokens.push({
                                    type: 'address_hex',
                                    value: st
                                });
                                --index;
                            } else if (peek(0) == '(') {
                                tokens.push({
                                    type: 'lparen',
                                    value: '('
                                });
                            } else if (peek(0) == ')') {
                                tokens.push({
                                    type: 'rparen',
                                    value: ')'
                                });
                            } else if (peek(0) != null && peek(0) == '.' && peek(1) != null && peek(1).search(/[a-zA-Z]/g) >= 0) {
                                ++index;
                                var str = '';
                                while (peek(0) != null && peek(0).search(/[a-zA-Z]/g) >= 0) {
                                    str += peek(0);
                                    ++index;
                                }
                                str = str.toUpperCase();
                                if (directives.indexOf(str) >= 0) {
                                    tokens.push({
                                        type: 'directive',
                                        value: str
                                    });
                                } else {
                                    errors.push('Invalid component ' + str);
                                    break;
                                }
                                --index;
                            } else if (peek(0) != null && peek(0).search(/[0-9]/g) >= 0) {
                                var str = '';
                                while (peek(0) != null && peek(0).search(/[0-9]/g) >= 0) {
                                    str += peek(0);
                                    ++index;
                                }
                                tokens.push({
                                    type: 'immediate_dec',
                                    value: str
                                });
                                --index;
                            }
                            ++index;
                        }
                    };
                return {
                    getTokens: function () {
                        lex();
                        if (errors.length > 0) {
                            while (errors.length) {
                                throw errors.pop();
                            }
                            return null;
                        }
                        return tokens;
                    }
                };
            };
        }()),
        Parser = (function () {
            return function (tokenStream) {
                var index = 0,
                    sequence = [],
                    eof = function (step) {
                        return index + step >= tokenStream.length;
                    },
                    peek = function (step) {
                        if (!eof(step)) {
                            return tokenStream[index + step];
                        }
                        return null;
                    },
                    getAddressingMode = function () {
                        if (!eof(0) && peek(0) != null) {
                            var token = peek(0);
                            if (token.type == 'immediate_dec' || token.type == 'immediate_hex') {
                                return 'IMM';
                            } else {
                                if (token.type == 'register' && (token.value == 'A')) {
                                    return 'A';
                                } else if (token.type == 'address_hex') {
                                    if (token.value.length == 2) {
                                        token = peek(1);
                                        if (token != null && token.type == 'comma') {
                                            token = peek(2);
                                            if (token != null && token.type == 'register') {
                                                if (token.value == 'X') return 'ZPX';
                                                if (token.value == 'Y') return 'ZPY';
                                            }
                                        }
                                        return 'ZP';
                                    } else if (token.value.length == 4) {
                                        token = peek(1);
                                        if (token != null && token.type == 'comma') {
                                            token = peek(2);
                                            if (token != null && token.type == 'register') {
                                                if (token.value == 'X') return 'ABX';
                                                if (token.value == 'Y') return 'ABY';
                                            }
                                        }
                                        return 'AB';
                                    }
                                } else if (token.type == 'label' && peek(-1) != null && branchNmemonics.indexOf(peek(-1).value) < 0) {
                                    token = peek(1);
                                    if (token != null && token.type == 'comma') {
                                        token = peek(2);
                                        if (token != null && token.type == 'register') {
                                            if (token.value == 'X') return 'ABX';
                                            if (token.value == 'Y') return 'ABY';
                                        }
                                    }
                                    return 'AB';
                                } else if (token.type == 'lparen') {
                                    token = peek(1);
                                    if (token != null && peek(2) != null && peek(2).type == 'rparen' && peek(3) != null && peek(3).type != 'comma' && ((token.type == 'address_hex' && token.value.length == 4) || token.type == 'label')) {
                                        token = peek(2);
                                        if (token != null && token.type == 'rparen') {
                                            return 'IND';
                                        } else {
                                            throw 'Missing right paren.';
                                        }
                                    } else if (token != null && ((token.type == 'address_hex' && token.value.length == 2) || token.type == 'label')) {
                                        token = peek(2);
                                        if (token != null && token.type == 'comma') {
                                            token = peek(3);
                                            if (token != null && token.type == 'register' && token.value == 'X') {
                                                token = peek(4);
                                                if (token != null && token.type == 'rparen') {
                                                    return 'IDX';
                                                } else {
                                                    throw 'Missing right paren';
                                                }
                                            } else {
                                                throw 'Incorrect addressing mode.';
                                            }
                                        } else if (token != null && token.type == 'rparen') {
                                            token = peek(3);
                                            if (token != null && token.type == 'comma') {
                                                token = peek(4);
                                                if (token != null && token.type == 'register' && token.value == 'Y') {
                                                    return 'IDY';
                                                }
                                            } else {
                                                throw 'Incorrect addressing mode.';
                                            }
                                        } else {
                                            throw 'Incorrect addressing mode. Missing comma or paren';
                                        }
                                    }
                                } else if (token.type == 'newline') {
                                    return 'IMP';
                                } else if (token.type == 'label') {
                                    return 'REL';
                                } else {
                                    throw 'Incorrect addressing mode';
                                }
                            }
                        }
                        return 'IMP';
                    },
                    getAddressValue = function (mode) {
                        var arr = [],
                            token = peek(0);
                        switch (mode) {
                        case 'IMM':
                            if (token != null) {
                                if (token.type == 'immediate_hex') {
                                    token.value = parseInt(token.value, 16);
                                    arr.push(token);
                                } else if (token.type == 'immediate_dec') {
                                    token.value = parseInt(token.value);
                                    arr.push(token);
                                }
                            }
                            return arr;
                        case 'AB':
                            if (token.type == 'label') {
                                arr.push(token);
                                return arr;
                            }
                        case 'ZP':
                            if (token != null && token.type == 'address_hex') {
                                token.value = parseInt(token.value, 16);
                                arr.push(token);
                                return arr;
                            } else {
                                throw 'Invalid address';
                            }
                            break;
                        case 'ABX':
                        case 'ABY':
                            if (token.type == 'label') {
                                arr.push(token);
                                index += 2;
                                token = peek(0);
                                if (token != null && token.type == 'register') {
                                    arr.push(token);
                                }
                                return arr;
                            }
                        case 'ZPY':
                        case 'ZPX':
                            if (token != null && token.type == 'address_hex') {
                                token.value = parseInt(token.value, 16);
                                arr.push(token);
                                index += 2;
                                token = peek(0);
                                if (token != null && token.type == 'register') {
                                    arr.push(token);
                                }
                                return arr;
                            } else {
                                throw 'Invalid address';
                            }
                            break;
                        case 'IND':
                            if (token != null && token.type == 'lparen') {
                                ++index;
                                token = peek(0);
                                if (token != null && token.type == 'address_hex') {
                                    token.value = parseInt(token.value, 16);
                                    arr.push(token);
                                } else if (token != null && token.type == 'label') {
                                    arr.push(token);
                                } else {
                                    throw 'Invalid address';
                                }
                                ++index;
                                token = peek(0);
                                if (token == null || token.type != 'rparen') {
                                    throw 'Invalid address. Missing right paren.';
                                }
                                return arr;
                            }
                            break;
                        case 'IDX':
                            if (token != null && token.type == 'lparen') {
                                ++index;
                                token = peek(0);
                                if (token != null && (token.type == 'address_hex' || token.type == 'label')) {
                                    if (token.type == 'address_hex') {
                                        token.value = parseInt(token.value, 16);
                                    }
                                    arr.push(token);
                                    index += 1;
                                    token = peek(0);
                                    if (token == null || token.type != 'comma') {
                                        throw 'Invalid address. Missing comma.'
                                    }
                                    index += 1;
                                    token = peek(0);
                                    if (token != null && token.type == 'register') {
                                        arr.push(token);
                                    }
                                    ++index;
                                    token = peek(0);
                                    if (token == null || token.type != 'rparen') {
                                        throw 'Invalid address. Missing right paren.'
                                    }
                                    return arr;
                                } else {
                                    throw 'Invalid address';
                                }
                            } else {
                                throw 'Invalid address missing left paren';
                            }
                            break;
                        case 'IDY':
                            if (token != null && token.type == 'lparen') {
                                ++index;
                                token = peek(0);
                                if (token != null && (token.type == 'address_hex' || token.type == 'label')) {
                                    if (token.type == 'address_hex') {
                                        token.value = parseInt(token.value, 16);
                                    }
                                    arr.push(token);
                                    index += 1;
                                    token = peek(0);
                                    if (token == null || token.type != 'rparen') {
                                        throw 'Invalid address. Missing right paren.'
                                    }
                                    index += 1;
                                    token = peek(0);
                                    if (token == null || token.type != 'comma') {
                                        throw 'Invalid address. Missing comma.'
                                    }
                                    index += 1;
                                    token = peek(0);
                                    if (token != null && token.type == 'register') {
                                        arr.push(token);
                                    } else {
                                        throw 'Invalid address';
                                    }
                                    return arr;
                                } else {
                                    throw 'Invalid address';
                                }
                            } else {
                                throw 'Invalid address missing left paren';
                            }
                            break;
                        case 'IMP':
                            return [];
                        case 'A':
                            if (token != null && token.type == 'register' && token.value == 'A') {
                                arr.push(token);
                                return arr;
                            }
                        case 'REL':
                            if (token != null && token.type == 'label') {
                                arr.push(token);
                                return arr;
                            }

                        }
                        throw 'Invalid address mode ' + mode;
                    },
                    parse = function () {
                        if (tokenStream instanceof Array) {
                            while (!eof(0) && peek(0) != null) {
                                var token = peek(0);
                                var seq = {};
                                if (token.type == 'mnemonic') {
                                    seq.type = 'op';
                                    seq.opCode = token.value;
                                    ++index;
                                    seq.mode = getAddressingMode();
                                    seq.args = getAddressValue(seq.mode);
                                    if (seq.opCode != 'NOP') {
                                        sequence.push(seq);
                                    }
                                } else if (token.type == 'label_dec') {
                                    seq.type = 'labeling';
                                    seq.labelName = token.value;
                                    seq.args = [];
                                    sequence.push(seq);
                                } else if (token.type == 'label') {
                                    if (!eof(1) && peek(1).type == 'equal') {
                                        seq.type = 'macro_def';
                                        seq.macroName = token.value;
                                        seq.args = [];
                                        index += 2;
                                        if (peek(0) != null && peek(0).type == 'address_hex') {
                                            token = peek(0);
                                            token.value = parseInt(token.value, 16);
                                            seq.args.push(token);
                                        } else {
                                            throw 'Incorrect type of address.';
                                        }
                                        sequence.push(seq);                                      
                                    } else {
                                        throw 'Incorrect label definition of ' + token.value + '. Add colon (:) to the end.';
                                    }
                                } else if (token.type == 'directive') {
                                    seq.type = 'directiveuse';
                                    seq.directiveName = token.value;
                                    seq.args = [];
                                    ++index;
                                    var token = peek(0);
                                    while (!eof(0) && token != null &&
                                        token.type != 'mnemonic' &&
                                        token.type != 'label'  &&
                                        token.type != 'label_dec'  &&
                                        token.type != '\n') {

                                        if (token.type == 'address_hex') {
                                            token.value = parseInt(token.value, 16);
                                        } else if (token.type == 'immediate_dec') {
                                            token.value = parseInt(token.value);
                                        }
                                        if (token.type != 'comma' && token.type != 'newline') {
                                            seq.args.push(token);
                                        }
                                        ++index;
                                        token = peek(0);
                                    }
                                    --index;
                                    sequence.push(seq);
                                } else if (token.type == 'asterisk') {
                                    if (peek(1) != null && peek(1).type == 'equal') {
                                        seq.type = 'originset';
                                        seq.args = [];
                                        index += 2;
                                        if (peek(0) != null && peek(0).type == 'address_hex') {
                                            token = peek(0);
                                            token.value = parseInt(token.value, 16);
                                            seq.args.push(token);
                                        } else {
                                            throw 'Incorrect type of address.';
                                        }
                                        sequence.push(seq);
                                    } else {
                                        throw 'Missing assignment of start address.';
                                    }
                                } else if (token.type != 'newline') {
                                    throw 'Invalid token "' + token.value + '" at address ' + index;
                                }
                                ++index;
                            }
                        } else {
                            throw 'invalid token stream';
                        }
                    };

                return {
                    getSequence: function () {
                        parse();
                        return sequence;
                    }
                };
            };
        }()),
        OCGen = (function () {
            return function (sequence) {
                var index = 0,
                    labels = {},
                    objectCode = [],
                    macros = {},
                    origins = [],
                    eof = function (step) {
                        return (index + step >= sequence.length);
                    },
                    peek = function (step) {
                        if (!eof(step)) {
                            return sequence[index + step];
                        }
                        return null;
                    },
                    getSizeOfArgs = function (args, opcode) {
                        var size = 0,
                            val = 0,
                            tok;
                        for (var i = 0; i < args.length; ++i) {
                            tok = args[i];
                            if (tok.type == 'immediate_dec' || tok.type == 'immediate_hex' || tok.type == 'address_hex') {
                                val = tok.value;
                                if (val > 0xFF && val <= 0xFFFF) {
                                    size += 2;
                                } else if (val <= 0xFF) {
                                    size += 1;
                                } else {
                                    throw 'No support for 32 bit integer';
                                }
                            } else if (tok.type == 'label') {
                                if (branchNmemonics.indexOf(opcode) < 0) {
                                    size += 2;
                                } else if (branchNmemonics.indexOf(opcode) >= 0) {
                                    size += 1;
                                }
                            }
                        }
                        return size;
                    },
                    readLables = function () {
                        var idx,
                            addr = 0,
                            oc;
                        for (idx = 0; idx < sequence.length; ++idx) {
                            if (sequence[idx].type == 'macro_def') {
                                macros[sequence[idx].macroName] = sequence[idx].args[0].value;
                                continue;
                            }
                            if (sequence[idx].type == 'op') {
                                oc = sequence[idx].opCode;
                            } else {
                                oc = '';
                            }
                            addr += getSizeOfArgs(sequence[idx].args, oc);
                            if (sequence[idx].type == 'labeling') {
                                labels[sequence[idx].labelName] = addr;
                            } else if (sequence[idx].type != 'directiveuse') {
                                ++addr;
                            }
                        }
                    },
                    resolveByte = function (token, opcode) {
                        if (token.type == 'address_hex' ||
                            token.type == 'immediate_dec' ||
                            token.type == 'immediate_hex') {
                            if (token.value > 0xFF) {
                                var b = [];
                                b.push((token.value / 256) | 0);
                                b.push((token.value & 255) | 0);
                                return b;
                            }
                            return token.value;
                        } else if (token.type == 'register') {
                            // null value shouldn't be added to the oc
                            return null;
                        } else if (token.type == 'label') {
                            if (token.value in labels) {
                                if (branchNmemonics.indexOf(opcode) < 0) {
                                    var b = [];
                                    b.push((labels[token.value] / 256) | 0);
                                    b.push((labels[token.value] & 255) | 0);
                                    console.log(b);
                                    return b;
                                } else {
                                    return (labels[token.value] - objectCode.length - 1) & 0xFF;
                                }
                            } else if (token.value in macros) {
                                 if (branchNmemonics.indexOf(opcode) < 0) {
                                    var b = [];
                                    b.push((macros[token.value] / 256) | 0);
                                    b.push((macros[token.value] & 255) | 0);
                                    return b;
                                } else {
                                    throw 'Invalid addressing';
                                }
                            }
                            throw 'There is no ' + token.value + ' identifier.';
                        } else {
                            throw 'Can\'t resolve byte of type ' + token.type;
                        }
                    },
                    lookOpAddress = function (opcode, addrmode) {
                        var idxmode = modeIndex.indexOf(addrmode);
                        if (idxmode >= 0) {
                            if (opcode in lookupTable) {
                                return lookupTable[opcode][idxmode];
                            } else {
                                throw 'Invalid Op Code ' + opcode;
                            }
                        } else {
                            throw 'Invalid address mode ' + addrmode + ' for opcode ' + opcode;
                        }
                    },
                    gen = function () {
                        while (!eof(0) && peek(0) != null) {
                            var seq = peek(0);
                            if (seq.type == 'op') {
                                var addr = lookOpAddress(seq.opCode, seq.mode);
                                if (addr != null) {
                                    objectCode.push(addr);
                                    var args = seq.args;
                                    for (var i = 0; i < args.length; ++i) {
                                        var b = resolveByte(args[i], seq.opCode);
                                        if (b != null) {
                                            if (b instanceof Array) {
                                                if (seq.mode == 'AB' || seq.mode == 'IND' || seq.mode == 'ABX' || seq.mode == 'ABY') {
                                                    objectCode.push(b.pop());
                                                    objectCode.push(b.pop());
                                                } else {
                                                    throw 'Invalid bit size in argument.';
                                                }
                                            } else {
                                                objectCode.push(b);
                                            }
                                        }
                                    }
                                } else {
                                    throw 'Invalid OpCode ' + seq.opCode + ' with address mode ' + seq.mode;
                                }
                            } else if (seq.type == 'directiveuse') {
                                if (seq.args.length > 0) {
                                    for (var i = 0; i < seq.args.length; ++i) {
                                        var b = resolveByte(seq.args[i]);
                                        if (b instanceof Array && seq.directiveName == 'WORD') {
                                            objectCode.push(b.pop());
                                            objectCode.push(b.pop());
                                        } else if (typeof b == 'number' && seq.directiveName == 'BYTE') {
                                            objectCode.push(b);
                                        } else {
                                            throw 'Incorrect byte size for directive ' + seq.directiveName;
                                        }
                                    }
                                } else {
                                    throw 'Not enough arguments for directive.';
                                }
                            } else if (seq.type == 'originset') {
                                throw 'No pointer setting supported.';
                                //console.log(seq);
                                //origins.push([objectCode.length, seq.args[0].value]);
                            } else if (seq.type != 'labeling' && seq.type != 'macro_def' && seq.type != 'originset') {
                                throw 'Invalid sequence of type ' + seq.type;
                            }
                            ++index;
                        }
                    };

                return {
                    getObjectCode: function () {
                        if (sequence instanceof Array) {
                            if (sequence.length > 0) {
                                readLables();
                                gen();
                                if (origins.length == 0) {
                                    origins.push([0, 0]);
                                } else if (origins[0][0] > 0) {
                                    origins.unshift([0, 0]);
                                }
                                return [objectCode, origins];
                            } else {
                                throw 'Empty program.';
                            }
                        } else {
                            throw 'Invalid sequence stream.';
                        }
                        return null;
                    }
                };
            };
        }()),
        lexer,
        parser,
        generator,
        origin = 0,
        dec8ToHex = function (dec) {
            var h = dec.toString(16);
            return ('00'.substr(0, 2 - h.length) + h).toUpperCase();
        },
        objectCodeDump = function (objectCode) {
            var index,
                str = '',
                len = objectCode.length,
                col = 0;
            for (index = 0; index < len; ++index) {
                str += dec8ToHex(objectCode[index]) + ' ';
                if (++col > 15) {
                    str += '\n';
                    col = 0;
                }
            }
            return str;
        };

    ASM6502.processSource = function (source) {
        var tokens, sequence, objectCode;
        lexer = Lexer(source);
        tokens = lexer.getTokens();
        parser = Parser(tokens);
        sequence = parser.getSequence();
        generator = OCGen(sequence);
        objectCode = generator.getObjectCode();
        return objectCode;
    };
    ASM6502.getOrigin = function (source) {
        return origin;
    };
    ASM6502.dumpObjectCodeToHex = function (objectCode) {
        return objectCodeDump(objectCode);
    };
    scope.ASM6502 = ASM6502;
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));