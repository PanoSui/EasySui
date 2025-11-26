import { MoveType, SuiClient } from '../utils/sui_client'
import { Keypair } from '@mysten/sui/cryptography'
import { DENY_LIST_ID, Config } from '../config/config'
import { Coin } from './coin'

export class USDC extends Coin {
    public static get coinType(): string {
        return Config.vars.USDC_PACKAGE_ID + '::usdc::USDC'
    }

    private static async getMintCapId(admin: Keypair) {
        async function getMintCapFromChain() {
            const mintCapIds = await SuiClient.getObjectsByType(
                admin.toSuiAddress(),
                `${Config.vars.USDC_PACKAGE_ID}::treasury::MintCap`
            )
            return mintCapIds.pop()
        }

        let mintCapId = await getMintCapFromChain()

        if (!mintCapId) {
            await SuiClient.moveCall({
                signer: admin,
                target: `${Config.vars.USDC_PACKAGE_ID}::treasury::configure_new_controller`,
                typeArgs: [this.coinType],
                args: [Config.vars.USDC_TREASURY_CAP, admin.toSuiAddress(), admin.toSuiAddress()],
                argTypes: [MoveType.object, MoveType.address, MoveType.address],
            })
            mintCapId = await getMintCapFromChain()
        }

        return mintCapId
    }

    public static async faucet(amount: bigint, receiver: string, admin: Keypair) {
        const mintCapId = await this.getMintCapId(admin)

        await SuiClient.moveCall({
            signer: admin,
            target: `${Config.vars.USDC_PACKAGE_ID}::treasury::configure_minter`,
            typeArgs: [this.coinType],
            args: [Config.vars.USDC_TREASURY_CAP, DENY_LIST_ID, amount],
            argTypes: [MoveType.object, MoveType.object, MoveType.u64],
        })

        await SuiClient.moveCall({
            signer: admin,
            target: `${Config.vars.USDC_PACKAGE_ID}::treasury::mint`,
            typeArgs: [this.coinType],
            args: [Config.vars.USDC_TREASURY_CAP, mintCapId, DENY_LIST_ID, amount, receiver],
            argTypes: [
                MoveType.object,
                MoveType.object,
                MoveType.object,
                MoveType.u64,
                MoveType.address,
            ],
        })
    }
}
