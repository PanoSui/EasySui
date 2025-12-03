import {ADMIN_KEYPAIR, deploy as baseDeploy} from '@easysui/sdk'
import {Config} from "./config";
import {Drachma} from "../tokens/drachma";

export async function deploy() {
    const deployMsg = await baseDeploy(Config)
    await Drachma.finalizeRegistration(ADMIN_KEYPAIR)

    return deployMsg + `\nThe ${Drachma.coinType} was registered.`
}