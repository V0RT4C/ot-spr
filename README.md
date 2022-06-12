# @v0rt4c/spr

This library can (parse/read) and write binary .SPR files from Tibia.
Supported .SPR versions are those that came included in Tibia clients 3.0 -> 10.56.
The library is primarily intended to be used as a tool when building applications that work with these .SPR binary files.
No external dependencies are needed and the library should work on NodeJS, in the browser and Deno.

https://spreditor.online is an example of an application that uses this library to read, edit & compile .SPR files.

With this library alone you cannot convert the sprites into actual image files like .PNG or .BMP. However, with the parsed data that this library gives you (like the RGBA arrays) you can easily create this functionality yourself.

How to use:

## [Functions]  

### read

#### @Params
***buffer*** - (Uint8Array)  
***cb*** - (Callback function)

***Returns:***
```
{ 
    signature: number,
    count: number,
    sprites: Array<{
        id: number,
        rgba: Uint8Array
    }>
} 
``` 

The read function takes 2 parameters:

**buffer**  

The buffer param is the actual sprite file buffer. It has to be an Uint8Array. Uint8Array was chosen for compatability between NodeJS, Browsers & Deno. You can load the buffer into your app however you'd like.

**cb**  

The cb param is a callback function. It is used to receive updates about the read process.
The callback function will be executed each time a sprite has been parsed. It receives one argument with information about the status of the read process. The info object looks like this:

```
{
    reading: number; // Current sprite id being read
    total: number;   // Total nr of sprites
    progressPercent: number;
}
```

#### NodeJS example
```
const { read } = require('@ot/spr');
const fs = require('fs');

const sprBuffer = fs.readFileSync('./Tibia.spr');
const parsedSPR = read(new Uint8Array(spr.buffer));
console.log(parsedSPR);
```
Parsed result:
```
{
  signature: 1102703238,
  count: 9999,
  sprites: [
    { id: 1, rgba: [Uint8Array] },
    { id: 2, rgba: [Uint8Array] },
    { id: 3, rgba: [Uint8Array] },
    { id: 4, rgba: [Uint8Array] },
    { id: 5, rgba: [Uint8Array] },
    { id: 6, rgba: [Uint8Array] }
    ...
    ...
    ...
  ]
}
```

### compress  
This function is used to compress the rgba arrays of each sprite back into their original compressed format.  
You should use this function before writing the sprites back to a .SPR file.
#### @Params
***data*** - Array<{ id: number; rgba: Uint8Array}>  
***cb*** - (Callback function)

***Returns:***
```
[
    { id: number, cPixels: Uint8Array },
    ...
    ...
    ...
]
```

#### NodeJS example
```
const { read, compress } = require('@ot/spr');
const fs = require('fs');

const sprBuffer = fs.readFileSync('./Tibia.spr');
const parsedSPR = read(new Uint8Array(spr.buffer));
const compressedSPRS = compress(parsedSPR.sprites);
console.log(compressedSPRS);
```
Parsed result:
```
[
    { id: 1, cPixels: Uint8Array },
    { id: 2, cPixels: Uint8Array },
    { id: 3, cPixels: Uint8Array },
    { id: 4, cPixels: Uint8Array },
    { id: 5, cPixels: Uint8Array },
    { id: 6, cPixels: Uint8Array },
    ...
    ...
    ...
]
```

### write

#### @Params
***signature*** - (number)  
***version*** - (number)  
***data*** - Array<{ id: number, cPixels: Uint8Array }>  
***cb*** - (Callback function)

***Returns:***  
The new .SPR buffer in a Uint8Array. It's up to you how you save it to disk.

#### NodeJS example
```
const { read, compress, write } = require('@ot/spr');
const fs = require('fs');

const sprBuffer = fs.readFileSync('./Tibia.spr');
const parsedSPR = read(new Uint8Array(spr.buffer));
const compressedSPRS = compress(parsedSPR.sprites);
const newSPRbuffer = write(compressedSPRS);
fs.writeFileSync('Tibia.spr', newSPRbuffer);
```