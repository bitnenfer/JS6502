/**
 **
 **     6502 JavaScript Emulator
 **     Author: Felipe Alfonso
 **
 **/
(function (scope) {
        // Register 8 bit
    var A = 0x00, 
        X = 0x00, 
        Y = 0x00, 
        SR = 0x00,
        // Flag index
        N = 0,
        V = 1,
        B = 3,
        D = 4,
        I = 5,
        Z = 6,
        C = 7,
        // Program counter 16 bit
        PC = 0,
        // Stack pointer 8 bit
        SP = 0,
        stackAddress = 0x01FF,
        // 64KB of RAM
        RAM = new Uint8Array(65536),
        // Cached 16 bit addr
        addr,
        lsb,
        msb,
        tmp,
        getBit = function (value, bitpos) {
            return (value >> bitpos) & 1;
        },
        setBit = function (value, bitpos) {
            value |= 1 << bitpos;
            return value;
        },
        clearBit = function (value, bitpos) {
            value &= ~(1 << bitpos);
            return value;
        },
        eatByte = function () {
            return RAM[PC++];
        },
        // Address modes
        // Zero Page
        addrZP = function () {
            addr = eatByte();
        },
        // Zero Page X
        addrZPX = function () {
            addr = addrZP() + X;
        },
        // Zero Page Y
        addrZPY = function () {
            addr = addrZP() + Y;
        },
        // Absolute
        addrAB = function () {
            lsb = eatByte();
            msb = eatByte();
            addr = (msb << 8) | (lsb & 0xff);
        },
        // Absolute X
        addrABX = function () {
            addr = addrAB() + X;
        },
        // Absolute Y
        addrABY = function () {
            addr = addrAB() + Y;
        },
        addrID = function () {
            addr = RAM[eatByte()];
        },
        // Indirect X
        addrIDX = function () {
            addr = RAM[eatByte() + X];
        },
        // Indirect Y
        addrIDY = function () {
            addr = RAM[eatByte()] + Y;
        },
        // Branch Relative
        brchREL = function () {
            var l = PC & 255 | 0,
                h = PC / 256 | 0,
                b = eatByte() & 0xFF;
            PC = (((h << 8 | l) + b) & 0xFF) + 1;
        },
        pushStack = function (m) {
            RAM[stackAddress + SP] = m;
            SP = (SP - 1) & 0xFF;
        },
        popStack = function () {
            SP = (SP + 1) & 0xFF;
            tmp = RAM[stackAddress + SP];
            return tmp;
        },
        peek = function () {
            return RAM[addr];
        },
        // Instruction set.
        ADC = function (m) {
            tmp = (A + m + getBit(SR, C));
            SR = getBit(A, 7) != getBit(tmp, 7) ? setBit(SR, V) : clearBit(SR, V);
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            //TODO: Implement decimal mode operation.
            SR = tmp > 0xFF ? setBit(SR, C) : clearBit(SR, C);
            A = tmp & 0xFF;
            SR = SR & 0xFF;
        },
        AND = function (m) {
            A = A & (m & 0xFF);
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        ASL = function (m) {
            SR = getBit(m, 7) ? setBit(SR, C) : clearBit(SR, C);
            m = (m << 1) & 0xFE;  
            SR = getBit(m, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = m == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
            return m;
        },
        BIT = function (m) {
            tmp = A & (m & 0xFF);
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = getBit(tmp, 6) ? setBit(SR, V) : clearBit(SR, V);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        CMP = function (m) {
            tmp = (A - m) & 0xFF;
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A >= m ? setBit(SR, C) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        CPX = function (m) {
            tmp = (X - m) & 0xFF;
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = X >= m ? setBit(SR, C) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        CPY = function (m) {
            tmp = (Y - m) & 0xFF;
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = Y >= m ? setBit(SR, C) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        DEC = function (m) {
            tmp = (m - 1) & 0xFF;
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
            return tmp;
        },
        DEX = function () {
            X = (X - 1) & 0xFF
            SR = getBit(X, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = X == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        DEY = function () {
            Y = (Y - 1) & 0xFF
            SR = getBit(Y, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = Y == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        EOR = function (m) {
            A = (A ^ m) & 0xFF;
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        INC = function (m) {
            tmp = (m + 1) & 0xFF;
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
            return tmp;
        },
        INX = function () {
            X = (X + 1) & 0xFF;
            SR = getBit(X, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = X == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        INY = function () {
            Y = (Y + 1) & 0xFF;
            SR = getBit(Y, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = Y == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        JMP = function (m) {
            PC = m & 0xFFFF;  
        },
        JSR = function (m) {
            tmp = (PC - 1) & 0xFFFF;
            pushStack(tmp / 256 | 0);
            pushStack(tmp & 255 | 0);
            PC = m & 0xFFFF;
        },
        LDA = function (m) {
            A = m & 0xFF;
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        LDX = function (m) {
            X = m & 0xFF;
            SR = getBit(X, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = X == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        LDY = function (m) {
            Y = m & 0xFF;
            SR = getBit(Y, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = Y == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        LSR = function (m) {
            clearBit(SR, N);
            SR = getBit(m & 0xFF, 0) ? setBit(SR, C) : clearBit(SR, C);
            tmp = (m >> 1) & 0x7F;
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
            return tmp;
        },
        ORA = function (m) {
            A = (A | m) & 0xFF;
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        PHA = function () {
            pushStack(A);
        },
        PHP = function () {
            pushStack(SR);
        },
        PLA = function () {
            A = popStack() & 0xFF;
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        PLP = function () {
            SR = popStack() & 0xFF;
        },
        ROL = function (m) {
            tmp = getBit(m & 0xFF, 7);
            m = (m << 1) & 0xFE;
            m = m | getBit(SR, C);
            SR = tmp ? setBit(SR, C) : clearBit(SR, C);
            SR = m == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = getBit(m, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = SR & 0xFF;
            return m;
        },
        ROR = function (m) {
            tmp = getBit(m & 0xFF, 0);
            m = (m >> 1) & 0x7F;
            m = m | getBit(SR, C) ? 0x80 : 0x00;
            SR = tmp ? setBit(SR, C) : clearBit(SR, C);
            SR = m == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = getBit(m, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = SR & 0xFF;
            return m;
        },
        RTI = function () {
            SR = popStack() & 0xFF;
            tmp = popStack();
            PC = (popStack() << 8 | tmp) & 0xFF;
        },
        RTS = function () {
            tmp = popStack();
            PC = ((popStack() << 8 | tmp) + 1) & 0xFF;
        },
        SBC = function (m) {
            //TODO: Implement Decimal mode.
            tmp = A - m - (getBit(SR, C) == 0 ? 1 : 0);
            SR = tmp > 127 || tmp < -129 ? setBit(SR, V) : clearBit(SR, V);
            SR = tmp >= 0 ? setBit(SR, C) : clearBit(SR, C)
            SR = getBit(tmp, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = tmp == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            A = tmp & 0xFF;
            SR = SR & 0xFF;
        },
        SEC = function () {
            SR = setBit(SR, C);
            SR = SR & 0xFF;
        },
        SED = function () {
            SR = setBit(SR, D);
            SR = SR & 0xFF;
        },
        SEI = function () {
            SR = setBit(SR, I);
            SR = SR & 0xFF;
        },
        STA = function () {
            RAM[addr] = A;
        },
        STX = function () {
            RAM[addr] = X;
        },
        STY = function () {
            RAM[addr] = Y;
        },
        TAX = function () {
            X = A & 0xFF;
            SR = getBit(X, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = X == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        TAY = function () {
            Y = A & 0xFF;
            SR = getBit(Y, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = Y == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        TSX = function () {
            X = SP & 0xFF;
            SR = getBit(X, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = X == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        TXA = function () {
            A = X & 0xFF;
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        TXS = function () {
            SP = X & 0xFF;
        },
        TYA = function () {
            A = Y & 0xFF;
            SR = getBit(A, 7) ? setBit(SR, N) : clearBit(SR, N);
            SR = A == 0 ? setBit(SR, Z) : clearBit(SR, Z);
            SR = SR & 0xFF;
        },
        // Instruction addr
        INSTADDR = {
            // ADC IM
            0x69: function () {
                ADC(eatByte());
            },
            // ADC ZP
            0x65: function () {
                addrZP();
                ADC(mem.peek);
            },
            // ADC ZPX   
            0x75: function () {
                addrZPX();
                ADC(mem.peek);
            },
            // ADC AB
            0x6D: function () {
                addrAB();
                ADC(mem.peek);
            },
            // ADC ABX
            0x7D: function () {
                addrABX();
                ADC(mem.peek);
            },
            // ADC ABY
            0x79: function () {
                addrABY();
                ADC(mem.peek);
            },
            // ADC IDX
            0x61: function () {
                addrIDX();
                ADC(mem.peek);
            },
            // ADC IDY
            0x71: function () {
                addrIDY();
                ADC(mem.peek);
            },
            // AND IM
            0x29: function () {
                AND(eatByte());
            },
            // AND ZP
            0x25: function () {
                addrZP();
                AND(mem.peek);
            },
            // AND ZPX
            0x35: function () {
                addrZPX();
                AND(mem.peek);
            },
            // AND AB
            0x2D: function () {
                addrAB();
                AND(mem.peek);
            },
            // AND ABX
            0x3D: function () {
                addrABX();
                AND(mem.peek);
            },
            // AND ABY
            0x39: function () {
                addrABY();
                AND(mem.peek);
            },
            // AND IDX
            0x21: function () {
                addrIDX();
                AND(mem.peek);
            },
            // AND IDY
            0x31: function () {
                addrIDY();
                AND(mem.peek);
            },
            // ASL ACC
            0x10: function () {
                A = ASL(A);
            },
            // ASL ZP
            0x06: function () {
                addrZP();
                mem.poke = ASL(mem.peek);
            },
            // ASL ZPX
            0x16: function () {
                addrZPX();
                mem.poke = ASL(mem.peek);
            },
            // ASL AB
            0x0E: function () {
                addrAB();
                mem.poke = ASL(mem.peek);
            },
            // ASL ABX
            0x1E: function () {
                addrABX();
                mem.poke = ASL(mem.peek);
            },
            // BCC REL
            0x90: function () {
                if (getBit(SR, C) == 0) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BCS REL
            0xB0: function () {
                if (getBit(SR, C) == 1) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BEQ REL
            0xF0: function () {
                if (getBit(SR, Z) == 1) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BIT ZP
            0x24: function () {
                addrZP();
                BIT(RAM(addr));
            },
            // BIP AB
            0x2C: function () {
                addrAB();
                BIT(RAM(addr));
            },
            // BMI REL
            0x30: function () {
                if (getBit(SR, N) == 1) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BNE REL
            0xD0: function () {
                if (getBit(SR, Z) == 0) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BPL REL
            0x10: function () {
                if (getBit(SR, N) == 0) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BRK
            0x00: function () {
                SR = setBit(SR, B) & 0xFF;
            },
            // BVC REL
            0x50: function () {
                if (getBit(SR, V) == 0) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // BVS REL
            0x70: function () {
                if (getBit(SR, V) == 1) brchREL();
                else PC = (PC + 1) & 0xFFFF;
            },
            // CLC IMP
            0x24: function () {
                clearBit(SR, C);
            },
            // CLD IMP
            0xD8: function () {
                clearBit(SR, D);
            },
            // CLI IMP
            0x58: function () {
                clearBit(SR, I);
            },
            // CLV IMP
            0xB8: function () {
                clearBit(SR, V);
            },
            // CMP IM
            0xC9: function () {
                CMP(eatByte());
            },
            // CMP ZP
            0xC5: function () {
                addrZP();
                CMP(mem.peek);
            },
            // CMP ZPX
            0xD5: function () {
                addrZPX();
                CMP(mem.peek);
            },
            // CMP AB
            0xCD: function () {
                addrAB();
                CMP(mem.peek);
            },
            // CMP ABX
            0xDD: function () {
                addrABX();
                CMP(mem.peek);
            },
            // CMP ABY
            0xD9: function () {
                addrABY();
                CMP(mem.peek);
            },
            // CMP IDX
            0xC1: function () {
                addrIDX();
                CMP(mem.peek);
            },
            // CMP IDY
            0xD1: function () {
                addrIDY();
                CMP(mem.peek);
            },
            // CPX IM
            0xE0: function () {
                CPX(eatByte());
            },
            // CPX ZP
            0xE4: function () {
                addrZP();
                CPX(mem.peek);
            },
            // CPX AB
            0xEC: function () {
                addrAB();
                CPX(mem.peek);
            },
            // CPY IM
            0xC0: function () {
                CPY(eatByte());
            },
            // CPY ZP
            0xC4: function () {
                addrZP();
                CPY(mem.peek);
            },
            // CPY AB
            0xCC: function () {
                addrAB();
                CPY(mem.peek);
            },
            // DEC ZP
            0xC6: function () {
                addrZP();
                DEC(mem.peek);
            },
            // DEC ZPX
            0xD6: function () {
                addrZPX();
                DEC(mem.peek);
            },
            // DEC AB
            0xCE: function () {
                addrAB();
                DEC(mem.peek);
            },
            // DEC ABX
            0xDE: function () {
                addrABX();
                DEC(mem.peek);
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
                addrZP();
                EOR(mem.peek);
            },
            // EOR ZPX
            0x55: function () {
                addrZPX();
                EOR(mem.peek);
            },
            // EOR AB
            0x4D: function () {
                addrAB();
                EOR(mem.peek);
            },
            // EOR ABX
            0x5D: function () {
                addrABX();
                EOR(mem.peek);
            },
            // EOR ABY
            0x59: function () {
                addrABY();
                EOR(mem.peek);
            },
            // EOR IDX
            0x41: function () {
                addrIDX();
                EOR(mem.peek);
            },
            // EOR IDY
            0x51: function () {
                addrIDY();
                EOR(addr);
            },
            // INC ZP
            0xE6: function () {
                addrZP();
                mem.poke = INC(mem.peek);
            },
            // INC ZPX
            0xF6: function () {
                addrZPX();
                mem.poke = INC(mem.peek);
            },
            // INC AB
            0xEE: function () {
                addrAB();
                mem.poke = INC(mem.peek);
            },
            // INC ABX
            0xFE: function () {
                addrABX();
                mem.poke = INC(mem.peek);
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
                addrAB();
                JMP(addr);
            },
            // JMP ID
            0x6C: function () {
                addrID();
                JMP(mem.peek);
            },
            // JSR AB
            0x20: function () {
                addrAB();
                JSR(addr);
            },
            // LDA IM
            0xA9: function () {
                LDA(eatByte());
            },
            // LDA ZP
            0xA5: function () {
                addrZP();
                LDA(mem.peek);
            },
            // LDA ZPX
            0xB5: function () {
                addrZPX();
                LDA(mem.peek);
            },
            // LDA AB
            0xAD: function () {
                addrAB();
                LDA(mem.peek);
            },
            // LDA ABX
            0xBD: function () {
                addrABX();
                LDA(mem.peek);
            },
            // LDA ABY
            0xB9: function () {
                addrABY();
                LDA(mem.peek);
            },
            // LDA IDX
            0xA1: function () {
                addrIDX();
                LDA(mem.peek);
            },
            // LDA IDY
            0xB1: function () {
                addrIDY();
                LDA(mem.peek);
            },
            // LDX IM
            0xA2: function () {
                LDX(eatByte());
            },
            // LDX ZP
            0xA6: function () {
                addrZP();
                LDX(mem.peek);
            },
            // LDX ZPY
            0xB6: function () {
                addrZPY();
                LDX(mem.peek);
            },
            // LDX AB
            0xAE: function () {
                addrAB();
                LDX(mem.peek);
            },
            // LDX ABY
            0xBE: function () {
                addrABY();
                LDX(mem.peek);
            },
            // LDY IM
            0xA0: function () {
                LDY(eatByte());
            },
            // LDY ZP
            0xA4: function () {
                addrZP();
                LDY(mem.peek);
            },
            // LDY ZPX
            0xB4: function () {
                addrZPX();
                LDY(mem.peek);
            },
            // LDY AB
            0xAC: function () {
                addrAB();
                LDY(mem.peek);
            },
            // LDY ABX
            0xBC: function () {
                addrABX();
                LDY(mem.peek);
            },
            // LSR A
            0x4A: function () {
                A = LSR(A);
            },
            // LSR ZP
            0x46: function () {
                addrZP();
                mem.poke = LSR(mem.peek);
            },
            // LSR ZPX
            0x56: function () {
                addrZPX();
                mem.poke = LSR(mem.peek);
            },
            // LSR AB
            0x4E: function () {
                addrAB();
                mem.poke = LSR(mem.peek);
            },
            // LSR ABX
            0x5E: function () {
                addrABX();
                mem.poke = LSR(mem.peek);
            },
            // NOP
            0xEA: function () {},
            // ORA IM
            0x09: function () {
                ORA(eatByte());
            },
            // ORA ZP
            0x05: function () { 
                addrZP();
                ORA(mem.peek);
            },
            // ORA ZPX
            0x15: function () {
                addrZPX();
                ORA(mem.peek);
            },
            // ORA AB
            0x0D: function () {
                addrAB();
                ORA(mem.peek);
            },
            // ORA ABX
            0x1D: function () {
                addrABX();
                ORA(mem.peek);
            },
            // ORA ABY
            0x19: function () {
                addrABY();
                ORA(mem.peek);
            },
            // ORA IDX
            0x01: function () {
                addrIDX();
                ORA(mem.peek);
            },
            // ORA IDY
            0x11: function () {
                addrIDY();
                ORA(mem.peek);
            },
            // PHA
            0x40: function () {
                PHA();
            },
            // PHP
            0x08: function () {
                PHP();
            },
            // PLA
            0x68: function () {
                PLA();
            },
            // PLP
            0x28: function () {
                PLP();
            },
            // ROL A
            0x2A: function () {
                A = ROL(A);
            },
            // ROL ZP
            0x26: function () {
                addrZP();
                mem.poke = ROL(mem.peek);
            },
            // ROL ZPX
            0x36: function () {
                addrZPX();
                mem.poke = ROL(mem.peek);
            },
            // ROL AB
            0x2E: function () {
                addrAB();
                mem.poke = ROL(mem.peek);
            },
            // ROL ABX
            0x3E: function () {
                addrABX();
                mem.poke = ROL(mem.peek);
            },
            // ROR A
            0x6A: function () {
                A = ROR(A);
            },
            // ROR ZP
            0x66: function () {
                addrZP();
                mem.poke = ROR(mem.peek);
            },
            // ROR ZPX
            0x76: function () {
                addrZPX();
                mem.poke = ROR(mem.peek);
            },
            // ROR AB
            0x6E: function () {
                addrAB();
                mem.poke = ROR(mem.peek);
            },
            // ROR ABX
            0x7E: function () {
                addrABX();
                mem.poke = ROR(mem.peek);
            },
            // RTI
            0x40: function () {
                RTI();
            },
            // RTS
            0x60: function () {
                RTS();
            },
            // SBC IM
            0xE9: function () {
                SBC(eatByte());
            },
            // SBC ZP
            0xE5: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SBC ZPX
            0xF5: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SBC AB
            0xED: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SBC ABX
            0xFD: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SBC ABY
            0xF9: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SBC IDX
            0xE1: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SBC IDY
            0xF1: function () {
                addrZP();
                SBC(mem.peek);
            },
            // SEC
            0x38: function () {
                SEC();
            },
            // SED
            0xF8: function () {
                SED();
            },
            // SEI
            0x78: function () {
                SEI();
            },
            // STA ZP
            0x85: function () {
                addrZP();
                STA()
            },
            // STA ZPX
            0x95: function () {
                addrZPX();
                STA()
            },
            // STA AB
            0x8D: function () {
                addrAB();
                STA()
            },
            // STA ABX
            0x9D: function () {
                addrABX();
                STA()
            },
            // STA ABY
            0x99: function () {
                addrABY();
                STA()
            },
            // STA IDX
            0x81: function () {
                addrIDX();
                STA()
            },
            // STA IDY
            0x91: function () {
                addrIDY();
                STA()
            },
            // STX ZP
            0x86: function () {
                addrZP();
                STX();
            },
            // STX ZPX
            0x96: function () {
                addrZPX();
                STX();
            },
            // STX AB
            0xBE: function () {
                addrAB();
                STX();
            },
            // STY ZP
            0x84: function () {
                addrZP();
                STY();
            },
            // STY ZPX
            0x94: function () {
                addrZPX();
                STY();
            },
            // STY AB
            0xBC: function () {
                addrAB();
                STY();
            },
            // TAX
            0xAA: function () {
                TAX();
            },
            // TAY
            0xA8: function () {
                TAY();
            },
            // TSX
            0xBA: function () {
                TSX();
            },
            // TXA
            0x8A: function () {
                TXA();
            },
            // TXS
            0x9A: function () {
                TXS();
            },
            // TYA
            0x98: function () {
                TYA();
            }
        },
        mem = {},
        dec16ToHex = function (dec) {
            var h = dec.toString(16);
            return ('0000'.substr(0, 4 - h.length) + h).toUpperCase();
        },
        dec8ToHex = function (dec) {
            var h = dec.toString(16);
            return ('00'.substr(0, 2 - h.length) + h).toUpperCase();
        },
        dec8ToBin = function (dec) {
            var b = dec.toString(2);
            return ('00000000'.substr(0, 8 - b.length) + b).split('').reverse().join('');
        },
        opCode,
        hasWorker = typeof SharedWorker != 'undefined',
        worker,
        isWorkerRunning = false,
        loadWorker = function () {
            worker = new SharedWorker('js/6502-cpu-worker.js');
            worker.port.onmessage = function(e) {
                if (e.data == 'finish') {
                    isWorkerRunning = false;
                } else if (e.data == 'connected') {
                    isWorkerConnected =  true;
                } else if (e.data[0] == 'regdump') {
                    registerDumpData = e.data[1];
                }
            };
            
            worker.port.start();
        },
        executeWithSharedWorker = function () {
            if (!isWorkerRunning) {
                worker.port.postMessage(['run']);
                isWorkerRunning = true;
            }
        },
        executeInThread = function (port, callback) {
            var int = 0;
            while (!getBit(SR, B)) {
                opCode = eatByte();
                if (opCode in INSTADDR) {
                    INSTADDR[opCode]();
                }
                callback();
                port.postMessage(int++);
            }
        },
        executeWithTimer = function () {
            if (!getBit(SR, B)) {
                setTimeout(executeWithTimer, 0);
                opCode = eatByte();
                if (opCode in INSTADDR) {
                    INSTADDR[opCode]();
                } else {
                    console.log('Invalid OpCode $' + dec8ToHex(opCode), 'at instruction address $' + dec16ToHex(PC - 1));
                }
            } else {
                console.log('Program terminated at $' + dec16ToHex(PC));
            }
        },
        burnProgramAt = function (src, address) {
            var index,
                len = src.length;
            for (index = 0; index < len; ++index) {
                RAM[address + index] = src[index];
            }
            if (hasWorker && isWorkerConnected) {
                worker.port.postMessage(['ram', RAM]);
            }
        },
        isWorker = typeof WorkerGlobalScope != 'undefined' && self instanceof WorkerGlobalScope,
        registerDumpData = '',
        isWorkerConnected = false,
        CPU6502 = {};

    Object.defineProperty(mem, 'poke', {
        set: function (value) {
            RAM[addr] = value & 0xFF;
        }
    });
    Object.defineProperty(mem, 'peek', {
        get: function () {
            return RAM[addr] & 0xFF;
        }
    });
    // Expose some elements for communication
    // between other modules.
    Object.defineProperty(CPU6502, 'RAM', {
       get: function () {
           return RAM;
       } 
    });
    Object.defineProperty(CPU6502, 'reset', {
        writable: false,
        value: function () {
            var index,
                len = RAM.length;
            for (index = 0; index < len; ++index) {
                RAM[index] = 0;
            }
            A = X = Y = SR = PC = 0;
            SR = setBit(SR, 2);
            SP = 0xFF;
            if (hasWorker && isWorkerConnected) {
                worker.port.postMessage(['reset']);
            }
        }
    });
    Object.defineProperty(CPU6502, 'run', {
        writable: false,
        value: function () {
            if (hasWorker && isWorkerConnected) {
                executeWithSharedWorker();  
            } else {
                executeWithTimer();
            }
        }
    });
    Object.defineProperty(CPU6502, 'runOnThread', {
        writable: false,
        value: function (port, callback) {
            if (isWorker) {
                executeInThread(port, callback);
            }
        }
    });
    Object.defineProperty(CPU6502, 'burn', {
        writable: false,
        value: burnProgramAt
    });
    Object.defineProperty(CPU6502, 'dumpRegisters', {
        writable: false,
        value: function () {
            if (isWorker) {
                var str = '\nA: $' + dec8ToHex(A);
                str += '\nX: $' + dec8ToHex(X);
                str += '\nY: $' + dec8ToHex(Y);
                str += '\nSR: ' + dec8ToBin(SR);
                str += '\nPC: $' + dec16ToHex(PC);
                str += '\nSP: $' + dec8ToHex(SP);
                return str + '\n';
            } else {
                return registerDumpData;
            }
        }
    });
    Object.defineProperty(CPU6502, 'dumpMemory', {
        writable: false,
        value: function (from, to, columns) {
            if (typeof from == 'number' && typeof to == 'number') {
                columns = typeof columns != 'number' ? 16 : columns;
                var index,
                    str = '',
                    len = to - from;
                for (index = 0; index < len; ++index) {
                    str += '$' + dec8ToHex(RAM[from + index]) + ' ';
                    if (index > 0 && index % columns == 0) {
                        str += '\n';
                    }
                }
                return str;
            } else {
                console.log('Missing range for memory dump.');
            }
            return '';
        }
    });
    CPU6502.reset();
    scope.CPU6502 = CPU6502;
    if (hasWorker) {
        loadWorker();
    }
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));