import {BaseConfigVars, Config} from '../config/config'
import {PublishSingleton} from './publish'

export async function deploy<
    TConfig extends typeof Config = typeof Config,
    TConfigVars extends BaseConfigVars = BaseConfigVars
>(
    ConfigClass: TConfig = Config as TConfig
): Promise<string> {
    const vars = ConfigClass.vars as TConfigVars
    await PublishSingleton.publish()

    const newConfig = {
        ...vars,
        PACKAGE_ID: PublishSingleton.packageId,
        UPGRADE_CAP_ID: PublishSingleton.upgradeCapId,
    } as TConfigVars

    if (PublishSingleton.usdcTreasuryCap) {
        newConfig.USDC_PACKAGE_ID = PublishSingleton.packageId
        newConfig.USDC_TREASURY_CAP = PublishSingleton.usdcTreasuryCap
    }

    // Process extra vars from Config.extraVars
    const extraVars = ConfigClass.extraVars
    if (extraVars && Object.keys(extraVars).length > 0) {
        for (const [key, typePattern] of Object.entries(extraVars)) {
            const type = typePattern.replace('{packageId}', PublishSingleton.packageId)
            // @ts-ignore - dynamically adding properties to config
            newConfig[key] = PublishSingleton.findObjectIdByType(type, true)
        }
    }

    ConfigClass.write(newConfig)

    return `Move contracts deployed successfully on ${vars.NETWORK} contract details have been stored in .env.${vars.NETWORK}`
}

export async function getDeployBytes() {
    return await PublishSingleton.getPublishBytes()
}
