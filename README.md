# 6502 Assembler & Emulator written in JavaScript

[Live Demo](http://damnbrain.com/dev/6502)

6502 Emulator and Assembler written in JavaScript 
by [Felipe Alfonso](http://twitter.com/pixelstab).

About the Emulator
-------------------
The emulator has:
- 64 KB of memory.
- Screen memory starts at $0100 and ends at $04FF.
- Background color is defined at address $E400.
- Text color is defined at address $E401.
- Color values go from $0 to $F.

About the assembler
-------------------
The assembler has:
- Basic assembly directives like .BYTE to define 8 bit values and .WORD to define 16 bit.
- Support for string use in .BYTE directive and char as immediate address mode.
- Multiple arguments for directives to define arrays.
- 6502 mnemonics.
- Labeling.
- Can set origin.

Note
----
- There might still be some issues with the assembler.
- Decimal mode not implemented yet
- No support for illegal opcodes. They will be transfromed to NOP by assembler.
