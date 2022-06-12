import { 
    post70Reader as post70r, 
    post70Writer as post70w, 
    generateCompressedPixels as gc 
} from './post_70.ts';
import { 
    pre70Reader as pre70r
} from './pre_70.ts';

import type { ReadStatusCallback } from './types.d.ts';

export const read = function(buffer : Uint8Array, cb?: ReadStatusCallback){
    try {
        const data = pre70r(buffer, cb);
        return data;
    }catch(err){
        if (err && err.code === 'NOT_OLD_SPR'){
            try {
                const data = post70r(buffer, false, cb);
                return data;
            }catch(err){
                if (err && err.code === 'NOT_SPR'){
                    throw new Error('Not a SPR file.');
                }else{
                    throw err;
                }
            }
        }else{
            throw err;
        }
    }
}

export const compress = gc;
export const write = post70w;