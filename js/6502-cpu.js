/**
 **
 **     6502 JavaScript Emulator
 **     Author: Felipe Alfonso
 **
 **/
(function (scope) {
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
            return RAM[PC[0]++];
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
            addr[0] = eatByte();
        },
        // Zero Page X
        addrZPX = function () {
            addr[0] = addrZP() + reg[X];
        },
        // Zero Page Y
        addrZPY = function () {
            addr[0] = addrZP() + reg[Y];
        },
        // Absolute
        addrAB = function () {
            lsb = eatByte();
            msb = eatByte();
            addr[0] = (msb << 8) | (lsb & 0xff);
        },
        // Absolute X
        addrABX = function () {
            addr[0] = addrAB() + reg[X];
        },
        // Absolute Y
        addrABY = function () {
            addr[0] = addrAB() + reg[Y];
        },
        addrID = function () {
            addr[0] = RAM[eatByte()];
        },
        // Indirect X
        addrIDX = function () {
            addr[0] = RAM[eatByte() + reg[X]];
        },
        // Indirect Y
        addrIDY = function () {
            addr[0] = RAM[eatByte()] + reg[Y];
        },
        // Branch Relative
        brchREL = function () {
            var l = PC[0]&255|0,
                h = PC[0]/256|0,
                b = eatByte() & 0xFF;
            PC[0] = (((h << 8 | l) + b) & 0xFF) + 1;
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
        peek = function () {
            return RAM[addr[0]];
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
        STA = function () {
            RAM[addr[0]] = reg[A];
        },
        STX = function () {
            RAM[addr[0]] = reg[X];
        },
        STY = function () {
            RAM[addr[0]] = reg[Y];
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
                reg[A] = ASL(reg[A]);
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
                addrZP();
                BIT(RAM(addr[0]));
            },
            // BIP AB
            0x2C: function () {
                addrAB();
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
                EOR(addr[0]);
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
                JMP(addr[0]);
            },
            // JMP ID
            0x6C: function () {
                addrID();
                JMP(mem.peek);
            },
            // JSR AB
            0x20: function () {
                addrAB();
                JSR(addr[0]);
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
                reg[A] = LSR(reg[A]);
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
                reg[A] = ROL(reg[A]);
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
                reg[A] = ROR(reg[A]);
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
        opCode,
        execute = function () {
            if (!reg[B]) {
                setTimeout(execute, 16);
                opCode = eatByte();
                if (opCode in INSTADDR) {
                    INSTADDR[opCode]();
                } else {
                    console.log('Invalid OpCode $' + dec8ToHex(opCode), 'at instruction address $' + dec16ToHex(PC[0] - 1));
                }
            } else {
                console.log('Program terminated at $' + dec16ToHex(PC[0]));
            }
        },
        burnProgramAt = function (src, address) {
            var index,
                len = src.length;
            for (index = 0; index < len; ++index) {
                RAM[address + index] = src[index];
            }
        },
        statusBitsToString = function () {
            var index,
                length = reg.length,
                str = '';
            for (index = 3; index < length; ++index) {
                str += reg[index];
            }
            return str;
        };

    Object.defineProperty(mem, 'poke', {
        set: function (value) {
            RAM[addr[0]] = value;
        }
    });
    Object.defineProperty(mem, 'peek', {
        get: function () {
            return RAM[addr[0]];
        }
    });
    // Expose some elements for communication
    // between other modules.
    scope.CPU6502 = {};
    Object.defineProperty(scope.CPU6502, 'RAM', {
       get: function () {
           return RAM;
       } 
    });
    Object.defineProperty(scope.CPU6502, 'reset', {
        writable: false,
        value: function () {
            var index,
                len = RAM.lenght;
            for (index = 0; index < len; ++index) {
                RAM[index] = 0;
            }
            len = reg.length;
            for (index = 0; index < len; ++index) {
                reg[index] = 0;
            }
            reg[5] = 1;
            SP[0] = 0xFF;
            PC[0] = 0;
        }
    });
    Object.defineProperty(scope.CPU6502, 'run', {
        writable: false,
        value: function () {
           execute();
        }
    });
    Object.defineProperty(scope.CPU6502, 'burn', {
        writable: false,
        value: burnProgramAt
    });
    Object.defineProperty(scope.CPU6502, 'dumpRegisters', {
        writable: false,
        value: function () {
            var str = '\nA: $' + dec8ToHex(reg[A]);
            str += '\nX: $' + dec8ToHex(reg[X]);
            str += '\nY: $' + dec8ToHex(reg[Y]);
            str += '\nSR: ' + statusBitsToString();
            str += '\nPC: $' + dec16ToHex(PC[0]);
            str += '\nSP: $' + dec8ToHex(SP[0]);
            return str + '\n';
        }
    });
    Object.defineProperty(scope.CPU6502, 'dumpMemory', {
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
    scope.CPU6502.reset();
}(typeof window != 'undefined' ? window : typeof exports != 'undefined' ? exports : {}));