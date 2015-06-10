/**
 **
 **     6502 JavaScript Emulator
 **     Author: Felipe Alfonso
 **
 **/
(function (scope) {
    'use strict';
    // Register Indexes
    var A = 0,
        X = 1,
        Y = 2,
        N = 3,
        V = 4,
        B = 6,
        D = 7,
        I = 8,
        Z = 9,
        C = 10,
        // Register array
        reg = new Uint8Array(11),
        // Program counter
        PC = new Uint16Array(1),
        // Stack pointer
        SP = new Uint8Array(1),
        stackAddress = 0x01FF,
        // 64KB of RAM
        RAM = new Uint8Array(65536),
        // Cached 16 bit addr
        addr = new Uint16Array(1),
        lsb,
        msb,
        tmp,
        getBit = function (value, bit) {
            return (value >> bit) & 1;
        },
        eatByte = function () {
            return RAM[PC[0] ++];
        },
        // Address modes
        // Zero Page
        addrZP = function () {
            return eatByte();
        },
        // Zero Page X
        addrZPX = function () {
            return addrZP() + reg[X];
        },
        // Zero Page Y
        addrZPY = function () {
            return addrZP() + reg[Y];
        },
        // Absolute
        addrAB = function () {
            lsb = eatByte();
            msb = eatByte();
            return (msb << 8) | (lsb & 0xff);
        },
        // Absolute X
        addrABX = function () {
            return addrAB() + reg[X];
        },
        // Absolute Y
        addrABY = function () {
            return addrAB() + reg[Y];
        },
        // Indirect X
        addrIDX = function () {
            return RAM[eatByte() + reg[X]];
        },
        // Indirect Y
        addrIDY = function () {
            return RAM[eatByte()] + reg[Y];
        },
        // Branch Relative
        brchREL = function () {
            addr[0] = eatByte();
            PC[0] = PC[0] + addr[0];
        },
        pushStack = function (m) {
            RAM[stackAddress + SP[0]] = m;
            --SP[0];
        },
        popStack = function () {
            ++SP[0];
            tmp = RAM[stackAddress + SP[0]];
            return tmp;
        },
        // Instruction set.
        ADC = function (m) {
            tmp = reg[A] + m + reg[C];
            reg[V] = getBit(reg[A], 7) != getBit(tmp, 7) ? 1 : 0;
            reg[N] = getBit(reg[A], 7);
            reg[Z] = tmp == 0 ? 1 : 0;
            //TODO: Implement decimal mode operation.
            reg[C] = tmp > 0xFF ? 1 : 0;
            reg[A] = tmp;
        },
        AND = function (m) {
            reg[A] &= m;
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        ASL = function (m) {
            reg[C] = getBit(m, 7);
            m = (m << 1) & 0xFE;
            reg[N] = getBit(m);
            reg[Z] = m == 0 ? 1 : 0;
            return m;
        },
        BIT = function (m) {
            tmp = reg[A] & m;
            reg[N] = getBit(tmp, 7);
            reg[V] = getBit(tmp, 6);
            reg[Z] = tmp == 0 ? 1 : 0;
        },
        CMP = function (m) {
            tmp = reg[A] - m;
            reg[N] = getBit(tmp, 7);
            reg[C] = reg[A] >= m ? 1 : 0;
            reg[Z] = tmp == 0 ? 1 : 0;
        },
        CPX = function (m) {
            tmp = reg[X]  - m;
            reg[N] = getBit(tmp, 7);
            reg[C] = reg[X] >= m ? 1 : 0;
            reg[Z] = tmp == 0 ? 1 : 0;
        },
        CPY = function (m) {
            tmp = reg[Y]  - m;
            reg[N] = getBit(tmp, 7);
            reg[C] = reg[Y] >= m ? 1 : 0;
            reg[Z] = tmp == 0 ? 1 : 0;
        },
        DEC = function (m) {
            tmp = (m - 1) & 0xFF;
            reg[N] = getBit(m, 7);
            reg[Z] = m == 0 ? 1 : 0;
            return tmp;
        },
        DEX = function () {
            reg[X] = reg[X] - 1;
            reg[Z] = reg[X] == 0 ? 1 : 0;
            reg[N] = getBit(reg[X], 7);
        },
        DEY = function () {
            reg[Y] = reg[Y] - 1;
            reg[Z] = reg[Y] == 0 ? 1 : 0;
            reg[N] = getBit(reg[Y], 7);
        },
        EOR = function (m) {
            reg[A] = reg[A] ^ m;
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        INC = function (m) {
            tmp = (m + 1) & 0xFF;
            reg[N] = getBit(tmp, 7);
            reg[Z] = tmp == 0 ? 1 : 0;
        },
        INX = function () {
            reg[X] = reg[X] + 1;
            reg[Z] = reg[X] == 0 ?  1 : 0;
            reg[N] = getBit(reg[X], 7);
        },
        INY = function () {
            reg[Y] = reg[Y] + 1;
            reg[Z] = reg[Y] == 0 ?  1 : 0;
            reg[N] = getBit(reg[Y], 7);
        },
        JMP = function (m) {
            PC[0] = m;  
        },
        JSR = function (m) {
            
        },
        LDA = function (m) {
            reg[A] = m;
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        LDX = function (m) {
            reg[X] = m;
            reg[N] = getBit(reg[X], 7);
            reg[Z] = reg[X] == 0 ? 1 : 0;
        },
        LDY = function (m) {
            reg[Y] = m;
            reg[N] = getBit(reg[Y], 7);
            reg[Z] = reg[Y] == 0 ? 1 : 0;  
        },
        LSR = function (m) {
            reg[N] = 0;
            reg[C] = getBit(m, 0);
            tmp = (m >> 1) & 0x7F;
            reg[Z] = tmp == 0 ? 1 : 0;
            return tmp;
        },
        ORA = function (m) {
            reg[A] = reg[A] | m;
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        PHA = function () {
            pushStack(reg[A]);
        },
        PHP = function () {
            
        },
        PLA = function () {
          reg[A] = popStack();
          reg[N] = getBit(reg[A], 7);
          reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        PLP = function () {
            
        },
        // Instruction addr
        INSTADDR = {
            // $69 ADC IM
            105: function () {
                ADC(eatByte());
            },
            // $65 ADC ZP
            101: function () {
                addr[0] = addrZP();
                ADC(RAM[addr[0]]);
            },
            // $75 ADC ZPX   
            117: function () {
                addr[0] = addrZPX();
                ADC(RAM[addr[0]]);
            },
            // $6D ADC AB
            109: function () {
                addr[0] = addrAB();
                ADC(RAM[addr[0]]);
            },
            // $7D ADC ABX
            125: function () {
                addr[0] = addrABX();
                ADC(RAM[addr[0]]);
            },
            // $79 ADC ABY
            121: function () {
                addr[0] = addrABY();
                ADC(RAM[addr[0]]);
            },
            // $61 ADC IDX
            97: function () {
                addr[0] = addrIDX();
                ADC(RAM[addr[0]]);
            },
            // $71 ADC IDY
            113: function () {
                addr[0] = addrIDY();
                ADC(RAM[addr[0]]);
            },
            // $29 AND IM
            41: function () {
                AND(eatByte());
            },
            // $25 AND ZP
            37: function () {
                addr[0] = addrZP();
                AND(RAM[addr[0]]);
            },
            // $35 AND ZPX
            53: function () {
                addr[0] = addrZPX();
                AND(RAM[addr[0]]);
            },
            // $2D AND AB
            45: function () {
                addr[0] = addrAB();
                AND(RAM[addr[0]]);
            },
            // $3D AND ABX
            61: function () {
                addr[0] = addrABX();
                AND(RAM[addr[0]]);
            },
            // $39 AND ABY
            57: function () {
                addr[0] = addrABY();
                AND(RAM[addr[0]]);
            },
            // $21 AND IDX
            33: function () {
                addr[0] = addrIDX();
                AND(RAM[addr[0]]);
            },
            // $31 AND IDY
            49: function () {
                addr[0] = addrIDY();
                AND(RAM[addr[0]]);
            },
            // $0A ASL ACC
            10: function () {
                reg[A] = ASL(reg[A]);
            },
            // $06 ASL ZP
            6: function () {
                addr[0] = addrZP();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // $16 ASL ZPX
            22: function () {
                addr[0] = addrZPX();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // $0E ASL AB
            14: function () {
                addr[0] = addrAB();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // $1E ASL ABX
            30: function () {
                addr[0] = addrABX();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // $90 BCC REL
            144: function () {
                if (reg[C] == 0) brchREL();
                else ++PC[0];
            },
            // $B0 BCS REL
            176: function () {
                if (reg[C] == 1) brchREL();
                else ++PC[0];
            },
            // $F0 BEQ REL
            240: function () {
                if (reg[Z] == 1) brchREL();
                else ++PC[0];
            },
            // $24 BIT ZP
            36: function () {
                addr[0] = addrZP();
                BIT(RAM(addr[0]));
            },
            // $2C BIP AB
            44: function () {
                addr[0] = addrAB();
                BIT(RAM(addr[0]));
            },
            // $30 BMI REL
            48: function () {
                if (reg[N] == 1) brchREL();
                else ++PC[0];
            },
            // $D0 BNE REL
            200: function () {
                if (reg[Z] == 0) brchREL();
                else ++PC[0];
            },
            // $10 BPL REL
            16: function () {
                if (reg[N] == 0) brchREL();
                else ++PC[0];
            },
            // $00 BRK
            0: function () {
                reg[B] = 1;
            },
            // $50 BVC REL
            80: function () {
                if (reg[V] == 0) brchREL();
                else ++PC[0];
            },
            // $70 BVS REL
            112: function () {
                if (reg[V] == 0) brchREL();
                else ++PC[0];
            },
            // $24 CLC IMP
            24: function () {
                reg[C] = 0;
            },
            // $D8 CLD IMP
            216: function () {
                reg[D] = 0;
            },
            // $58 CLI IMP
            88: function () {
                reg[I] = 0;
            },
            // $B8 CLV IMP
            184: function () {
                reg[V] = 0;
            },
            // $C9 CMP IM
            201: function () {
                CMP(eatByte());
            },
            // $C5 CMP ZP
            197: function () {
                addr[0] = addrZP();
                CMP(RAM[addr[0]]);
            },
            // $D5 CMP ZPX
            213: function () {
                addr[0] = addrZPX();
                CMP(RAM[addr[0]]);
            },
            // $CD CMP AB
            205: function () {
                addr[0] = addrAB();
                CMP(RAM[addr[0]]);
            },
            // $DD CMP ABX
            221: function () {
                addr[0] = addrABX();
                CMP(RAM[addr[0]]);
            },
            // $D9 CMP ABY
            217: function () {
                addr[0] = addrABY();
                CMP(RAM[addr[0]]);
            },
            // $C1 CMP IDX
            193: function () {
                addr[0] = addrIDX();
                CMP(RAM[addr[0]]);
            },
            // $D1 CMP IDY
            209: function () {
                addr[0] = addrIDY();
                CMP(RAM[addr[0]]);
            }
        };     
        // Expose some elements for communication
        // between other modules.
        scope.CPU6502 = {};
        Object.defineProperty(scope.CPU6502, 'RAM', {
           get: function () {
               return RAM;
           } 
        });
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));