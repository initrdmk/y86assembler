// Y86 assembler
//      by mingkaidox


var need_reg = ['20', '30', '40', '50', '60', 'A0', 'B0'];
var need_imm = ['30', '40', '50', '70', '80'];

var icode2byte = {
    'halt'  :   '00',
    'nop'   :   '10',
    'rrmovl':   '20',
    'cmovle':   '21',
    'cmovl' :   '22',
    'cmove' :   '23',
    'cmovne':   '24',
    'cmovge':   '25',
    'cmovg' :   '26',
    'irmovl':   '30',
    'rmmovl':   '40',
    'mrmovl':   '50',
    'addl'  :   '60',
    'subl'  :   '61',
    'andl'  :   '62',
    'xorl'  :   '63',
    'jmp'   :   '70',
    'jle'   :   '71',
    'jl'    :   '72',
    'je'    :   '73',
    'jne'   :   '74',
    'jge'   :   '75',
    'jg'    :   '76',
    'call'  :   '80',
    'ret'   :   '90',
    'pushl' :   'A0',
    'popl'  :   'B0',
};

var reg2num = {
    '%eax'  :   '0',
    '%ecx'  :   '1',
    '%edx'  :   '2',
    '%ebx'  :   '3',
    '%esi'  :   '6',
    '%edi'  :   '7',
    '%esp'  :   '4',
    '%ebp'  :   '5',
}

// express imm in bytes (little-endian)
var imm2bytes = function (imm) {

    // check args
    if (undefined == imm) return null;
    if (null == imm) return null;
    if (0 == imm.length) return null;

    // check imm $
    if (imm[0] != '$') return null;
    imm = imm.substr(1);

    // check hex format
    var hex = (imm.indexOf('0x') == 0 || imm.indexOf('0X') == 0);
    if (hex) {
        // remove prefix
        imm = imm.substr(2);
    } else {
        // to hex
        imm = parseInt(imm).toString(16);
    }

    imm = ('00000000' + imm).slice(-8);
    // to litte endian
    imm = imm[6] + imm[7] + ' ' + imm[4] + imm[5] + ' '
        + imm[2] + imm[3] + ' ' + imm[0] + imm[1];
    return imm;
};

var immreg_seperator = function(immreg) {
    var imm = instr[1].match(/\$((0x)|)\w+/gi);
    if (imm.length < 1) return [];
    imm = imm2bytes(imm[0]);
    var reg = instr[1].match(/\(\%\w+\)/g);
    if (reg.length < 1) return [];
    reg = reg[0].slice[1,-1];
    return [imm, reg];
}

var assemble = function (code) {
    //

    console.log(code);
    // split
    codes = code.split('\n').map(function(e) {
        if (e.indexOf('#') != -1) {
            e = e.slice(0, e.indexOf('#'));
        }
        e = e.trim(' ');
        return e.split(/[\s,]+/);
    });
    // 
    instrs = codes.map(function(instr) {
        if (instr.length == 0) return "";
        if (instr[0].length == 0) return "";
        icode = icode2byte[instr[0]];
        if (undefined == icode) return "";
        var asm = icode;
        var regA = 'F';
        var regB = 'F';
        var imm = '';
        if ('40' === icode) {
            regA = reg2num[instr[1]];
            immreg = immreg_seperator(instr[2])
            if (immreg.length < 2) return '';
            imm = immreg[0];
            regB = immreg[1];
        }
        if ('50' === icode) {
            regA = reg2num[instr[2]];
            immreg = immreg_seperator(instr[1])
            if (immreg.length < 2) return '';
            imm = immreg[0];
            regB = immreg[1];
        }
        if (['2', '6', 'A', 'B'].indexOf(icode[0]) != -1) {
            regA = reg2num[instr[1]];
        }
        if (['2', '3', '6'].indexOf(icode[0]) != -1) {
            regB = reg2num[instr[2]];
        }
        if (['7', '8', '3'].indexOf(icode[0]) != -1) {
            imm = imm2bytes(instr[1]);
        }
        if (need_reg.indexOf(icode) != -1) {
            asm += ' ' + regA + regB;
        }
        if (need_imm.indexOf(icode) != -1) {
            asm += ' ' + imm;
        }
        return asm;
    });
    return instrs.join('\n');
    
};

