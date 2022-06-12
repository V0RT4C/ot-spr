import { palette } from "./palette.ts";
import { Byt3s } from './bytes.ts';
import type { SpritesContainer, ReadStatusCallback } from './types.d.ts';

export const pre70Reader = function(data : Uint8Array, cb?: ReadStatusCallback) : SpritesContainer {
    if (data === undefined){
        throw new Error('data has to be set');
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
    const size = 32;

    const count = byt3s.readUint16LE();

    const sprites : { id: number, rgba: Uint8Array }[] = [];

    for (let id=1; id <= count; id++){
        if (cb){
            cb({ reading: id, total: count, progressPercent: Math.round(id / count * 100) });
        }
        byt3s.position+=2;
        const byteArray = new Uint8Array(4096).fill(0, 0, 4096);

        const sprSize = byt3s.readUint16LE();

        const sprBufferEndPos = sprSize + byt3s.position - 2;

        let currPixel = 0;

        while(byt3s.position < sprBufferEndPos){
            const tPixels = byt3s.readUint16LE();

            currPixel += tPixels;
            const cPixels = byt3s.readByte();

            for (let c=0; c < cPixels; c++){
                const colorIndex = byt3s.readByte();

                const x : number = currPixel % size;
                const y : number = Math.floor(currPixel / size);
                const r : number = palette[colorIndex][0];
                const g : number = palette[colorIndex][1];
                const b : number = palette[colorIndex][2];
                const a = 255;
                const index : number = (x + size*y)*4; 
                byteArray[index] = r;
                byteArray[index+1] = g;
                byteArray[index+2] = b;
                byteArray[index+3] = a;
                currPixel++;
            }
        }

        //Flip sprite vertically
        const flippedBytes = new Uint8Array(byteArray.byteLength);
        const width = size;
        const height = size;
        let k=0;

        for (let i=height - 1; i >= 0 && k < height; i--){
            for (let i2=0; i2 < width * 4; i2++){
                flippedBytes[k*width*4+i2] = byteArray[i*width*4+i2];
            }
            k++;
        }

        const newSprite = flippedBytes
        sprites.push({ id, rgba: newSprite });

        if (byt3s.position > data.length){
            const err : any = new Error('Not a valid pre 7.0 .SPR file');
            err.code = 'NOT_OLD_SPR';
            throw err;
        }
    }
    

    return { signature: 0, count: sprites.length, sprites };
}