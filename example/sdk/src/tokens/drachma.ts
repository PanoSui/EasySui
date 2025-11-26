import { Coin } from '@easysui/sdk'
import { Keypair } from '@mysten/sui/cryptography'
import {Config} from "../utils/config";

export class Drachma extends Coin {
    public static get coinType(): string {
        return Config.vars.PACKAGE_ID + '::drachma::DRACHMA'
    }

    public static async mint(amount: bigint, minter: Keypair) {
        const treasuryId = Config.vars.DRACHMA_TREASURY_CAP_ID
        await Drachma._mint(treasuryId, amount, minter)
    }
}
