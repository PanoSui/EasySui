import path from 'path'
import dotenv from 'dotenv'
import { Keypair } from '@mysten/sui/cryptography'
import { getFullnodeUrl } from '@mysten/sui/client'
import { getKeypair } from '../utils/keypair'
import { STATIC_CONFIGS } from './static'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const DENY_LIST_ID = '0x403'
export const CLOCK_ID = '0x6'
export const COIN_REGISTRY = '0x000000000000000000000000000000000000000000000000000000000000000c'

export type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

// Base configuration that the SDK provides
export interface BaseConfigVars {
    NETWORK: Network
    RPC: string
    PACKAGE_PATH: string
    PACKAGE_ID: string
    UPGRADE_CAP_ID: string
    USDC_PACKAGE_ID?: string
    USDC_TREASURY_CAP?: string
}

// Default ConfigVars is just the base, but projects can extend it
export type ConfigVars = BaseConfigVars

export const ADMIN_KEYPAIR: Keypair = getKeypair(process.env.ADMIN_PRIVATE_KEY!)

/**
 * Map of config keys to Move type patterns for finding object IDs during deployment
 * The type pattern can use {packageId} placeholder which will be replaced with the deployed package ID
 *
 * Example: { SETUP_AUTH: "{packageId}::setup::SetupAuth" }
 * Example: { TOKEN_TREASURY_CAP: "{packageId}::treasury::Treasury<{packageId}::token::TOKEN>" }
 */
export type ExtraVarsMap = Record<string, string>

// Generic Config class that can be extended with custom types
export class Config<TConfigVars extends BaseConfigVars = ConfigVars> {
    private static instance: Config | null = null

    private static getInstance(): Config {
        if (!Config.instance) {
            this.instance = new Config()
        }
        return this.instance!
    }

    get env(): Network {
        let env = process.env.SUI_NETWORK || process.env.NEXT_PUBLIC_SUI_NETWORK
        if (!['mainnet', 'testnet', 'devnet', 'localnet'].includes(env || '')) {
            env = 'localnet'
        }
        return env as Network
    }

    /**
     * Override this getter in your custom Config class to define extra variables
     * that should be populated during deployment by finding objects by their Move types
     */
    static get extraVars(): ExtraVarsMap {
        return {}
    }

    static get vars(): BaseConfigVars {
        const instance = this.getInstance()
        const NETWORK = instance.env
        dotenv.config({ path: path.resolve(process.cwd(), `.env.${NETWORK}`), override: true })

        const envVars = {
            NETWORK,
            RPC: getFullnodeUrl(NETWORK),
            PACKAGE_PATH: process.env.PACKAGE_PATH || '',
            PACKAGE_ID: process.env.PACKAGE_ID || process.env.NEXT_PUBLIC_PACKAGE_ID || '',
            UPGRADE_CAP_ID: process.env.UPGRADE_CAP_ID || process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || '',
            USDC_TREASURY_CAP: process.env.USDC_TREASURY_CAP || process.env.NEXT_PUBLIC_USDC_TREASURY_CAP,
            USDC_PACKAGE_ID: process.env.USDC_PACKAGE_ID || process.env.NEXT_PUBLIC_USDC_PACKAGE_ID,
        }

        const staticVars = STATIC_CONFIGS[NETWORK] || {}

        return {
            ...staticVars,
            ...envVars,
        }
    }

    static write<T extends BaseConfigVars>(config: T): string {
        const fs = require('fs')
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
