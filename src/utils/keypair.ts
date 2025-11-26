import { decodeSuiPrivateKey, Keypair } from '@mysten/sui/cryptography'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1'
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1'

export function getKeypair(privkey: string): Keypair {
    const parsed = decodeSuiPrivateKey(privkey)

    switch (parsed.scheme) {
        case 'ED25519': {
            return Ed25519Keypair.fromSecretKey(parsed.secretKey)
        }
        case 'Secp256k1': {
            return Secp256k1Keypair.fromSecretKey(parsed.secretKey)
        }
        case 'Secp256r1': {
            return Secp256r1Keypair.fromSecretKey(parsed.secretKey)
        }
        default:
            throw new Error(`Key scheme ${parsed.schema} not supported`)
    }
}
