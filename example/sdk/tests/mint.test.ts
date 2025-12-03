import { ADMIN_KEYPAIR } from '@easysui/sdk'
import { Drachma } from '../src/tokens/drachma'
import { deploy } from '../src/utils/deploy'

describe('Mint Drachma test', () => {
    beforeAll(async () => {
        await deploy()
    })

    it('should mint drachma coins for admin', async () => {
        await Drachma.mint(1_000_000n, ADMIN_KEYPAIR)
        await Drachma.assertBalance(ADMIN_KEYPAIR, 1_000_000n)
    })
})
