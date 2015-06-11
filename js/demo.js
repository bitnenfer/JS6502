CPU6502 = CPU6502 || {};
var debug = false,
    update,
    regHTMLTag;
    
window.onload = function () {
    regHTMLTag = document.getElementById('registers');
    update = function () {
        if (debug) setTimeout(update, 0);
        regHTMLTag.innerHTML = CPU6502.dumpRegisters();
    };
    update();
};

function CheckDebugMode(tag) {
    debug = tag.checked;
    if (debug) {
        update();
    }
}
