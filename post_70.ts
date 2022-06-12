import { Byt3s } from './bytes.ts';
import type { 
    SpritesContainer, 
    ReadStatusCallback,
    WriteStatusCallback,
    CompressedPixelsCallback,
    SpriteCPixels,
    SpriteRGBA
} from './types.d.ts';

export const post70Reader = function(data : Uint8Array, extended = false, cb?: ReadStatusCallback) : SpritesContainer {
    if (data === undefined){
        throw new Error('missing parameter data');
    }
    else if (typeof data !== 'object' || (data as object).constructor.name !== 'Uint8Array'){
        throw new Error('data has to be an Uint8Array');
    }
    
    if (cb !== undefined){
        if (typeof cb !== 'function'){
            throw new Error('The callback has to be a function');
        }
    }

    const byt3s = new Byt3s(data);
    let headerSize: number;

    const sprites : { id: number, rgba: Uint8Array }[] = [];

    const signature = byt3s.readUint32LE();

    let count : number;

    if (extended){
      headerSize = 8;
      count = byt3s.readUint32LE();
    }else{
      headerSize = 6;
      count = byt3s.readUint16LE();
    }
    
    for (let spriteId=1; spriteId <= count; spriteId++){
      if (cb){
        cb({ reading: spriteId, total: count, progressPercent: Math.round(spriteId / count * 100) });
      }
      const formula = headerSize + (spriteId - 1) * 4;
      byt3s.position=formula;

      const sprite : Uint8Array = new Uint8Array(4096).fill(0,0,4096);
      
      const spriteAddress : number = byt3s.readUint32LE();

      if (spriteAddress == 0) {
        sprites.push({ id: spriteId, rgba: sprite });
        continue;
      }

      byt3s.position = spriteAddress;
      //skip
      byt3s.position+=3;

      const sprSize : number = byt3s.readUint16LE();
      const endPos = byt3s.position + sprSize;

      let currPixel = 0;
      const size = 32;

      while(byt3s.position < endPos){
        const transparentPixels : number = byt3s.readUint16LE();
        const coloredPixels : number = byt3s.readUint16LE();

        currPixel += transparentPixels;

        for (let i=0; i < coloredPixels; i++){
            const x : number = currPixel % size;
            const y : number = Math.floor(currPixel / size);
            const r : number = byt3s.readByte();
            const g : number = byt3s.readByte();
            const b : number = byt3s.readByte();
            const a = 255;

            const index : number = (x + size*y)*4;
            sprite[index] = r;
            sprite[index+1] = g;
            sprite[index+2] = b;
            sprite[index+3] = a;
            currPixel++;
        }
      }

      const newSprite = sprite;
      sprites.push({ id: spriteId, rgba: newSprite });

      if (byt3s.position > data.length){
            const err : any = new Error('Not a valid >= 7.0 .SPR file');
            err.code = 'NOT_SPR';
            throw err;
        }
    }

    return { signature, count: sprites.length, sprites };
}

export const post70Writer = function(signature : number, version: number, data: Array<SpriteCPixels>, cb?: WriteStatusCallback) : Uint8Array {
    if (signature === undefined || isNaN(signature)){
        throw new Error('missing parameter signature');
    }
    else if(signature > 4294967295){
        throw new Error('signature is an unsigned 32 bit number. Max allowed value is 4294967295');
    }

    if (version === undefined || isNaN(version)){
        throw new Error('missing parameter version');
    }
    else if (version > 1056 || version < 700){
        throw new Error('version has to be a number between 700 and 1056');
    }

    if (cb !== undefined){
        if (typeof cb !== 'function'){
            throw new Error('The callback has to be a function');
        }
    }

    let extended = false;

    if (version >= 960){
        extended = true;
    }
    
    let count : number;
    let headerSize : number;

    if (extended){
        count = data.length;
        headerSize = 8;
    }else{
        count = data.length >= 0xFFFF ? 0xFFFE : data.length;
        headerSize = 6;
    }

    let offset : number = (count * 4) + headerSize;

    const dataObj : {[any:number] : Uint8Array} = {};

    for (let i=0; i < data.length; i++){
        dataObj[data[i].id] = data[i].cPixels;
    }


    const byt3s = new Byt3s(180000000);

    byt3s.writeUint32LE(signature);

    if (extended){
        byt3s.writeUint32LE(count);
    }else{
        byt3s.writeUint16LE(count);
    }

    let addressPosition : number = byt3s.position;

    for (let id=1; id <= count; id++){
        byt3s.position = addressPosition;

        const sprite : Uint8Array = dataObj[id];

        if (sprite.byteLength === 0){
            byt3s.writeUint32LE(0);
        }else{
            const compressedPixels = new Uint8Array(sprite);

            byt3s.writeUint32LE(offset);

            byt3s.position = offset;

            byt3s.writeByte(0xFF);
            byt3s.writeByte(0x00);
            byt3s.writeByte(0xFF);
            
            byt3s.writeUint16LE(compressedPixels.byteLength);

            if (compressedPixels.byteLength > 0){
                byt3s.writeBytes(compressedPixels);
            }

            offset = byt3s.position;
        }

        addressPosition += 4;

        if(cb){
            cb({ writing: id, total: count, progressPercent: Math.round(id / count * 100)});
        }
    }

    return new Uint8Array(byt3s.slice(0, byt3s.highestPosition));
}

export const generateCompressedPixels = function(data : Array<SpriteRGBA>, cb?: CompressedPixelsCallback) : Array<SpriteCPixels> {
    if (data === undefined){
        throw new Error('missing parameter data');
    }
    else if (!Array.isArray(data)){
        throw new Error('data has to be an array');
    }
    
    if (cb !== undefined){
        if (typeof cb !== 'function'){
            throw new Error('The callback has to be a function');
        }
    }


    const sprites : Array<SpriteCPixels> = [];

    for (let i=0; i < data.length; i++){

        if (cb){
            cb({ generating: i+1, total: data.length, progressPercent: Math.round(((i + 1) / data.length) * 100)})
        }

        const compressedPixels = new Byt3s(4096);
        let position = 0;
    
        let index = 0;
        let r : number;
        let g : number;
        let b : number;
        let a : number;
        let transparentPixel = true;
        let alphaCount = 0;
        let chunksize : number;
        let coloredPosition : number;
        let finishOffset : number;
        const rgba = data[i].rgba;
        const length = rgba.byteLength / 4;
    
        while(index < length){
    
            chunksize = 0;
    
            while(index < length){
                position = index * 4;
                
                r = rgba[position];
                g = rgba[position+1];
                b = rgba[position+2];
                a = rgba[position+3];
                position+=4;
    
                transparentPixel = (a === 0);
    
                if (!transparentPixel) break;
    
                alphaCount++;
                chunksize++;
                index++;
            }
    
            if (alphaCount < length){
    
                if (index < length){
                    compressedPixels.writeUint16LE(chunksize);
    
                    coloredPosition = compressedPixels.position; //Save colored position
                    
                    compressedPixels.position+=2; //Skip coloredsize uint16
    
                    chunksize = 0;
    
                    while (index < length){
                        position = index * 4;
                        
                        r = rgba[position];
                        g = rgba[position+1];
                        b = rgba[position+2];
                        a = rgba[position+3];
                        position+=4;
    
                        transparentPixel = (a === 0);
                        if (transparentPixel) break;
    
                        compressedPixels.writeByte(r);
                        compressedPixels.writeByte(g);
                        compressedPixels.writeByte(b);
    
                        chunksize++;
                        index++;
                    }
    
                    finishOffset = compressedPixels.position;
                    compressedPixels.position = coloredPosition; //Go back to colored chunksize indicator
    
                    //Write amount of colored pixels
                    compressedPixels.writeUint16LE(chunksize);
                    compressedPixels.position = finishOffset;
                }
            }
        }
        
        sprites.push({ id: data[i].id, cPixels: new Uint8Array(compressedPixels.slice(0, compressedPixels.highestPosition)) });
    }

    return sprites;
}
