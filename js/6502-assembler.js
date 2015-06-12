(function (scope) {
    var ASM6502 = {},
        modeIndex = [
            'A',
            'IMM',
            'ZP',
            'ZPX',
            'ZPY',
            'ABS',
            'ABX',
            'ABY',
            'IND',
            'IDX',
            'IDY',
            'IMP',
            'REL'
        ],
        lookupTable = {
            // Source of lookup table:
            // https://github.com/skilldrick/easy6502/blob/gh-pages/simulator/assembler.js
            //MN   A    IMM    ZP    ZPX   ZPY   ABS   ABX   ABY  IND   IDX   IDY   IMP   REL
            ADC: [null, 0x69, 0x65, 0x75, null, 0x6d, 0x7d, 0x79, null, 0x61, 0x71, null, null],
            AND: [null, 0x29, 0x25, 0x35, null, 0x2d, 0x3d, 0x39, null, 0x21, 0x31, null, null],
            ASL: [null, null, 0x06, 0x16, null, 0x0e, 0x1e, null, null, null, null, 0x0a, null],
            BIT: [null, null, 0x24, null, null, 0x2c, null, null, null, null, null, null, null],
            BPL: [null, null, null, null, null, null, null, null, null, null, null, null, 0x10],
            BMI: [null, null, null, null, null, null, null, null, null, null, null, null, 0x30],
            BVC: [null, null, null, null, null, null, null, null, null, null, null, null, 0x50],
            BVS: [null, null, null, null, null, null, null, null, null, null, null, null, 0x70],
            BCC: [null, null, null, null, null, null, null, null, null, null, null, null, 0x90],
            BCS: [null, null, null, null, null, null, null, null, null, null, null, null, 0xb0],
            BNE: [null, null, null, null, null, null, null, null, null, null, null, null, 0xd0],
            BEQ: [null, null, null, null, null, null, null, null, null, null, null, null, 0xf0],
            BRK: [null, null, null, null, null, null, null, null, null, null, null, 0x00, null],
            CMP: [0xc9, 0xc5, 0xd5, null, 0xcd, 0xdd, 0xd9, null, null, 0xc1, 0xd1, null, null],
            CPX: [0xe0, 0xe4, null, null, 0xec, null, null, null, null, null, null, null, null],
            CPY: [0xc0, 0xc4, null, null, 0xcc, null, null, null, null, null, null, null, null],
            DEC: [null, 0xc6, 0xd6, null, 0xce, 0xde, null, null, null, null, null, null, null],
            EOR: [0x49, 0x45, 0x55, null, 0x4d, 0x5d, 0x59, null, null, 0x41, 0x51, null, null],
            CLC: [null, null, null, null, null, null, null, null, null, null, null, 0x18, null],
            SEC: [null, null, null, null, null, null, null, null, null, null, null, 0x38, null],
            CLI: [null, null, null, null, null, null, null, null, null, null, null, 0x58, null],
            SEI: [null, null, null, null, null, null, null, null, null, null, null, 0x78, null],
            CLV: [null, null, null, null, null, null, null, null, null, null, null, 0xb8, null],
            CLD: [null, null, null, null, null, null, null, null, null, null, null, 0xd8, null],
            SED: [null, null, null, null, null, null, null, null, null, null, null, 0xf8, null],
            INC: [null, 0xe6, 0xf6, null, 0xee, 0xfe, null, null, null, null, null, null, null],
            JMP: [null, null, null, null, 0x4c, null, null, 0x6c, null, null, null, null, null],
            JSR: [null, null, null, null, 0x20, null, null, null, null, null, null, null, null],
            LDA: [0xa9, 0xa5, 0xb5, null, 0xad, 0xbd, 0xb9, null, null, 0xa1, 0xb1, null, null],
            LDX: [0xa2, 0xa6, null, 0xb6, 0xae, null, 0xbe, null, null, null, null, null, null],
            LDY: [0xa0, 0xa4, 0xb4, null, 0xac, 0xbc, null, null, null, null, null, null, null],
            LSR: [null, 0x46, 0x56, null, 0x4e, 0x5e, null, null, null, null, null, 0x4a, null],
            NOP: [null, null, null, null, null, null, null, null, null, null, null, 0xea, null],
            ORA: [0x09, 0x05, 0x15, null, 0x0d, 0x1d, 0x19, null, null, 0x01, 0x11, null, null],
            TAX: [null, null, null, null, null, null, null, null, null, null, null, 0xaa, null],
            TXA: [null, null, null, null, null, null, null, null, null, null, null, 0x8a, null],
            DEX: [null, null, null, null, null, null, null, null, null, null, null, 0xca, null],
            INX: [null, null, null, null, null, null, null, null, null, null, null, 0xe8, null],
            TAY: [null, null, null, null, null, null, null, null, null, null, null, 0xa8, null],
            TYA: [null, null, null, null, null, null, null, null, null, null, null, 0x98, null],
            DEY: [null, null, null, null, null, null, null, null, null, null, null, 0x88, null],
            INY: [null, null, null, null, null, null, null, null, null, null, null, 0xc8, null],
            ROR: [null, 0x66, 0x76, null, 0x6e, 0x7e, null, null, null, null, null, 0x6a, null],
            ROL: [null, 0x26, 0x36, null, 0x2e, 0x3e, null, null, null, null, null, 0x2a, null],
            RTI: [null, null, null, null, null, null, null, null, null, null, null, 0x40, null],
            RTS: [null, null, null, null, null, null, null, null, null, null, null, 0x60, null],
            SBC: [0xe9, 0xe5, 0xf5, null, 0xed, 0xfd, 0xf9, null, null, 0xe1, 0xf1, null, null],
            STA: [null, 0x85, 0x95, null, 0x8d, 0x9d, 0x99, null, null, 0x81, 0x91, null, null],
            TXS: [null, null, null, null, null, null, null, null, null, null, null, 0x9a, null],
            TSX: [null, null, null, null, null, null, null, null, null, null, null, 0xba, null],
            PHA: [null, null, null, null, null, null, null, null, null, null, null, 0x48, null],
            PLA: [null, null, null, null, null, null, null, null, null, null, null, 0x68, null],
            PHP: [null, null, null, null, null, null, null, null, null, null, null, 0x08, null],
            PLP: [null, null, null, null, null, null, null, null, null, null, null, 0x28, null],
            STX: [null, 0x86, null, 0x96, 0x8e, null, null, null, null, null, null, null, null],
            STY: [null, 0x84, 0x94, null, 0x8c, null, null, null, null, null, null, null, null],
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
        macros = [
            'BYTE', 'WORD'
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
                                } else if (peek(0) == '\n' || peek(0).search(/( |\t)+/g) >= 0 || peek(0) == ')' || peek(0) == ',') {
                                    tokens.push({
                                        type: 'label',
                                        value: str
                                    });
                                } else {
                                    errors.push('Invalid component ' + str);
                                    break;
                                }
                                --index;
                            } else if (peek(0).search(/( |\t)+/g) >= 0) {
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
                            } else if (peek(0) == '.' && peek(1) != null && peek(1).search(/[a-zA-Z]/g) >= 0) {
                                ++index;
                                var str = '';
                                while (peek(0).search(/[a-zA-Z]/g) >= 0) {
                                    str += peek(0);
                                    ++index;
                                }
                                str = str.toUpperCase();
                                if (macros.indexOf(str) >= 0) {
                                    tokens.push({
                                        type: 'macro',
                                        value: str
                                    });
                                } else {
                                    errors.push('Invalid component ' + str);
                                    break;
                                }
                                --index;
                            } else if (peek(0).search(/[0-9]/g) >= 0) {
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
                                if (token.type == 'register' && token.value == 'A') {
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
                        console.log(token, index, tokenStream);
                        throw 'Incorrect addressing mode';
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
                        throw 'Invalid address mode.';
                    },
                    parse = function () {
                        if (tokenStream instanceof Array) {
                            while (!eof(0) && peek(0) != null) {
                                var token = peek(0);
                                var seq = {};
                                if (token.type == 'mnemonic') {
                                    seq.type = 'op';
                                    seq.action = token.value;
                                    ++index;
                                    seq.mode = getAddressingMode();
                                    seq.addr = getAddressValue(seq.mode);
                                    sequence.push(seq);
                                } else if (token.type == 'label') {
                                    seq.type = 'labeling';
                                    seq.labelName = token.value;
                                    sequence.push(seq);
                                } else if (token.type == 'macro') {
                                    seq.type = 'macrouse';
                                    seq.macroName = token.value;
                                    seq.args = [];
                                    ++index;
                                    var token = peek(0);
                                    while (!eof(0) && token != null && token.type != '\n') {
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
                                    sequence.push(seq);
                                } else if (token.type != 'newline') {
                                    console.log(token);
                                    throw 'Invalid token "' + token.type + '" at address ' + index;
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
                  return {
                    getObjectCode: function () {
                        if (sequence instanceof Array) {
                            if (sequence.length > 0) {
                                
                            } else {
                                console.log('Empty program.');
                            }
                        } else {
                            throw 'Invalid sequence stream.';
                        }
                        return null;
                    }  
                  };
            };
        }());
    ASM6502.processSource = function (source) {
        return (OCGen(Lexer(source).getTokens()).getSequence()).getObjectCode();
    };
    scope.ASM6502 = ASM6502;
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));