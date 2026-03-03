import { SuiJsonRpcClient as SC } from '@mysten/sui/jsonRpc'
import { toBase64, fromBase64, fromHex } from '@mysten/sui/utils'
import { Config } from '../config/config'
import { Transaction } from '@mysten/sui/transactions'
import { Keypair } from '@mysten/sui/cryptography'
import { bcs } from '@mysten/sui/bcs'
import { analyze_cost } from './cost_analyzer'
import type {SuiTransactionBlockResponse} from "@mysten/sui/jsonRpc";
import {FORMAT_TYPES, hexToBase64, isHex, toFormatType} from "./byte_utils";

export enum MoveType {
    u8 = 1,
    u16,
    u32,
    u64,
    u128,
    u256,
    bool,
    string,
    string_opt,
    object,
    address,
    address_opt,
    vec_address,
    vec_u64,
}

const txOptions = {
    showEffects: true,
    showObjectChanges: true,
    showBalanceChanges: true,
}

export class SuiClient {
    private static instance: SuiClient | null = null
    private client: SC

    private constructor() {
        this.client = new SC({ url: Config.vars.RPC, network: Config.vars.NETWORK })
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

    private static async waitForTransaction(
        ptb: Transaction,
        resp: SuiTransactionBlockResponse,
    ) {
        await SuiClient.client.waitForTransaction({ digest: resp.digest })
        if (resp.effects?.status.status !== 'success') {
            throw new Error(JSON.stringify(resp))
        }
        analyze_cost(ptb, resp)
        return resp
    }

    public static async signAndExecute(
        ptb: Transaction,
        signer: Keypair,
    ) {
        const resp = await SuiClient.client.signAndExecuteTransaction({
            transaction: ptb,
            signer,
            options: txOptions,
        })
        return SuiClient.waitForTransaction(ptb, resp)
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
            [MoveType.string_opt]: (v: any) => ptb.pure.option('string', v),
            [MoveType.object]: (v: any) => ptb.object(v),
            [MoveType.address]: (v: any) => ptb.pure.address(v),
            [MoveType.address_opt]: (v: any) => ptb.pure.option('address', v),
            [MoveType.vec_address]: (v: any) => ptb.pure.vector('address', v),
            [MoveType.vec_u64]: (v: any) => ptb.pure.vector('u64', v),
        }

        return factory[type!](value)
    }

    public static async moveCall({
        signer,
        target,
        typeArgs = [],
        args = [],
        argTypes = [],
        ptb,
        withTransfer = false,
    }: {
        signer: Keypair
        target: string
        typeArgs?: string[]
        args?: any[]
        argTypes?: MoveType[]
        ptb?: Transaction
        withTransfer?: boolean
    }) {
        ptb = this.getPTB(target, typeArgs, args, argTypes, signer.toSuiAddress(), withTransfer, ptb);

        return SuiClient.signAndExecute(ptb, signer)
    }

    public static async getMoveCallBytes({
        signer,
        target,
        typeArgs = [],
        args = [],
        argTypes = [],
        ptb,
        withTransfer = false,
        gasOwner,
        format = FORMAT_TYPES.hex
    }: {
        signer: string
        target: string
        typeArgs?: string[]
        args?: any[]
        argTypes?: MoveType[]
        ptb?: Transaction
        withTransfer?: boolean
        gasOwner?: string
        format?: FORMAT_TYPES
    }) {
        ptb = this.getPTB(target, typeArgs, args, argTypes, signer, withTransfer, ptb);
        return await this.getMoveCallBytesFromPTB(ptb, signer, gasOwner, format);
    }

    public static async getMoveCallBytesFromPTB(ptb: Transaction, signer: string, gasOwner?: string, format: FORMAT_TYPES = FORMAT_TYPES.hex) {
        ptb.setSender(signer)
        gasOwner ??= signer
        ptb.setGasOwner(gasOwner || signer)
        const bytes = await ptb.build({client: SuiClient.client, onlyTransactionKind: false});
        return toFormatType(format, bytes)
    }

    public static toBytes(bytes: Uint8Array | string) {
        if (typeof bytes === 'string') {
            return isHex(bytes) ? fromHex(bytes) : fromBase64(bytes)
        }
        return bytes
    }

    public static async getSignature(signatureOrKeypair: string | Keypair, bytes: Uint8Array) {
        if (typeof signatureOrKeypair !== 'string') {
            const signature = await signatureOrKeypair.signTransaction(bytes)
            return signature.signature
        }

        return isHex(signatureOrKeypair) ? hexToBase64(signatureOrKeypair) : signatureOrKeypair
    }

    public static async executeMoveCallBytes(
        bytes: Uint8Array | string,
        senderSignature: string | Keypair,
        gasOwnerSignature?: string | Keypair,
    ) {
        const transactionBlock = this.toBytes(bytes)
        senderSignature = await this.getSignature(senderSignature, transactionBlock)

        const signature = [senderSignature]
        if (gasOwnerSignature) {
            gasOwnerSignature = await this.getSignature(gasOwnerSignature, transactionBlock)
            signature.push(gasOwnerSignature)
        }
        const resp = await SuiClient.client.executeTransactionBlock({
            transactionBlock: toBase64(transactionBlock),
            signature,
            options: txOptions
        })
        const ptb = Transaction.from(toBase64(transactionBlock))
        return SuiClient.waitForTransaction(ptb, resp)
    }

    public static getPTB(
        target: string,
        typeArgs: string[] = [],
        args: any[] = [],
        argTypes: MoveType[] = [],
        signer?: string,
        withTransfer: boolean = false,
        ptb?: Transaction
    ) {
        ptb = ptb || new Transaction()
        const obj = ptb.moveCall({
            target,
            typeArguments: typeArgs,
            arguments: args.map((arg, i) => SuiClient.toMoveArg(ptb, arg, argTypes[i])),
        })

        if (withTransfer && signer) {
            ptb.transferObjects([obj], signer)
        }
        return ptb;
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

    public static async devInspectString(ptb: Transaction, sender: string) {
        const value = await this.devInspectRaw(ptb, sender)
        if (!value) {
            return ''
        }
        return bcs.string().parse(new Uint8Array(value!))
    }

    public static async getObject(id: string) {
        return SuiClient.client.getObject({
            id,
            options: {
                showContent: true,
                showType: true,
                showDisplay: true,
                showBcs: true,
            },
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
