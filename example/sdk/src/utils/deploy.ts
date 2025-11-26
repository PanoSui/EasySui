import {deploy as baseDeploy} from '@easysui/sdk'
import {Config} from "./config";

export async function deploy() {
    return await baseDeploy(Config)
}