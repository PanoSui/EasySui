import { SuiClient as SC } from '@mysten/sui/client'
import { Config } from '../config/config'
import { Transaction } from '@mysten/sui/transactions'
import { Keypair } from '@mysten/sui/cryptography'
import { bcs } from '@mysten/sui/bcs'
import { analyze_cost } from './cost_analyzer'

export enum MoveType {
    u8 = 1,
    u16,
    u32,
    u64,
    u128,
    u256,
    bool,
    string,
    object,
    address,
    address_opt,
    vec_address,
}

export class SuiClient {
    private static instance: SuiClient | null = null
    private client: SC

    private constructor() {
        this.client = new SC({ url: Config.vars.RPC })
    }

    private static getInstance(): SuiClient {
        if (!SuiClient.instance) {
            this.instance = new SuiClient()
        }
        return this.instance!
    }

    public static get client(): SC {
        return this.getInstance().client
    }

    public static async signAndExecute(
        ptb: Transaction,
        signer: Keypair,
        errorHandler: (e: any) => string = (e) => e
    ) {
        try {
            const resp = await SuiClient.client.signAndExecuteTransaction({
                transaction: ptb,
                signer,
                options: {
                    showEffects: true,
                    showObjectChanges: true,
                    showBalanceChanges: true,
                },
            })
            await SuiClient.client.waitForTransaction({ digest: resp.digest })
            if (resp.effects?.status.status !== 'success') {
                throw new Error(JSON.stringify(resp))
            }
            analyze_cost(ptb, resp)
            return resp
        } catch (e) {
            throw new Error(errorHandler(e))
        }
    }

    public static toMoveArg(ptb: Transaction, value: any, type?: MoveType) {
        if (typeof value === 'object' && !Array.isArray(value)) {
            return value
        }

        if (!type) {
            if (typeof value === 'string') {
                if (value.startsWith('0x')) {
                    type = MoveType.object
                } else {
                    type = MoveType.string
                }
            } else if (typeof value === 'boolean') {
                type = MoveType.bool
            } else if (typeof value === 'number' || typeof value === 'bigint') {
                type = MoveType.u64
            }
        }

        const factory = {
            [MoveType.u8]: (v: any) => ptb.pure.u8(v),
            [MoveType.u16]: (v: any) => ptb.pure.u16(v),
            [MoveType.u32]: (v: any) => ptb.pure.u32(v),
            [MoveType.u64]: (v: any) => ptb.pure.u64(v),
            [MoveType.u128]: (v: any) => ptb.pure.u128(v),
            [MoveType.u256]: (v: any) => ptb.pure.u256(v),
            [MoveType.bool]: (v: any) => ptb.pure.bool(v),
            [MoveType.string]: (v: any) => ptb.pure.string(v),
            [MoveType.object]: (v: any) => ptb.object(v),
            [MoveType.address]: (v: any) => ptb.pure.address(v),
            [MoveType.address_opt]: (v: any) => ptb.pure.option('address', v),
            [MoveType.vec_address]: (v: any) => ptb.pure.vector('address', v),
        }

        return factory[type!](value)
    }

    public static async moveCall({
        signer,
        target,
        typeArgs = [],
        args = [],
        argTypes = [],
        errorHandler = (e) => e,
        ptb,
        withTransfer = false,
    }: {
        signer: Keypair
        target: string
        typeArgs?: string[]
        args?: any[]
        argTypes?: MoveType[]
        errorHandler?: (e: any) => string
        ptb?: Transaction
        withTransfer?: boolean
    }) {
        ptb = ptb || new Transaction()
        const obj = ptb.moveCall({
            target,
            typeArguments: typeArgs,
            arguments: args.map((arg, i) => SuiClient.toMoveArg(ptb, arg, argTypes[i])),
        })

        if (withTransfer) {
            ptb.transferObjects([obj], signer.toSuiAddress())
        }

        return SuiClient.signAndExecute(ptb, signer, errorHandler)
    }

    public static async public_transfer(objects: string[], from: Keypair, to: string) {
        const tx = new Transaction()
        tx.transferObjects(objects, to)
        return await SuiClient.signAndExecute(tx, from)
    }

    public static async devInspect(ptb: Transaction, sender: string) {
        return await SuiClient.client.devInspectTransactionBlock({
            transactionBlock: ptb,
            sender,
        })
    }

    public static async devInspectRaw(ptb: Transaction, sender: string) {
        const result = await this.devInspect(ptb, sender)
        return result.results?.[0].returnValues?.[0]?.[0]
    }

    public static async devInspectBool(ptb: Transaction, sender: string) {
        const result = await this.devInspectRaw(ptb, sender)
        return result && result[0] === 1
    }

    public static async devInspectU64(ptb: Transaction, sender: string) {
        const value = await this.devInspectRaw(ptb, sender)
        return BigInt(bcs.u64().parse(new Uint8Array(value!)))
    }

    public static async devInspectAddress(ptb: Transaction, sender: string) {
        const value = await this.devInspectRaw(ptb, sender)
        if (!value) {
            return undefined
        }
        const bytes = Uint8Array.from(value)
        return '0x' + Buffer.from(bytes).toString('hex')
    }

    public static async getObject(id: string) {
        return SuiClient.client.getObject({
            id,
            options: { showContent: true },
        })
    }

    public static async getObjectsByType(owner: string, type: string) {
        const res = await SuiClient.client.getOwnedObjects({
            owner,
            filter: {
                StructType: type,
            },
        })
        return res.data.map((o) => o.data?.objectId).filter((o) => o)
    }
}
