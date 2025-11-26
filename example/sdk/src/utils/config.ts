import {Config as BaseConfig, BaseConfigVars, ExtraVarsMap} from '@easysui/sdk'

interface ConfigVars extends BaseConfigVars {
    DRACHMA_TREASURY_CAP_ID: string
}

export class Config extends BaseConfig<ConfigVars> {
    static override get vars(): ConfigVars {
        const baseVars = super.vars

        return {
            ...baseVars,
            DRACHMA_TREASURY_CAP_ID: process.env.DRACHMA_TREASURY_CAP_ID || '',
        }
    }

    static override get extraVars(): ExtraVarsMap {
        return {
            DRACHMA_TREASURY_CAP_ID: `0x2::coin::TreasuryCap<{packageId}::drachma::DRACHMA>`
        }
    }
}