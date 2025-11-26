import { Drachma } from '../tokens/drachma'
import {ADMIN_KEYPAIR} from '@easysui/sdk'

Drachma.mint(1_000_000n, ADMIN_KEYPAIR).then(() => {
    const link = `https://custom.suiscan.xyz/custom/account/${ADMIN_KEYPAIR.toSuiAddress()}?network=http%3A%2F%2Flocalhost%3A9000`
    console.log(
        `1 Drachma has been minted to ${ADMIN_KEYPAIR.toSuiAddress()} check it out here: ${link}`
    )
})
