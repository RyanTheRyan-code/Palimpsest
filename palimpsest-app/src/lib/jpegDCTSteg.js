
export async function encodeJPEG(sourceBuffer, message) {
    console.log("[JSteg] Starting Transcode Encoding...");
    
    const jpegData = new Uint8Array(sourceBuffer);
    const parser = new JpegParser(jpegData);
    const structure = parser.parse(); 

    if (structure.isProgressive) {
        throw new Error("Progressive JPEGs are not supported. Please use a standard Baseline JPEG.");
    }

    if (!structure.frame || !structure.frame.components[0]) {
        throw new Error("Invalid JPEG: No components found.");
    }

    const fullMessage = message + "|||"; 
    let messageBits = [];
    for (let i = 0; i < fullMessage.length; i++) {
        const code = fullMessage.charCodeAt(i);
        for (let j = 7; j >= 0; j--) {
            messageBits.push((code >> j) & 1);
        }
    }

    const component = structure.frame.components[0]; 
    jStegEmbed(component.blocks, messageBits);

    const newJpegBytes = parser.pack(structure);
    
    console.log(`[JSteg] Encoding Complete. Output size: ${newJpegBytes.length}`);
    return new Blob([newJpegBytes], { type: 'image/jpeg' });
}

export async function decodeJPEG(jpegBlob) {
    console.log("[JSteg] Starting Transcode Decoding...");
    const buffer = await jpegBlob.arrayBuffer();
    const jpegData = new Uint8Array(buffer);
    
    const parser = new JpegParser(jpegData);
    const structure = parser.parse();

    if (!structure.frame) throw new Error("Could not parse JPEG structure.");

    const component = structure.frame.components[0];
    const extractedMsg = jStegExtract(component.blocks);

    return extractedMsg;
}


function jStegEmbed(coeffs, bits) {
    console.log(`[JSteg] Embedding ${bits.length} bits into ${coeffs.length} coefficients...`);
    let bitIdx = 0;
    let changed = 0;

    for (let i = 0; i < coeffs.length; i++) {
        if (bitIdx >= bits.length) break;

        let val = coeffs[i];
        
        if (i % 64 === 0) continue;

        if (val !== 0 && val !== 1 && val !== -1) {
            const bit = bits[bitIdx];
            
            if (val > 0) {
                if ((val & 1) !== bit) {
                    coeffs[i] = (val & ~1) | bit;
                    changed++;
                }
            } else {
                let absVal = Math.abs(val);
                if ((absVal & 1) !== bit) {
                    absVal = (absVal & ~1) | bit;
                    coeffs[i] = -absVal;
                    if (coeffs[i] === 0) coeffs[i] = (val < 0 ? -2 : 2); 
                    changed++;
                }
            }
            bitIdx++;
        }
    }
    
    if (bitIdx < bits.length) {
        console.warn(`[JSteg] Capacity Exceeded! Wrote ${bitIdx} bits, needed ${bits.length}.`);
    }
}

function jStegExtract(coeffs) {
    let bits = [];
    const limit = Math.min(coeffs.length, 2000000); 
    
    for (let i = 0; i < limit; i++) {
        if (i % 64 === 0) continue; 

        let val = coeffs[i];
        if (val !== 0 && val !== 1 && val !== -1) {
            bits.push(Math.abs(val) & 1);
        }
    }

    let msg = "";
    let byte = 0;
    let count = 0;
    const MAX_CHARS = 20000; 

    for (let b of bits) {
        byte = (byte << 1) | b;
        count++;
        if (count === 8) {
            const char = String.fromCharCode(byte);
            msg += char;
            byte = 0;
            count = 0;
            
            if (msg.endsWith("|||")) return msg.slice(0, -3);
            if (msg.length > MAX_CHARS) break;
        }
    }
    return "";
}


const STD_DC_LUM_NR = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const STD_DC_LUM_VAL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const STD_AC_LUM_NR = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
const STD_AC_LUM_VAL = [0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa];

const STD_DC_CHR_NR = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
const STD_DC_CHR_VAL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const STD_AC_CHR_NR = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
const STD_AC_CHR_VAL = [0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa];

function buildHuffmanTable(nrcodes, values) {
    var codevalue = 0, pos_in_table = 0, HT = new Uint16Array(65536);
    for (var k = 1; k <= 16; k++) {
        for (var j = 0; j < nrcodes[k]; j++) {
            for (var i = codevalue << (16 - k), cntTo = ((codevalue + 1) << (16 - k)); i < cntTo; i++) {
                HT[i] = values[pos_in_table] + (k << 8);
            }
            pos_in_table++;
            codevalue++;
        }
        codevalue *= 2;
    }
    return HT;
}

function computeHuffmanTblEnc(nrcodes, std_table) {
    var codevalue = 0, pos = 0, HT = [];
    for (var k = 1; k <= 16; k++) {
        for (var j = 1; j <= nrcodes[k]; j++) {
            HT[std_table[pos]] = { val: codevalue, len: k };
            pos++;
            codevalue++;
        }
        codevalue *= 2;
    }
    return HT;
}

const YDC_HT_ENC = computeHuffmanTblEnc(STD_DC_LUM_NR, STD_DC_LUM_VAL);
const YAC_HT_ENC = computeHuffmanTblEnc(STD_AC_LUM_NR, STD_AC_LUM_VAL);
const CDC_HT_ENC = computeHuffmanTblEnc(STD_DC_CHR_NR, STD_DC_CHR_VAL);
const CAC_HT_ENC = computeHuffmanTblEnc(STD_AC_CHR_NR, STD_AC_CHR_VAL);

class JpegParser {
    constructor(data) {
        this.data = data;
        this.offset = 0;
        this.frame = null;
        this.huffmanTablesAC = [];
        this.huffmanTablesDC = [];
        this.qts = [];
        this.APPn = [];
        this.jfif = null;
        this.tail = null;
        this.isProgressive = false;
    }

    readUint16() {
        const val = (this.data[this.offset] << 8) | this.data[this.offset + 1];
        this.offset += 2;
        return val;
    }

    readBlock() {
        const len = this.readUint16();
        const arr = this.data.subarray(this.offset, this.offset + len - 2);
        this.offset += arr.length;
        return arr;
    }

    parse() {
        let markerHi, markerLo;
        while (this.offset < this.data.length) {
            markerHi = this.data[this.offset++];
            markerLo = this.data[this.offset++];

            if (markerHi === 0xFF) {
                if (markerLo === 0xE0) this.jfif = this.readBlock();
                else if ((markerLo >= 0xE1 && markerLo <= 0xEF) || markerLo === 0xFE) {
                    this.APPn.push({ marker: markerLo, data: this.readBlock() });
                }
                else if (markerLo === 0xDB) this.qts.push(this.readBlock());
                else if (markerLo === 0xC4) this.parseDHT(this.readBlock());
                else if (markerLo === 0xC0) this.parseSOF(markerLo); 
                else if (markerLo === 0xC2) { 
                    this.isProgressive = true; 
                    this.parseSOF(markerLo);
                }
                else if (markerLo === 0xDA) { this.parseSOS(); break; }
                else if (markerLo === 0xD9) break;
            }
        }
        
        if (this.offset < this.data.length) {
            this.tail = this.data.subarray(this.offset);
        }

        return {
            frame: this.frame,
            qts: this.qts,
            jfif: this.jfif,
            APPn: this.APPn,
            tail: this.tail,
            isProgressive: this.isProgressive
        };
    }

    parseDHT(data) {
        let off = 0;
        while (off < data.length) {
            const info = data[off++];
            const lenArr = new Uint8Array(17); 
            let countSum = 0;
            for(let i=1; i<=16; i++) {
                lenArr[i] = data[off++];
                countSum += lenArr[i];
            }
            const valArr = new Uint8Array(countSum);
            for(let i=0; i<countSum; i++) valArr[i] = data[off++];
            
            const isAC = (info & 0x10) !== 0;
            const id = info & 0x0F;
            const table = buildHuffmanTable(lenArr, valArr);
            
            if(isAC) this.huffmanTablesAC[id] = table;
            else this.huffmanTablesDC[id] = table;
        }
    }

    parseSOF(marker) {
        this.readUint16(); 
        this.frame = {
            precision: this.data[this.offset++],
            scanLines: this.readUint16(),
            samplesPerLine: this.readUint16(),
            components: [],
            componentIds: {}
        };
        const count = this.data[this.offset++];
        let maxH = 0, maxV = 0;
        for(let i=0; i<count; i++) {
            const id = this.data[this.offset++];
            const samp = this.data[this.offset++];
            const qId = this.data[this.offset++];
            const h = samp >> 4;
            const v = samp & 15;
            if (h > maxH) maxH = h;
            if (v > maxV) maxV = v;
            
            const comp = { id, h, v, qId };
            this.frame.components.push(comp);
            this.frame.componentIds[id] = i;
        }
        this.frame.maxH = maxH;
        this.frame.maxV = maxV;
        this.frame.mcusPerLine = Math.ceil(this.frame.samplesPerLine / 8 / maxH);
        this.frame.mcusPerColumn = Math.ceil(this.frame.scanLines / 8 / maxV);
        
        for(let comp of this.frame.components) {
            const blocksMcuLine = this.frame.mcusPerLine * comp.h;
            const blocksMcuCol = this.frame.mcusPerColumn * comp.v;
            comp.blocks = new Int16Array(blocksMcuCol * blocksMcuLine * 64);
            comp.blocksDC = new Int16Array(blocksMcuCol * blocksMcuLine);
            comp.blocksPerLineForMcu = blocksMcuLine;
            comp.pred = 0;
        }
    }

    parseSOS() {
        this.readUint16(); 
        const count = this.data[this.offset++];
        const scanComps = [];
        for(let i=0; i<count; i++) {
            const id = this.data[this.offset++];
            const tableSpec = this.data[this.offset++];
            const comp = this.frame.components[this.frame.componentIds[id]];
            comp.huffDC = this.huffmanTablesDC[tableSpec >> 4];
            comp.huffAC = this.huffmanTablesAC[tableSpec & 15];
            scanComps.push(comp);
        }
        this.offset += 3; 

        if (this.isProgressive) return;

        let bitsData = 0, bitsCount = 0;
        
        const peekBits = (n) => {
             while(bitsCount < n) {
                 if (this.offset >= this.data.length) return 0; 
                 let b = this.data[this.offset++];
                 if (b === 0xFF) {
                     if (this.data[this.offset] === 0) this.offset++;
                 }
                 bitsData = (bitsData << 8) | b;
                 bitsCount += 8;
             }
             return (bitsData >>> (bitsCount - n)) & ((1<<n)-1);
        };
        
        const consumeBits = (n) => { bitsCount -= n; };

        const mcus = this.frame.mcusPerLine * this.frame.mcusPerColumn;
        for(let m=0; m<mcus; m++) {
            for(let comp of scanComps) {
                for(let k=0; k < comp.h * comp.v; k++) {
                    const mcuRow = (m / this.frame.mcusPerLine) | 0;
                    const mcuCol = m % this.frame.mcusPerLine;
                    const blkRow = (mcuRow * comp.v) + ((k / comp.h)|0);
                    const blkCol = (mcuCol * comp.h) + (k % comp.h);
                    const blockIdx = (blkRow * comp.blocksPerLineForMcu + blkCol) * 64;
                    const dcIdx = (blkRow * comp.blocksPerLineForMcu + blkCol);

                    const peek16 = peekBits(16);
                    if (!comp.huffDC) throw new Error("Missing Huffman Table for DC");
                    
                    const val = comp.huffDC[peek16];
                    const huffLen = val >> 8;
                    const diffCat = val & 0xFF;
                    consumeBits(huffLen);
                    
                    let diff = 0;
                    if (diffCat > 0) {
                        diff = peekBits(diffCat);
                        consumeBits(diffCat);
                        if (diff < (1 << (diffCat - 1))) diff += (-1 << diffCat) + 1;
                    }
                    comp.pred += diff;
                    comp.blocksDC[dcIdx] = comp.pred;
                    comp.blocks[blockIdx] = comp.pred;

                    let i = 1;
                    while(i < 64) {
                        const peekAC = peekBits(16);
                        const valAC = comp.huffAC[peekAC];
                        const lenAC = valAC >> 8;
                        const symAC = valAC & 0xFF;
                        consumeBits(lenAC);
                        
                        const run = symAC >> 4;
                        const cat = symAC & 0xF;
                        
                        if (symAC === 0) break; 
                        
                        i += run;
                        if (cat > 0) {
                            let coeff = peekBits(cat);
                            consumeBits(cat);
                            if (coeff < (1 << (cat - 1))) coeff += (-1 << cat) + 1;
                            comp.blocks[blockIdx + i] = coeff;
                        }
                        i++;
                    }
                }
            }
        }
    }

    pack(structure) {
        let out = new Uint8Array(this.data.length * 3); 
        let pos = 0;
        let bits = 0;
        let bitCount = 0;
        
        const wByte = (b) => { out[pos++] = b; };
        const wWord = (w) => { out[pos++] = (w >> 8) & 0xFF; out[pos++] = w & 0xFF; };
        const wArr = (arr) => { out.set(arr, pos); pos += arr.length; };
        const emitBits = (val, len) => {
             for(let i=len-1; i>=0; i--) {
                 bits = (bits << 1) | ((val >> i) & 1);
                 bitCount++;
                 if (bitCount === 8) {
                     wByte(bits);
                     if (bits === 0xFF) wByte(0);
                     bits = 0;
                     bitCount = 0;
                 }
             }
        };
        const flushBits = () => {
            if (bitCount > 0) {
                bits = bits << (8 - bitCount) | ((1 << (8 - bitCount)) - 1);
                wByte(bits);
                if (bits === 0xFF) wByte(0);
                bits = 0;
                bitCount = 0;
            }
        };

        wWord(0xFFD8);
        if (structure.jfif) {
            wWord(0xFFE0);
            wWord(structure.jfif.length + 2);
            wArr(structure.jfif);
        }
        for(let app of structure.APPn) {
             wWord(0xFF00 | app.marker);
             wWord(app.data.length + 2);
             wArr(app.data);
        }
        for(let dqt of structure.qts) {
            wWord(0xFFDB);
            wWord(dqt.length + 2);
            wArr(dqt);
        }
        
        wWord(0xFFC0);
        wWord(8 + structure.frame.components.length * 3);
        wByte(structure.frame.precision);
        wWord(structure.frame.scanLines);
        wWord(structure.frame.samplesPerLine);
        wByte(structure.frame.components.length);
        for(let c of structure.frame.components) {
            wByte(c.id);
            wByte((c.h << 4) | c.v);
            wByte(c.qId);
        }
        
        const writeDHTSegment = (id, nrcodes, values) => {
             wWord(0xFFC4);
             wWord(2 + 1 + 16 + values.length);
             wByte(id);
             wArr(new Uint8Array(nrcodes.slice(1)));
             wArr(new Uint8Array(values));
        };
        writeDHTSegment(0x00, STD_DC_LUM_NR, STD_DC_LUM_VAL); 
        writeDHTSegment(0x10, STD_AC_LUM_NR, STD_AC_LUM_VAL); 
        if (structure.frame.components.length > 1) {
            writeDHTSegment(0x01, STD_DC_CHR_NR, STD_DC_CHR_VAL);
            writeDHTSegment(0x11, STD_AC_CHR_NR, STD_AC_CHR_VAL);
        }

        wWord(0xFFDA);
        wWord(6 + structure.frame.components.length * 2);
        wByte(structure.frame.components.length);
        for(let i=0; i<structure.frame.components.length; i++) {
            wByte(structure.frame.components[i].id);
            wByte(i===0 ? 0x00 : 0x11);
        }
        wByte(0); wByte(63); wByte(0);

        for(let c of structure.frame.components) c.pred = 0;

        const mcus = structure.frame.mcusPerLine * structure.frame.mcusPerColumn;
        for(let m=0; m<mcus; m++) {
            for(let i=0; i<structure.frame.components.length; i++) {
                const comp = structure.frame.components[i];
                const dcHT = i===0 ? YDC_HT_ENC : CDC_HT_ENC; 
                const acHT = i===0 ? YAC_HT_ENC : CAC_HT_ENC; 

                for(let k=0; k < comp.h * comp.v; k++) {
                     const mcuRow = (m / structure.frame.mcusPerLine) | 0;
                    const mcuCol = m % structure.frame.mcusPerLine;
                    const blkRow = (mcuRow * comp.v) + ((k / comp.h)|0);
                    const blkCol = (mcuCol * comp.h) + (k % comp.h);
                    const blockIdx = (blkRow * comp.blocksPerLineForMcu + blkCol) * 64;

                    const dcVal = comp.blocks[blockIdx];
                    const diff = dcVal - comp.pred;
                    comp.pred = dcVal;
                    
                    const absDiff = Math.abs(diff);
                    let cat = 0;
                    if (absDiff > 0) cat = Math.floor(Math.log2(absDiff)) + 1;
                    
                    const code = dcHT[cat];
                    emitBits(code.val, code.len);
                    if (cat > 0) {
                        let b = diff;
                        if (diff < 0) b = diff - 1;
                        emitBits(b, cat);
                    }
                    
                    let r = 0;
                    for(let z=1; z<64; z++) {
                        const val = comp.blocks[blockIdx+z];
                        if (val === 0) {
                            r++;
                        } else {
                            while (r > 15) {
                                emitBits(acHT[0xF0].val, acHT[0xF0].len);
                                r -= 16;
                            }
                            const absVal = Math.abs(val);
                            let cat = Math.floor(Math.log2(absVal)) + 1;
                            const symbol = (r << 4) | cat;
                            
                            emitBits(acHT[symbol].val, acHT[symbol].len);
                            
                            let b = val;
                            if (val < 0) b = val - 1;
                            emitBits(b, cat);
                            r = 0;
                        }
                    }
                    if (r > 0) emitBits(acHT[0].val, acHT[0].len);
                }
            }
        }
        flushBits();
        
        wWord(0xFFD9);
        return out.slice(0, pos);
    }
}