import { MoveType, SuiClient } from '../utils/sui_client'
import { Keypair } from '@mysten/sui/cryptography'
import { coinWithBalance, Transaction } from '@mysten/sui/transactions'
import {COIN_REGISTRY} from "../config/config";

export class Coin {
    public static get coinType(): string {
        throw new Error('`coinType` getter must be implemented !')
    }

    public static async getBalance(owner: string) {
        const result = await SuiClient.client.getBalance({
            owner,
            coinType: this.coinType,
        })
        return BigInt(result.totalBalance)
    }

    public static async getCoin(owner: Keypair, amount?: bigint): Promise<string> {
        const balance = amount || (await this.getBalance(owner.toSuiAddress()))
        const tx = new Transaction()
        const coinSplit = coinWithBalance({
            balance,
            useGasCoin: false,
            type: this.coinType,
        })
        tx.transferObjects([coinSplit], owner.toSuiAddress())
        const result = await SuiClient.signAndExecute(tx, owner)

        const coin = result.objectChanges?.find(
            (o) => o.type === 'created' && o.objectType === `0x2::coin::Coin<${this.coinType}>`
        )

        return (coin as any)?.objectId
    }

    public static async _mint(treasuryId: string, amount: bigint, minter: Keypair) {
        await SuiClient.moveCall({
            signer: minter,
            target: `0x2::coin::mint`,
            typeArgs: [this.coinType],
            args: [treasuryId, amount],
            argTypes: [MoveType.object, MoveType.u64],
            withTransfer: true,
        })
    }

    public static async finalizeRegistration(registrar: Keypair) {
        const currencies = await SuiClient.getObjectsByType(COIN_REGISTRY, `0x2::coin_registry::Currency<${this.coinType}>`)

        if (currencies.length === 0 || !currencies[0]) {
            throw new Error('The registrar does not own the currency, please pass the currency id.')
        }
        const currencyId = currencies[0]

        await SuiClient.moveCall({
            signer: registrar,
            target: `0x2::coin_registry::finalize_registration`,
            typeArgs: [this.coinType],
            args: [COIN_REGISTRY, currencyId],
            argTypes: [MoveType.object, MoveType.object],
        })
    }

    public static async send(amount: bigint, from: Keypair, to: string) {
        const coin = await this.getCoin(from, amount)
        const ptb = new Transaction()
        ptb.transferObjects([ptb.object(coin)], to)
        await SuiClient.signAndExecute(ptb, from)
    }

    public static async assertBalance(wallet: Keypair, amount: bigint | BigInt) {
        await expect(this.getBalance(wallet.toSuiAddress())).resolves.toBe(amount)
    }
}
