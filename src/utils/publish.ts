import fs from 'fs'
import { Keypair } from '@mysten/sui/cryptography'
import { ADMIN_KEYPAIR, Config } from '../config/config'
import { normalizeStructTag, normalizeTypeTag, normalizeSuiAddress } from '@mysten/sui/utils'

import { execSync } from 'child_process'
import {ChangedObjectFlat, SuiPublishResponse} from "../types/grpc";

export class PublishSingleton {
    private static instance: PublishSingleton | null = null

    private constructor(private readonly publishResp: SuiPublishResponse) {}

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
        signer ??= ADMIN_KEYPAIR!
        const _packagePath = this.getPackagePath(packagePath)

        if (!PublishSingleton.instance) {
            const publishResp = await PublishSingleton.publishPackage(signer, _packagePath)
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

    public static publishResponse(): SuiPublishResponse {
        return this.getInstance().publishResp
    }

    public static get packageId(): string {
        const packageChng = this.findPublishedPackage(this.publishResponse())
        if (!packageChng) {
            throw new Error('Expected to find package published')
        }
        return packageChng.objectId
    }

    public static findObjectIdByType(type: string, fail: boolean = true): string {
        const obj = this.findObjectChangeCreatedByType(this.publishResponse(), type)
        if (fail && !obj) {
            throw new Error(`Expected to find ${type} shared object created.`)
        }
        return obj?.objectId || ''
    }

    public static get upgradeCapId(): string {
        return this.findObjectIdByType('0x2::package::UpgradeCap')
    }

    public static get usdcTreasuryCap(): string {
        return this.findObjectIdByType(
            `${this.packageId}::treasury::Treasury<${this.packageId}::usdc::USDC>`,
            false
        )
    }

    private static getPublishCmd(packagePath: string, sender: string, inBytes: boolean = false) {
        const network = Config.vars.NETWORK

        if (!fs.existsSync(packagePath)) {
            throw new Error(`Package doesn't exist under: ${packagePath}`)
        }

        if (fs.existsSync(`${packagePath}/Move.lock`)) {
            fs.unlinkSync(`${packagePath}/Move.lock`)
        }
        fs.rmSync(`${packagePath}/build`, { recursive: true, force: true })

        const isEphemeralChain = network !== 'mainnet' && network !== 'testnet'
        const publishCmd = isEphemeralChain ? `test-publish --build-env testnet` : 'publish'

        let buildCommand = `sui client ${publishCmd} ${packagePath}`

        if (isEphemeralChain) {
            buildCommand += ' --publish-unpublished-deps'
        }

        buildCommand += inBytes ? ` --serialize-unsigned-transaction --sender ${sender}` : ' --json'

        return buildCommand
    }

    static async getPublishBytes(signer?: string, packagePath?: string): Promise<string> {
        signer ??= ADMIN_KEYPAIR!.toSuiAddress()
        const _packagePath = this.getPackagePath(packagePath)
        const cmd = this.getPublishCmd(_packagePath, signer, true)
        return execSync(cmd, { encoding: 'utf-8' }).trim()
    }

    static async publishPackage(
        signer: Keypair,
        packagePath: string
    ): Promise<SuiPublishResponse> {
        const cmd = this.getPublishCmd(packagePath, signer.toSuiAddress())
        const res = execSync(cmd, { encoding: 'utf-8' })
        const match = res.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error(`No JSON found in the publish command output: ${res}`);
        }
        return JSON.parse(match[0])
    }

    static findPublishedPackage(
        resp: SuiPublishResponse
    ): ChangedObjectFlat | undefined {
        return resp.changed_objects?.find((c) => c.objectType === 'package')
    }

    static findObjectChangeCreatedByType(
        resp: SuiPublishResponse,
        type: string
    ): ChangedObjectFlat | undefined {
        const normalizedType = normalizeStructTag(type)
        return resp.changed_objects?.find(
            (c) => c.idOperation === 'CREATED'
                && (c.objectType === type || c.objectType === normalizedType)
        )
    }

    static get pubFile() {
        return `Pub.${Config.vars.NETWORK}.toml`
    }

    static cleanPubFile() {
        if (fs.existsSync(this.pubFile)) {
            fs.unlinkSync(this.pubFile)
        }
    }
}
