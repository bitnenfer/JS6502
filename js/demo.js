window.onload = function () {
    var regHTMLTag = document.getElementById('registers'),
        update = function () {
            setTimeout(update, 0);
            regHTMLTag.innerHTML = CPU6502.dumpRegisters();
        };

    update();
};
