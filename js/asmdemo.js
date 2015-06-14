var assemble = function () {
    document.getElementById("errors").innerHTML = '';
    try {
        document.getElementById("object-code").innerHTML = ASM6502.dumpObjectCodeToHex(ASM6502.processSource(document.getElementById('code').value));
    
    } catch (e) {
        document.getElementById("errors").innerHTML = e;
    }
    localStorage.setItem('ASMSourceCode', document.getElementById('code').value);
};

window.onload = function () {
    if (localStorage.getItem('ASMSourceCode') != null) {
        document.getElementById('code').value = localStorage.getItem('ASMSourceCode');
        assemble();
    }
    
    document.getElementById('code').addEventListener('keyup', function (e){
       assemble();
    }, false);
    document.getElementById('code').addEventListener('keydown', function(e) {
        if (e.keyCode == 9) {
            e.preventDefault();
            var s = this.selectionStart;
            this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
            this.selectionEnd = s+1; 
        }
    });
};

