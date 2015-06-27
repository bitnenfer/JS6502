/*
 *   6502 JavaScript Emulator and Assembler
 *   http://damnbrain.com/
 *
 *   The MIT License (MIT)
 *   
 *   Copyright (c) 2015 Felipe Alfonso
 *   
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *   
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *   
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 *
 */
(function (scope) {
    'use strict';
    var canvas,
        context,
        canvasWidth,
        canvasHeight,
        buffer,
        bufferContext,
        bufferWidth,
        bufferHeight,
        textColor = 0,
        colorPalette = [
            '#000000',
            '#FFFFFF',
            '#FA3100',
            '#1DE0FF',
            '#AB47D8',
            '#004AD0',
            '#FFEE3D',
            '#FF5B00',
            '#C23D00',
            '#FF723E',
            '#606060',
            '#909090',
            '#B1FF8A',
            '#4788FF',
            '#C3B8B7'
        ],
        colorPaletteRGB = [
            [0, 0, 0],
            [1, 1, 1],
            [250, 49, 0],
            [29, 224, 255],
            [171, 71, 216],
            [0, 74, 208],
            [255, 238, 61],
            [255, 91, 0],
            [194, 61, 0],
            [255, 114, 62],
            [96, 96, 96],
            [144, 144, 144],
            [177, 255, 138],
            [71, 136, 255],
            [195, 184, 183]
        ],
        currentBackgroundColor = 0,
        bufferData = [],
        spriteAddress = [
            
        ],
        textBuffer = [],
        bufferAddress = 0x0100,
        textBufferAddress = 0x0600,
        slice = Array.prototype.slice,
        onWindowLoad = function (e) {
            canvas = document.getElementById('canvas');
            context = canvas.getContext('2d');
            canvasWidth = canvas.width;
            canvasHeight = canvas.height;
            buffer = document.createElement('canvas');
            bufferContext = buffer.getContext('2d');
            buffer.width = 32;
            buffer.height = 32;
            bufferWidth = buffer.width;
            bufferHeight = buffer.height;
            context.font = '17px C64';
            context.textAlign = 'left';
            update();
        },
        copyBufferToCanvas = function () {
            var length = bufferWidth * bufferHeight,
                x = 0,
                y = 0,
                data = slice.call(CPU6502.RAM, bufferAddress, bufferAddress + length),
                rgb;
                
            
            for (var index = 0; index < length; ++index) {
                y = Math.floor(index / bufferWidth);
                x = Math.floor(index % bufferHeight);
                rgb = colorPalette[data[index] & 0xF];
                if (rgb != '#000000') {
                    bufferContext.fillStyle = rgb;
                    bufferContext.fillRect(x, y, 1, 1);
                }
            }
        },
        copyTextBufferToCanvas = function () {
            var length = bufferWidth * bufferHeight,
                x = 0,
                y = 0,
                data = slice.call(CPU6502.RAM, textBufferAddress, textBufferAddress + length),
                rgb,
                line = 0,
                col = 0;
            
            textColor = CPU6502.getByte(0xE401);
            textBuffer.length = 0;
            textBuffer.push('');

            for (var index = 0; index < length; ++index) {
                if (data[index] != 0) {
                    if (data[index] == 13 || col++ == 24) {
                        ++line;
                        textBuffer.push('');
                        col = 0;
                    } else {
                        textBuffer[line] += String.fromCharCode(data[index]);
                    }
                }
                if (data[index] == 0x9B) {
                    break;
                }
            }
        },
        refresh = (function () {
            return scope.requestAnimationFrame ||
                scope.msRequestAnimationFrame ||
                scope.webkitRequestAnimationFrame ||
                scope.mozRequestAnimationFrame ||
                scope.oRequestAnimationFrame ||
                function (callback) {
                    scope.setTimeout(callback, 16);
                };
        }()),
        clearBackground = function () {
            currentBackgroundColor = scope.CPU6502.getByte(0xE400) & 0xF;
            bufferContext.fillStyle = colorPalette[currentBackgroundColor];
            bufferContext.fillRect(0, 0, bufferWidth, bufferHeight);
        },
        update = function () {
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            refresh(update);
            clearBackground();
            bufferContext.imageSmoothingEnabled = false;
            bufferContext.mozImageSmoothingEnabled = false;
            bufferContext.webkitImageSmoothingEnabled = false;
            copyBufferToCanvas();
            copyTextBufferToCanvas();
            context.imageSmoothingEnabled = false;
            context.mozImageSmoothingEnabled = false;
            context.webkitImageSmoothingEnabled = false;
            context.save();
            context.scale(10, 10);
            context.drawImage(buffer, 0, 0);
            context.restore();
            context.fillStyle = colorPalette[textColor];
            for (var i = 0; i < textBuffer.length; ++i) {
                context.fillText(textBuffer[i], 0, (i + 1) * 16);
            }
        };
    
    window.addEventListener('load', onWindowLoad);
}(window));