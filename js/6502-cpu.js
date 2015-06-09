/**
 **
 **  6502 JavaScript Emulator
 **  Based(ish) on the Atari 800 Specs
 **  64K of RAM
 **
 **  Reference:
 **  http://homepage.ntlworld.com/cyborgsystems/CS_Main/6502/6502.htm
 **
 **/
(function (scope) {
    'use strict';
    var ram, stack, gpr, sp, pc, status, ArrayToString, instrset, address, lsb,
        msb, spAddress, zeroPageAddress, zeroPageXAddress, absoluteAddress,
        absoluteXAddress, absoluteYAddress, indirectXAddress, indirectYAddress,
        consumePCByte, indirectAddress, jumpRelative, getBit, a, b, c,
        setN, setC, setZ, setI, setD, setV, setB, setReg, getReg, setFlag, getFlag,
        // Registers
        A, X, Y,
        // Flags
        N, V, B, D, I, Z, C,
        // Instructions
        iADC, iAND, iASL, iBIT, iCMP;
    // CPU Setup
    // 64KB of ram.
    ram = new Uint8Array(65536);
    // General purpose register.
    // 0. Accumulator
    // 1. X index register
    // 2. Y index register
    gpr = new Uint8Array(3);
    // 8 bit stack pointer
    sp = new Uint8Array(1);
    // SP address. Page 1
    spAddress = 0x01FF;
    // 16 bit program counter
    pc = new Uint16Array(1);
    // 7. Carry flag
    // 6. Zero flag
    // 5. Interrupt flag
    // 4. Decimal mode flag
    // 3. Break flag
    // 2. Not used
    // 1. Overflow flag
    // 0. Sign flag
    status = new Uint8Array(8);
    // 16 bit address
    address = new Uint16Array(1);
    A = 0;
    X = 1;
    Y = 2;
    N = 0;
    V = 1;
    B = 3;
    D = 4;
    I = 5;
    Z = 6;
    C = 7;
    setReg = function (regIdx, value) {
        gpr[regIdx] = value;
    };
    getReg = function (regIdx) {
        return gpr[regIdx];
    };
    setFlag = function (flgIdx, value) {
        status[regIdx] = value;
    };
    getFlag = function (flgIdx) {
        return status[regIdx];
    };
    // Helper
    ArrayToString = function (arr, sep) {
        var index,
            length = arr.length,
            str = '';
        if (typeof sep == 'undefined') sep = '';
        for (index = 0; index < length; ++index) {
            str += arr[index];
            if (index < length - 1) {
                str += sep;
            }
        }
        return str;
    };
    zeroPageAddress = function () {
        return consumePCByte();
    };
    zeroPageXAddress = function () {
        return zeroPageAddress() + gpr[1];
    };
    absoluteAddress = function () {
        lsb = consumePCByte();
        msb = consumePCByte();
        return (msb << 8) | (lsb & 0xff);
    };
    absoluteXAddress = function () {
        return absoluteAddress() + gpr[1];
    };
    absoluteYAddress = function () {
        return absoluteAddress() + gpr[2];
    };
    indirectXAddress = function () {
        return ram[consumePCByte() + gpr[1]];
    };
    indirectYAddress = function () {
        return ram[consumePCByte()] + gpr[2];
    };
    consumePCByte = function () {
        return ram[++pc[0]];
    };
    indirectAddress = function () {

    };
    jumpRelative = function () {
        address[0] = consumePCByte();
        pc[0] += address[0];
    };
    getBit = function (value, bit) {
        return (value >> bit) & 1
    };
    iADC = function (m) {
        a = gpr[0] + m + status[7];
        setFlag(V, getBit(getReg(A), 7) != getBit(a, 7) ? 1 : 0);
        setFlag(N, getBit(getReg(A), 7));
        setFlag(Z, a == 0 ? 1 : 0);
        //TODO: Implement decimal mode operation.
        setFlag(C, a > 0xFF ? 1 : 0);
        setReg(A, a);
    };
    iAND = function (m) {
        gpr[0] &= m;
        setReg(A, getReg(A) & m);
        setFlag(N, getBit(getReg(A), 7));
        setFlag(Z, getReg(A) == 0 ? 1 : 0);
    };
    iASL = function (m) {

    };
    iBIT = function (m) {
        a = gpr[0] & m;
        setFlag(N, getBit(a, 7));
        setFlag(V, getBit(a, 6));
        setFlag(Z, a == 0 ? 1 : 0);
    };
    iCMP = function (m) {
        a = gpr[0] - m;
        setFlag(N, getBit(a, 7));
        setFlag(C, gpr[0] >= m ? 1 : 0);
        setFlag(C, a == 0 ? 1 : 0);
    };
    // Address modes for each instruction.
    scope.ADDRMODE = {
        // $00 BRK
        0: function () {
            status[3] = 1;
        },
        // $69 ADC I        ADC #$44
        105: function () {
            iADC(consumePCByte());
        },
        // $65 ADC ZP       ADC $44
        101: function () {
            address[0] = zeroPageAddress();
            iADC(ram[address[0]]);
        },
        // $75 ADC ZP, X    ADC $44, X   
        117: function () {
            address[0] = zeroPageXAddress();
            iADC(ram[address[0]]);
        },
        // $6D ADC ABS      ADC $4400
        109: function () {
            address[0] = absoluteAddress();
            iADC(ram[address[0]]);
        },
        // $7D ADC ABS, X   ADC $4400, X
        125: function () {
            address[0] = absoluteXAddress();
            iADC(ram[address[0]]);
        },
        // $79 ADC ABS, Y   ADC $4400, Y
        121: function () {
            address[0] = absoluteYAddress();
            iADC(ram[address[0]]);
        },
        // $61 ADC IND, X   ADC ($44, X)
        97: function () {
            address[0] = indirectXAddress();
            iADC(ram[address[0]]);
        },
        // $71 ADC IND, Y   ADC ($44), Y
        113: function () {
            address[0] = indirectYAddress();
            iADC(ram[address[0]]);
        },
        // $29 AND IM       AND #$44
        41: function () {
            iAND(consumePCByte());
        },
        // $25 AND ZP       AND $44
        37: function () {
            address[0] = zeroPageAddress();
            iAND(ram[address[0]]);
        },
        // $35 AND ZP, X    AND $44, X
        53: function () {
            address[0] = zeroPageXAddress();
            iAND(ram[address[0]]);
        },
        // $2D AND ABS      AND $4400
        45: function () {
            address[0] = absoluteAddress();
            iAND(ram[address[0]]);
        },
        // $3D AND ABS, X   AND $4400, X
        61: function () {
            address[0] = absoluteXAddress();
            iAND(ram[address[0]]);
        },
        // $39 AND ABS, Y   AND $4400, Y
        57: function () {
            address[0] = absoluteYAddress();
            iAND(ram[address[0]]);
        },
        // $21 AND IND, X   AND ($44, X)
        33: function () {
            address[0] = indirectXAddress();
            iAND(ram[address[0]]);
        },
        // $31 AND IND, Y   AND ($44), Y
        49: function () {
            address[0] = indirectYAddress();
            iAND(ram[address[0]]);
        },
        // $90 BCC REL      BCC label
        144: {
            if (status[7] == 0) {
                jumpRelative();
            }
        },
        // $B0 BCS REL      BCS label
        176: {
            if (status[7] == 1) {
                jumpRelative();
            }
        }
    };
    // Global container of
    // CPU info.
    scope.cpu6502 = {};
    // Return values by copy.
    // This is only for reading values
    // in console.
    Object.defineProperties(
        scope.cpu6502, {
            RAM: {
                get: function () {
                    return new Uint8Array(ram);
                }
            },
            STACK: {
                get: function () {
                    return new Uint8Array(stack);
                }
            },
            STATUS: {
                get: function () {
                    return ArrayToString(status);
                }
            },
            A: {
                get: function () {
                    return gpr[0];
                }
            },
            X: {
                get: function () {
                    return gpr[1];
                }
            },
            Y: {
                get: function () {
                    return gpr[2];
                }
            },
            SP: {
                get: function () {
                    return sp[0];
                }
            },
            PC: {
                get: function () {
                    return pc[0];
                }
            }
        }
    );
}(window));