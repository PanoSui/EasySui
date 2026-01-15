import {
    toBase64,
    toHex,
    fromHex,
    fromBase64
} from "@mysten/sui/utils";

export enum FORMAT_TYPES {
    hex = 1,
    base64,
}

export function toFormatType(type: FORMAT_TYPES, bytes: Uint8Array<ArrayBuffer>) {
    switch (type) {
        case FORMAT_TYPES.base64:
            return toBase64(bytes)
        case FORMAT_TYPES.hex:
            return toHex(bytes)
        default:
            throw "The FORMAT_TYPES must be one of hex or base64"
    }
}

export function isHex(str: string): boolean {
    // Must be even length and only hex chars
    return /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
}

export function hexToBase64(hex: string) {
    return toBase64(fromHex(hex))
}

export function base64toHex(base64: string) {
    return toHex(fromBase64(base64))
}