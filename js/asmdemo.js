var assemble = function () {
    console.log(ASM6502.dumpObjectCodeToHex(ASM6502.processSource(document.getElementById('code').innerHTML)));
};