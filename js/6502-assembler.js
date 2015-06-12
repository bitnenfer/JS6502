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
            'JSR', 'LDA', 'LDY', 'LDY',
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
                                tokens.push({
                                    type: 'space',
                                    value: ''
                                });
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
                if (typeof tokenStream == 'array') {

                } else {
                    throw 'invalid token stream';
                }
                return {
                    getParseTree: function () {
                        return null;
                    }
                };
            };
        }());
    ASM6502.processSource = function (source) {
        return Parser(Lexer(source).getTokens()).getParseTree();
    };
    scope.ASM6502 = ASM6502;
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));