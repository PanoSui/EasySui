import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { Keypair } from '@mysten/sui/cryptography'
import { getFullnodeUrl } from '@mysten/sui/client'
import { getKeypair } from '../utils/keypair'
import { STATIC_CONFIGS } from './static'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const DENY_LIST_ID = '0x403'
export const CLOCK_ID = '0x6'

type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

export interface ConfigVars {
    NETWORK: Network
    RPC: string
    PACKAGE_PATH: string
    PACKAGE_ID: string
    UPGRADE_CAP_ID: string
    USDC_PACKAGE_ID?: string
    USDC_TREASURY_CAP?: string
}

export const ADMIN_KEYPAIR: Keypair = getKeypair(process.env.ADMIN_PRIVATE_KEY!)

export class Config {
    private static instance: Config | null = null

    private static getInstance(): Config {
        if (!Config.instance) {
            this.instance = new Config()
        }
        return this.instance!
    }

    get env(): Network {
        let env = process.env.NODE_ENV
        if (!['mainnet', 'testnet', 'devnet', 'localnet'].includes(env || '')) {
            env = 'localnet'
        }
        return env as Network
    }

    static get vars(): ConfigVars {
        const instance = this.getInstance()
        const NETWORK = instance.env
        dotenv.config({ path: path.resolve(process.cwd(), `.env.${NETWORK}`), override: true })

        const envVars = {
            NETWORK,
            RPC: getFullnodeUrl(NETWORK),
            PACKAGE_PATH: process.env.PACKAGE_PATH || '',
            PACKAGE_ID: process.env.PACKAGE_ID || '',
            UPGRADE_CAP_ID: process.env.UPGRADE_CAP_ID || '',
            USDC_TREASURY_CAP: process.env.USDC_TREASURY_CAP,
            USDC_PACKAGE_ID: process.env.USDC_PACKAGE_ID,
        }

        const staticVars = STATIC_CONFIGS[NETWORK] || {}

        return {
            ...staticVars,
            ...envVars,
        }
    }

    static write(config: ConfigVars): string {
        const instance = this.getInstance()
        const env = instance.env
        const envFile = path.join(process.cwd(), `.env${env ? `.${env}` : ''}`)

        const envVariables = Object.entries(config)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n')

        fs.writeFileSync(envFile, envVariables, 'utf8')
        return envFile
    }
}
