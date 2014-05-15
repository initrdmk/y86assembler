// y86 asm to quartus MIF file
//  By mingkaidox

var to_mif = function(codes, width, depth) {
    if (0 != width % 8) return '';
    var out = "% MIF made by Y86 assembler\n";
    out += "DEPTH = " + depth + ';\n';
    out += "WIDTH = " + width + ';\n';
    out += 'ADDRESS_RADIX = HEX;\n';
    out += 'DATA_RADIX = HEX;\n';
    out += 'CONTENT\n';
    out += 'BEGIN\n';
    width /= 4;
    var line = 0;
    codes = codes.split(/\s+|\n/).join('');
    for (var i=1; i<width; ++i) {
        codes += '0';
    }
    while (codes.length >= width) {
        out += ' ' + line + ' : ' + codes.slice(0, width) + ';\n';
        line++;
        codes = codes.slice(width);
    }
    out += 'END;\n';
    return out;
};
