import { describe, it, beforeAll, expect } from 'vitest'

import { ADMIN_KEYPAIR, createWallet } from '@easysui/sdk'
import { Drachma } from '../src/tokens/drachma'
import { deploy } from '../src/utils/deploy'

describe('Mint Drachma test', () => {
    beforeAll(async () => {
        await deploy()
    })

    it('should mint drachma coins for admin', async () => {
        await Drachma.mint(1_000_000n, ADMIN_KEYPAIR!)
        await Drachma.assertBalance(ADMIN_KEYPAIR!, 1_000_000n)
    })

    it('should send drachma coins to a user', async () => {
        const to = createWallet()
        await Drachma.send(500_000n, ADMIN_KEYPAIR!, to.toSuiAddress())
        await Drachma.assertBalance(ADMIN_KEYPAIR!, 500_000n)
        await Drachma.assertBalance(to, 500_000n)
    })

    it('should get drachma coins from a user', async () => {
        const coinId = await Drachma.getCoin(ADMIN_KEYPAIR!, 100_000n)
        expect(coinId.startsWith('0x')).toBeTruthy()
    })
})
