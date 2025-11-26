import { Config, ConfigVars } from '../config/config'
import { PublishSingleton } from './publish'

export async function deploy(vars?: ConfigVars) {
    vars ??= Config.vars
    await PublishSingleton.publish()

    const newConfig = {
        ...vars,
        PACKAGE_ID: PublishSingleton.packageId,
        UPGRADE_CAP_ID: PublishSingleton.upgradeCapId,
    }

    if (PublishSingleton.usdcTreasuryCap) {
        newConfig.USDC_PACKAGE_ID = PublishSingleton.packageId
        newConfig.USDC_TREASURY_CAP = PublishSingleton.usdcTreasuryCap
    }

    Config.write(newConfig)

    return `Move contracts deployed successfully on ${vars.NETWORK} contract details have been stored in .env.${vars.NETWORK}`
}

export async function getDeployBytes() {
    return await PublishSingleton.getPublishBytes()
}
