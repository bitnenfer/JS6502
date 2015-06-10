/**
 **
 **  6502 OP CODES Lookup Table
 **
 **     Address modes
 **     -------------
 **     A   = Accumulator
 **     IMM = Immediate 
 **     ZP  = Zero Page
 **     ZPX = Zero Page, X
 **     ZPY = Zero Page, Y
 **     ABS = Absolute
 **     ABX = Absolute, X
 **     ABY = Absolute, Y
 **     IND = Indirect
 **     IDX = Indirect, X
 **     IDY = Indirect, Y
 **     IMP = Implied
 **     REL = Relative
 **/
(function (scope) {
    var opCodes;
    opCodes = {
        //MN   A    IMM    ZP    ZPX   ZPY   ABS   ABX   ABY  IND   IDX   IDY   IMP   REL
        ADC: [null, 0x69, 0x65, 0x75, null, 0x6d, 0x7d, 0x79, null, 0x61, 0x71, null, null],
        AND: [null, 0x29, 0x25, 0x35, null, 0x2d, 0x3d, 0x39, null, 0x21, 0x31, null, null],
        ASL: [null, null, 0x06, 0x16, null, 0x0e, 0x1e, null, null, null, null, 0x0a, null],
        BIT: [null, null, 0x24, null, null, 0x2c, null, null, null, null, null, null, null],
        BPL: [null, null, null, null, null, null, null, null, null, null, null, null, 0x10]
    };
    scope.op6502 = opCodes;
}(window))