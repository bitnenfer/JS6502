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
        statusToByte = function () {
            var byte = 0,
                index;
            for (index = 0; index < 8; ++index) {
                byte *= 2;
                byte = byte + reg[N + index];
            }
            return byte;
        },
        byteToStatus = function (m) {
            var index;
            for (index = 0; index < 8; ++index) {
                reg[N + (7 - index)] = m & (1 << index) ? 1 : 0;
            }
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
        addrID = function () {
            return RAM[eatByte()];
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
            return tmp;
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
            tmp = PC[0] - 1;
            pushStack(tmp/256|0);
            pushStack(tmp&255|0);
            PC[0] = m;
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
            pushStack(statusToByte());
        },
        PLA = function () {
            reg[A] = popStack();
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        PLP = function () {
            byteToStatus(popStack());   
        },
        ROL = function (m) {
            tmp = getBit(m, 7);
            m = (m << 1) & 0xFE;
            m = m | reg[C];
            reg[C] = tmp;
            reg[Z] = (m == 0) ? 1 : 0;
            reg[N] = getBit(m, 7);
            return m;
        },
        ROR = function (m) {
            tmp = getBit(m, 0);
            m = (m >> 1) & 0x7F;
            m = m | reg[C] ? 0x80 : 0x00;
            reg[C] = tmp;
            reg[Z] = m == 0 ? 1 : 0;
            reg[N] = getBit(m, 7);
            return m;
        },
        RTI = function () {
            byteToStatus(popStack());
            tmp = popStack();
            PC[0] = popStack() << 8 | tmp;
        },
        RTS = function () {
            tmp = popStack();
            PC[0] = (popStack() << 8 | tmp) + 1;
        },
        SBC = function (m) {
            //TODO: Implement Decimal mode.
            tmp = reg[A] - m - (reg[C] == 0 ? 1 : 0);
            reg[V] = tmp > 127 || tmp < -128 ? 1 : 0;
            reg[C] = tmp >= 0 ? 1 : 0;
            reg[N] = getBit(tmp, 7);
            reg[Z] = tmp == 0 ? 1 : 0;
            reg[A] = tmp & 0xFF;
        },
        SEC = function () {
            reg[C] = 1;
        },
        SED = function () {
            reg[D] = 1;
        },
        SEI = function () {
            reg[I] = 1;
        },
        STA = function (m) {
            RAM[m] = reg[A];
        },
        STX = function (m) {
            RAM[m] = reg[X];
        },
        STY = function (m) {
            RAM[m] = reg[Y];
        },
        TAX = function () {
            reg[X] = reg[A];
            reg[N] = getBit(reg[X], 7);
            reg[Z] = reg[X] == 0 ? 1 : 0;
        },
        TAY = function () {
            reg[Y] = reg[A];
            reg[N] = getBit(reg[Y], 7);
            reg[Z] = reg[Y] == 0 ? 1 : 0;
        },
        TSX = function () {
            reg[X] = SP[0];
            reg[N] = getBit(reg[X], 7);
            reg[Z] = reg[X] == 0 ? 1 : 0;
        },
        TXA = function () {
            reg[A] = reg[X];
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        TXS = function () {
            SP[0] = reg[X];
        },
        TYA = function () {
            reg[A] = reg[Y];
            reg[N] = getBit(reg[A], 7);
            reg[Z] = reg[A] == 0 ? 1 : 0;
        },
        // Instruction addr
        INSTADDR = {
            // ADC IM
            0x69: function () {
                ADC(eatByte());
            },
            // ADC ZP
            0x65: function () {
                addr[0] = addrZP();
                ADC(RAM[addr[0]]);
            },
            // ADC ZPX   
            0x75: function () {
                addr[0] = addrZPX();
                ADC(RAM[addr[0]]);
            },
            // ADC AB
            0x6D: function () {
                addr[0] = addrAB();
                ADC(RAM[addr[0]]);
            },
            // ADC ABX
            0x7D: function () {
                addr[0] = addrABX();
                ADC(RAM[addr[0]]);
            },
            // ADC ABY
            0x79: function () {
                addr[0] = addrABY();
                ADC(RAM[addr[0]]);
            },
            // ADC IDX
            0x61: function () {
                addr[0] = addrIDX();
                ADC(RAM[addr[0]]);
            },
            // ADC IDY
            0x71: function () {
                addr[0] = addrIDY();
                ADC(RAM[addr[0]]);
            },
            // AND IM
            0x29: function () {
                AND(eatByte());
            },
            // AND ZP
            0x25: function () {
                addr[0] = addrZP();
                AND(RAM[addr[0]]);
            },
            // AND ZPX
            0x35: function () {
                addr[0] = addrZPX();
                AND(RAM[addr[0]]);
            },
            // AND AB
            0x2D: function () {
                addr[0] = addrAB();
                AND(RAM[addr[0]]);
            },
            // AND ABX
            0x3D: function () {
                addr[0] = addrABX();
                AND(RAM[addr[0]]);
            },
            // AND ABY
            0x39: function () {
                addr[0] = addrABY();
                AND(RAM[addr[0]]);
            },
            // AND IDX
            0x21: function () {
                addr[0] = addrIDX();
                AND(RAM[addr[0]]);
            },
            // AND IDY
            0x31: function () {
                addr[0] = addrIDY();
                AND(RAM[addr[0]]);
            },
            // ASL ACC
            0x10: function () {
                reg[A] = ASL(reg[A]);
            },
            // ASL ZP
            0x06: function () {
                addr[0] = addrZP();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // ASL ZPX
            0x16: function () {
                addr[0] = addrZPX();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // ASL AB
            0x0E: function () {
                addr[0] = addrAB();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // ASL ABX
            0x1E: function () {
                addr[0] = addrABX();
                RAM[addr[0]] = ASL(RAM[addr[0]]);
            },
            // BCC REL
            0x90: function () {
                if (reg[C] == 0) brchREL();
                else ++PC[0];
            },
            // BCS REL
            0xB0: function () {
                if (reg[C] == 1) brchREL();
                else ++PC[0];
            },
            // BEQ REL
            0xF0: function () {
                if (reg[Z] == 1) brchREL();
                else ++PC[0];
            },
            // BIT ZP
            0x24: function () {
                addr[0] = addrZP();
                BIT(RAM(addr[0]));
            },
            // BIP AB
            0x2C: function () {
                addr[0] = addrAB();
                BIT(RAM(addr[0]));
            },
            // BMI REL
            0x30: function () {
                if (reg[N] == 1) brchREL();
                else ++PC[0];
            },
            // BNE REL
            0xD0: function () {
                if (reg[Z] == 0) brchREL();
                else ++PC[0];
            },
            // BPL REL
            0x10: function () {
                if (reg[N] == 0) brchREL();
                else ++PC[0];
            },
            // BRK
            0x00: function () {
                reg[B] = 1;
            },
            // BVC REL
            0x50: function () {
                if (reg[V] == 0) brchREL();
                else ++PC[0];
            },
            // BVS REL
            0x70: function () {
                if (reg[V] == 0) brchREL();
                else ++PC[0];
            },
            // CLC IMP
            0x24: function () {
                reg[C] = 0;
            },
            // CLD IMP
            0xD8: function () {
                reg[D] = 0;
            },
            // CLI IMP
            0x58: function () {
                reg[I] = 0;
            },
            // CLV IMP
            0xB8: function () {
                reg[V] = 0;
            },
            // CMP IM
            0xC9: function () {
                CMP(eatByte());
            },
            // CMP ZP
            0xC5: function () {
                addr[0] = addrZP();
                CMP(RAM[addr[0]]);
            },
            // CMP ZPX
            0xD5: function () {
                addr[0] = addrZPX();
                CMP(RAM[addr[0]]);
            },
            // CMP AB
            0xCD: function () {
                addr[0] = addrAB();
                CMP(RAM[addr[0]]);
            },
            // CMP ABX
            0xDD: function () {
                addr[0] = addrABX();
                CMP(RAM[addr[0]]);
            },
            // CMP ABY
            0xD9: function () {
                addr[0] = addrABY();
                CMP(RAM[addr[0]]);
            },
            // CMP IDX
            0xC1: function () {
                addr[0] = addrIDX();
                CMP(RAM[addr[0]]);
            },
            // CMP IDY
            0xD1: function () {
                addr[0] = addrIDY();
                CMP(RAM[addr[0]]);
            },
            // CPX IM
            0xE0: function () {
                CPX(eatByte());
            },
            // CPX ZP
            0xE4: function () {
                addr[0] = addrZP();
                CPX(RAM[addr[0]]);
            },
            // CPX AB
            0xEC: function () {
                addr[0] = addrAB();
                CPX(RAM[addr[0]]);
            },
            // CPY IM
            0xC0: function () {
                CPY(eatByte());
            },
            // CPY ZP
            0xC4: function () {
                addr[0] = addrZP();
                CPY(RAM[addr[0]]);
            },
            // CPY AB
            0xCC: function () {
                addr[0] = addrAB();
                CPY(RAM[addr[0]]);
            },
            // DEC ZP
            0xC6: function () {
                addr[0] = addrZP();
                DEC(RAM[addr[0]]);
            },
            // DEC ZPX
            0xD6: function () {
                addr[0] = addrZPX();
                DEC(RAM[addr[0]]);
            },
            // DEC AB
            0xCE: function () {
                addr[0] = addrAB();
                DEC(RAM[addr[0]]);
            },
            // DEC ABX
            0xDE: function () {
                addr[0] = addrABX();
                DEC(RAM[addr[0]]);
            },
            // DEX
            0xCA: function () {
                DEX();
            },
            // DEY
            0x88: function () {
                DEY();
            },
            // EOR IM
            0x49: function () {
                EOR(eatByte());
            },
            // EOR ZP
            0x45: function () {
                addr[0] = addrZP();
                EOR(RAM[addr[0]]);
            },
            // EOR ZPX
            0x55: function () {
                addr[0] = addrZPX();
                EOR(RAM[addr[0]]);
            },
            // EOR AB
            0x4D: function () {
                addr[0] = addrAB();
                EOR(RAM[addr[0]]);
            },
            // EOR ABX
            0x5D: function () {
                addr[0] = addrABX();
                EOR(RAM[addr[0]]);
            },
            // EOR ABY
            0x59: function () {
                addr[0] = addrABY();
                EOR(RAM[addr[0]]);
            },
            // EOR IDX
            0x41: function () {
                addr[0] = addrIDX();
                EOR(RAM[addr[0]]);
            },
            // EOR IDY
            0x51: function () {
                addr[0] = addrIDY();
                EOR(addr[0]);
            },
            // INC ZP
            0xE6: function () {
                addr[0] = addrZP();
                RAM[addr[0]] = INC(RAM[addr[0]]);
            },
            // INC ZPX
            0xF6: function () {
                addr[0] = addrZPX();
                RAM[addr[0]] = INC(RAM[addr[0]]);
            },
            // INC AB
            0xEE: function () {
                addr[0] = addrAB();
                RAM[addr[0]] = INC(RAM[addr[0]]);
            },
            // INC ABX
            0xFE: function () {
                addr[0] = addrABX();
                RAM[addr[0]] = INC(RAM[addr[0]]);
            },
            // INX
            0xE8: function () {
                INX();
            },
            // INY
            0xC8: function () {
                INY();
            },
            // JMP AB
            0x4C: function() {
                addr[0] = addrAB();
                JMP(addr[0]);
            },
            // JMP ID
            0x6C: function () {
                addr[0] = addrID();
                JMP(RAM[addr[0]]);
            },
            // JSR AB
            0x20: function () {
                addr[0] = addrAB();
                JSR(addr[0]);
            },
            // LDA IM
            0xA9: function () {
                LDA(eatByte());
            },
            // LDA ZP
            0xA5: function () {
                addr[0] = addrZP();
                LDA(RAM[addr[0]]);
            },
            // LDA ZPX
            0xB5: function () {
                addr[0] = addrZPX();
                LDA(RAM[addr[0]]);
            },
            // LDA AB
            0xAD: function () {
                addr[0] = addrAB();
                LDA(RAM[addr[0]]);
            },
            // LDA ABX
            0xBD: function () {
                addr[0] = addrABX();
                LDA(RAM[addr[0]]);
            },
            // LDA ABY
            0xB9: function () {
                addr[0] = addrABY();
                LDA(RAM[addr[0]]);
            },
            // LDA IDX
            0xA1: function () {
                addr[0] = addrIDX();
                LDA(RAM[addr[0]]);
            },
            // LDA IDY
            0xB1: function () {
                addr[0] = addrIDY();
                LDA(RAM[addr[0]]);
            },
            // LDX IM
            0xA2: function () {
                LDX(eatByte());
            },
            // LDX ZP
            0xA6: function () {
                addr[0] = addrZP();
                LDX(RAM[addr[0]]);
            },
            // LDX ZPY
            0xB6: function () {
                addr[0] = addrZPY();
                LDX(RAM[addr[0]]);
            },
            // LDX AB
            0xAE: function () {
                addr[0] = addrAB();
                LDX(RAM[addr[0]]);
            },
            // LDX ABY
            0xBE: function () {
                addr[0] = addrABY();
                LDX(RAM[addr[0]]);
            },
            // LDY IM
            0xA0: function () {
                LDY(eatByte());
            },
            // LDY ZP
            0xA4: function () {
                addr[0] = addrZP();
                LDY(RAM[addr[0]]);
            },
            // LDY ZPX
            0xB4: function () {
                addr[0] = addrZPX();
                LDY(RAM[addr[0]]);
            },
            // LDY AB
            0xAC: function () {
                addr[0] = addrAB();
                LDY(RAM[addr[0]]);
            },
            // LDY ABX
            0xBC: function () {
                addr[0] = addrABX();
                LDY(RAM[addr[0]]);
            }
        };     
        // Expose some elements for communication
        // between other modules.
        scope.CPU6502 = {INSTADDR: INSTADDR};
        Object.defineProperty(scope.CPU6502, 'RAM', {
           get: function () {
               return RAM;
           } 
        });
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));