export class Byt3s extends Uint8Array {
    public position = 0;
    public highestPosition = 0;

    public readByte = (offset? : number) : number => {
        this.position = (offset || offset === 0) ? offset : this.position;
        const val = this[this.position++] & 0xFF;
        checkHighestPosition(this);
        return val;
    }

    public readUint16LE = (offset?: number) : number => {
        this.position = (offset || offset === 0) ? offset : this.position;
        const val = this[this.position++] | (this[this.position++] << 8);
        checkHighestPosition(this);
        return val;
    }

    public readUint32LE = (offset?: number) : number => {
        this.position = (offset || offset === 0) ? offset : this.position;
        const val = ((this[this.position++]) |
        (this[this.position++] << 8) |
        (this[this.position++] << 16)) +
        (this[this.position++] * 0x1000000)
        checkHighestPosition(this);
        return val;
    }

    public writeByte = (value: number, offset?: number) : void => {
        checkInt(value, 0, 255);

        this.position = (offset || offset === 0) ? offset : this.position;

        this[this.position++] = value & 0xFF;
        checkHighestPosition(this);
    }

    public writeUint16LE(value : number, offset?: number) : void {
        checkInt(value, 0, 65535);

        this.position = (offset || offset === 0) ? offset : this.position;
        this[this.position++] = (value & 0xff)
        this[this.position++] = (value >>> 8)
        checkHighestPosition(this);
    }

    public writeUint32LE(value : number, offset?: number) : void {
        checkInt(value, 0, 4294967295);

        this.position = (offset || offset === 0) ? offset : this.position;
        this[this.position + 3] = (value >>> 24)
        this[this.position + 2] = (value >>> 16)
        this[this.position + 1] = (value >>> 8)
        this[this.position] = (value & 0xff)
        this.position+=4;
        checkHighestPosition(this);
    }

    public writeBytes(bytes : Uint8Array, offset? : number) : void {
        this.position = (offset || offset === 0) ? offset : this.position;
        //Write bytes
        for (let i=0; i < bytes.byteLength; i++){
            this[this.position+i] = bytes[i];
        }

        this.position = bytes.byteLength + this.position;
        checkHighestPosition(this);
    }
}

function checkHighestPosition(obj : Byt3s) : void {
    if (obj.position > obj.highestPosition){
        obj.highestPosition = obj.position;
    }
}

function checkInt(value : number, min : number, max : number) : void {
    if (!Number.isInteger(value)){
        throw NotAnIntError(value)
    }

    if (value > max || value < min){
        throw IntSizeError(value, min, max);
    }
}

function NotAnIntError(value : any) : Error {
    const err : any = new Error('Not an integer.' + 'Got: ' + value);
    err.code = 'NOT_INT';
    return err;
}

function IntSizeError(value : number, min : number, max : number) : Error {
    const err : any = new Error('Integer is out of bounds. Received ' + value + ' but integer has to be between ' + min + ' and ' + max);
    err.code = 'INT_BOUNDS';
    return err;
}