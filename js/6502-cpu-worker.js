var window = {};
self.importScripts('6502-cpu.js');
var port;
self.onconnect = function(e) {
    port = e.ports[0];
    port.onmessage = function(e) {
        if (e.data[0] == 'run') {
            try {
                window.CPU6502.runOnThread(port, update);
            } catch (e) {
                port.postMessage('Error: ' + e);
            }
            port.postMessage('finish');
            
        } else if (e.data[0] == 'ram') {
            window.CPU6502.burn(e.data[1], 0, 65535);
            port.postMessage(['regdump', window.CPU6502.dumpRegisters()]);
        } else if (e.data[0] == 'reset') {
            window.CPU6502.reset();
            port.postMessage(['regdump', window.CPU6502.dumpRegisters()]);
        }
    };
    port.postMessage('connected');
    port.start();
};
var update = function () {
    port.postMessage(['regdump', window.CPU6502.dumpRegisters()]);
};