// Y86 assembler
//      by mingkaidox


var need_reg = ['2', '3', '4', '5', '6', 'A', 'B'];
var need_imm = ['3', '4', '5', '7', '8'];

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
    if (undefined == imm || null == imm) return null;
    if (0 == imm.length) return null;

    // check imm $
    if (imm[0] != '$') return null;
    imm = imm.substr(1);

    if (0 == imm.length) return null;

    // check negative imm
    var neg = false;
    if (imm[0] == '-') {
        neg = true;
        imm = imm.substr(1);
        if (0 == imm.length) return null;
    }

    // check hex format
    var hex = (imm.indexOf('0x') == 0 || imm.indexOf('0X') == 0);
    if (hex) {
        // remove prefix
        imm = imm.substr(2);
    } else {
        // to hex
        imm = parseInt(imm).toString(16);
    }
    if (neg) {
        imm = (0x100000000 - parseInt(imm, 16)).toString(16);
    }
    if (isNaN(parseInt(imm, 16)) || imm.length > 8) {
        return null;
    }
    imm = ('00000000' + imm).slice(-8);
    // to litte endian
    imm = imm[6] + imm[7] + ' ' + imm[4] + imm[5] + ' '
        + imm[2] + imm[3] + ' ' + imm[0] + imm[1];
    return imm;
};

var immreg_seperator = function(immreg) {
    var imm = immreg.match(/((0x)|)\w+/gi);
    if (imm.length < 1) return [];
    if (imm[0] != '$') imm[0] = '$' + imm[0];
    imm = imm2bytes(imm[0]);
    if (null == imm) return [];
    var reg = immreg.match(/\(\%\w+\)/g);
    if (reg.length < 1) return [];
    reg = reg[0].slice(1,-1);
    reg = reg2num[reg];
    if (undefined == reg) return [];
    return [imm, reg];
}

var lables = {}; // store labels
var pc = 0;
var err = 0;
var align = 4;

var assemble_inst = function(instr) {
    if (instr.length == 0) return {addr:pc, inst: ''};
    if (instr.length == 1 && instr[0] == '') return {addr:pc, inst: ''};
    if (instr[0].length == 0) return {addr:pc, inst: '', err:'INVALID_INST'};
    if ('.pos' === instr[0]) {
        pc = parseInt(instr[1]);
        return {addr:pc, inst:''};
    }
    if ('.align' == instr[0]) {
        align = parseInt(instr[1]);
        return {addr:pc, inst:''};
    }
    if ('.long' == instr[0]) {
        while (align && pc%align != 0) pc++;
        var ret = {addr:pc, inst:imm2bytes('$' + instr[1])};
        pc += 4;
        return ret;
    }
    if (instr[0].indexOf(':') != -1) {
        var offset = instr[0].indexOf(':');
        labels[instr[0].slice(0, offset)] = pc;
        if (':' == instr[0][instr[0].length - 1]) {
            instr = instr.slice(1);
            return {addr: pc, inst: ''};
        } else {
            instr[0] = instr[0].split(':')[1];
        }
    }
    icode = icode2byte[instr[0]];
    if (undefined == icode)
        return {addr:pc, inst: '', err:'INVALID_INST'};

    var asm = icode;
    var regA = 'F';
    var regB = 'F';
    var imm = '';
    if ('40' === icode) {
        regA = reg2num[instr[1]];
        immreg = immreg_seperator(instr[2])
        if (immreg.length < 2)
            return {addr:pc, inst: '', err:'INVALID_IMMREG'};
        imm = immreg[0];
        regB = immreg[1];
    }
    if ('50' === icode) {
        regA = reg2num[instr[2]];
        immreg = immreg_seperator(instr[1])
        if (immreg.length < 2)
            return {addr:pc, inst: '', err:'INVALID_IMMREG'};
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
        if (icode[0] == '7' || icode[0] == '8') {
            if (undefined == labels[instr[1]]) {
            } else {
                //
                instr[1] = "$" + labels[instr[1]];
            }
        }
        imm = imm2bytes(instr[1]);
    }
    var pc_inc = 1;
    var ret = null;
    if (need_reg.indexOf(icode[0]) != -1) {
        if (undefined == regA || undefined == regB)
            ret = {addr:pc, inst: '', err: 'INVALID_REG'};
        asm += ' ' + regA + regB;
        pc_inc++;
    }
    if (need_imm.indexOf(icode[0]) != -1) {
        if (null == imm)
            ret = {addr:pc, inst: '', err:'INVALID_IMM'};
        asm += ' ' + imm;
        pc_inc+=4;
    }
    if (null == ret)
        ret = {addr:pc, inst:asm};
    pc += pc_inc;
    return ret;
    //return asm;
};

var assemble = function (code) {
    //
    err = 0;
    labels = {};
    pc = 0;

    console.log(code);
    // split
    codes = code.split('\n').map(function(e) {
        if (e.indexOf('#') != -1) {
            e = e.slice(0, e.indexOf('#'));
        }
        e = e.trim(' ');
        return e.split(/[\s,]+/);
    });
    // collect labels
    codes.map(assemble_inst);
    // process
    pc = 0;
    instrs = codes.map(assemble_inst);
    var imem = [];
    instrs.map(function(e) {
        if (undefined != e.err) {
            err++;
            return;
        }
        var inst = e.inst.split(/\s+/).join('');
        var addr = e.addr;
        while (inst.length >= 2) {
            imem[addr] = inst.slice(0,2);
            addr += 1;
            inst = inst.slice(2);
        }
    });
    for (var i=0; i<imem.length; ++i) {
        if (undefined == imem[i]) {
            imem[i] = '00';
        }
    }
    imem = imem.join('');
    var ret = {
        err : err,
        imem: imem,
        instrs: instrs.map(function(e) {
            if (undefined != e.err) return e.err;
            return '0x' + e.addr.toString(16) + ':\t' + e.inst;
        }).join('\n')
    };
    return ret;
};
