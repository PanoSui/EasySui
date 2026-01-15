export type Network = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

interface StaticConfig {
    CHAIN_ID: string
    USDC_PACKAGE_ID?: string
}

export const STATIC_CONFIGS: Record<Network, StaticConfig> = {
    localnet: {
        CHAIN_ID: 'd07607dc',
    },
    devnet: {
        CHAIN_ID: '4c78adac',
    },
    testnet: {
        CHAIN_ID: '4c78adac',
        USDC_PACKAGE_ID: '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29',
    },
    mainnet: {
        CHAIN_ID: '35834a8a',
        USDC_PACKAGE_ID: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
    },
}
