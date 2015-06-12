(function (scope) {
    var ASM6502 = {},
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
                                } else if (peek(0) == '\n' || peek(0).search(/( |\t)+/g) >= 0) {
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
                                    if (token != null && token.type == 'address_hex' && token.value.length == 4) {
                                        token = peek(2);
                                        if (token != null && token.type == 'rparen') {
                                            return 'IND';
                                        } else {
                                            throw 'Missing right paren.';
                                        }
                                    } else if (token != null && token.type == 'address_hex' && token.value.length == 2) {
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
                                break;
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
                                    if (token != null && token.type == 'address_hex') {
                                        token.value = parseInt(token.value, 16);
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
                                    if (token != null && token.type == 'address_hex') {
                                        token.value = parseInt(token.value, 16);
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
                        return arr;
                    };

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
                            sequence.push(seq);
                        }
                        ++index;
                    }
                } else {
                    throw 'invalid token stream';
                }
                return {
                    getSequence: function () {
                        return sequence;    
                    }
                };
            };
        }());
    ASM6502.processSource = function (source) {
        return Parser(Lexer(source).getTokens()).getSequence();
    };
    scope.ASM6502 = ASM6502;
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));