import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { requestSuiFromFaucetV2, getFaucetHost } from '@mysten/sui/faucet'
import { ADMIN_KEYPAIR, Config } from '../config/config'
import { SuiClient } from './sui_client'
import { USDC } from '../tokens/usdc'

export function createWallet() {
    return new Ed25519Keypair()
}

export async function createFundedWallet(usdcAmount?: bigint) {
    const wallet = createWallet()
    await faucet(wallet.toSuiAddress())

    if (usdcAmount) {
        await USDC.faucet(usdcAmount, wallet.toSuiAddress(), ADMIN_KEYPAIR!)
    }

    return wallet
}

async function faucet(address: string) {
    await requestSuiFromFaucetV2({
        host: getFaucetHost(Config.vars.NETWORK as 'localnet' | 'devnet'), // or 'devnet', 'localnet'
        recipient: address,
    })
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForNextEpoch(timeoutMs = 5 * 60 * 1000, pollIntervalMs = 2000) {
    const startEpoch = (await SuiClient.client.getLatestSuiSystemState()).epoch
    const startTime = Date.now()

    while (true) {
        const { epoch } = await SuiClient.client.getLatestSuiSystemState()
        if (Number(epoch) > Number(startEpoch)) {
            return epoch
        }

        if (Date.now() - startTime > timeoutMs) {
            throw new Error('Timeout waiting for next epoch.')
        }

        await sleep(pollIntervalMs)
    }
}
