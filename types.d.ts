export interface SpritesContainer {
    signature: number;
    count: number;
    sprites: Array<SpriteRGBA>;
}

export interface SpriteRGBA {
    id: number;
    rgba: Uint8Array;
}

export interface SpriteCPixels {
    id: number;
    cPixels: Uint8Array;
}

export interface CompressedPixelsStatus {
    generating: number;
    total: number;
    progressPercent: number;
}

export interface WriteStatus {
    writing: number;
    total: number;
    progressPercent: number;
}

export interface ReadStatus {
    reading: number;
    total: number;
    progressPercent: number;
}

export interface ReadStatusCallback {
    (any:ReadStatus):void
}

export interface WriteStatusCallback {
    (any:WriteStatus):void
}

export interface CompressedPixelsCallback {
    (any:CompressedPixelsStatus):void;
}