import fs from 'fs'
import {
    SuiClient,
    SuiObjectChangeCreated,
    SuiObjectChangePublished,
    SuiTransactionBlockResponse,
} from '@mysten/sui/client'
import { Keypair } from '@mysten/sui/cryptography'
import { ADMIN_KEYPAIR, Config } from '../config/config'
import { Transaction } from '@mysten/sui/transactions'

import { execSync } from 'child_process'

export class PublishSingleton {
    private static instance: PublishSingleton | null = null

    private constructor(private readonly publishResp: SuiTransactionBlockResponse) {}

    private static getPackagePath(packagePath?: string): string {
        packagePath ??= Config.vars.PACKAGE_PATH

        if (!packagePath) {
            throw new Error(
                'You must set the `PACKAGE_PATH` environment variable to your Move.toml path.'
            )
        }

        return packagePath
    }

    public static async publish(signer?: Keypair, packagePath?: string) {
        signer ??= ADMIN_KEYPAIR
        const _packagePath = this.getPackagePath(packagePath)

        if (!PublishSingleton.instance) {
            const publishResp = await PublishSingleton.publishPackage(signer, _packagePath)
            const packageId = this.findPublishedPackage(publishResp)?.packageId
            if (!packageId) {
                throw new Error('Expected to find package published')
            }
            // suiClientGen(packageId)
            PublishSingleton.instance = new PublishSingleton(publishResp)
        }
    }

    private static getInstance(): PublishSingleton {
        if (!PublishSingleton.instance) {
            throw new Error('Use `async PublishSingleton.publish()` first')
        }
        return PublishSingleton.instance
    }

    public static publishResponse(): SuiTransactionBlockResponse {
        return this.getInstance().publishResp
    }

    public static get packageId(): string {
        const packageChng = this.findPublishedPackage(this.publishResponse())
        if (!packageChng) {
            throw new Error('Expected to find package published')
        }
        return packageChng.packageId
    }

    public static findObjectIdByType(type: string, fail: boolean = true): string {
        const obj = this.findObjectChangeCreatedByType(this.publishResponse(), type)
        if (fail && !obj) {
            throw new Error(`Expected to find ${type} shared object created.`)
        }
        return obj?.objectId || ''
    }

    public static get upgradeCapId(): string {
        return this.findObjectIdByType(`0x2::package::UpgradeCap`)
    }

    public static get usdcTreasuryCap(): string {
        return this.findObjectIdByType(
            `${this.packageId}::treasury::Treasury<${this.packageId}::usdc::USDC>`,
            false
        )
    }

    static getPublishTx(packagePath: string, sender: string) {
        const transaction = new Transaction()

        if (!fs.existsSync(packagePath)) {
            throw new Error(`Package doesn't exist under: ${packagePath}`)
        }

        if (fs.existsSync(`${packagePath}/Move.lock`)) {
            fs.unlinkSync(`${packagePath}/Move.lock`)
        }
        fs.rmSync(`${packagePath}/build`, { recursive: true, force: true })

        let buildCommand = `sui move build --dump-bytecode-as-base64 --path ${packagePath}`
        const network = Config.vars.NETWORK
        if (network === 'localnet' || network === 'devnet') {
            buildCommand += ' --with-unpublished-dependencies'
        }

        const { modules, dependencies } = JSON.parse(execSync(buildCommand, { encoding: 'utf-8' }))

        const upgradeCap = transaction.publish({
            modules,
            dependencies,
        })

        transaction.transferObjects([upgradeCap], sender)
        return transaction
    }

    static async getPublishBytes(signer?: string, packagePath?: string): Promise<string> {
        signer ??= ADMIN_KEYPAIR.toSuiAddress()
        const _packagePath = this.getPackagePath(packagePath)
        const transaction = this.getPublishTx(_packagePath, signer)
        const client = new SuiClient({ url: Config.vars.RPC })
        const txBytes = await transaction.build({ client, onlyTransactionKind: true })
        return Buffer.from(txBytes).toString('base64')
    }

    static async publishPackage(
        signer: Keypair,
        packagePath: string
    ): Promise<SuiTransactionBlockResponse> {
        const transaction = this.getPublishTx(packagePath, signer.toSuiAddress())
        const client = new SuiClient({ url: Config.vars.RPC })
        const resp = await client.signAndExecuteTransaction({
            transaction,
            signer,
            options: {
                showObjectChanges: true,
                showEffects: true,
            },
        })
        if (resp.effects?.status.status !== 'success') {
            throw new Error(`Failure during publish transaction:\n${JSON.stringify(resp, null, 2)}`)
        }
        await client.waitForTransaction({ digest: resp.digest })
        return resp
    }

    static findPublishedPackage(
        resp: SuiTransactionBlockResponse
    ): SuiObjectChangePublished | undefined {
        return resp.objectChanges?.find(
            (chng): chng is SuiObjectChangePublished => chng.type === 'published'
        )
    }

    static findObjectChangeCreatedByType(
        resp: SuiTransactionBlockResponse,
        type: string
    ): SuiObjectChangeCreated | undefined {
        return resp.objectChanges?.find(
            (chng): chng is SuiObjectChangeCreated =>
                chng.type === 'created' && chng.objectType === type
        )
    }
}
