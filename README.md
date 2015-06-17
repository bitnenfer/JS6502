# 6502.js

[Live Demo](http://damnbrain.com/dev/6502)

6502 Emulator and Assembler written in JavaScript 
by [Felipe Alfonso](http://twitter.com/pixelstab).

More information about the 6502 microprocessor can be found at [6502.org](http://6502.org/) and
[Wikipedia](https://en.wikipedia.org/?title=MOS_Technology_6502).

For information about 6502 assembly I recommend [6502.org/tutorials](http://6502.org/tutorials/)

About the Emulator
-------------------
The emulator has:
- 64 KB of memory.
- Screen memory starts at $0100 and ends at $04FF.
- Text memory starts at $0600 and ends at $09FF.
- Background color is defined at address $E400.
- Text color is defined at address $E401.
- Color values go from $0 to $F.
- Keyboard input address is $E300

About the assembler
-------------------
The assembler has:
- Basic assembly directives like .BYTE to define 8 bit values and .WORD to define 16 bit.
- Support for string use in .BYTE directive and char as immediate address mode.
- Multiple arguments for directives to define arrays.
- 6502 mnemonics.
- Labeling

Note
----
- There might still be some issues with the assembler.
- Decimal mode not implemented yet
- Origin cannot be set yet.
- No support for illegal opcodes. They will be transfromed to NOP by assembler.
