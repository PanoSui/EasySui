# Extending Config with Custom Variables

The EasySui SDK allows you to extend the base configuration with your own custom variables while maintaining full type safety.

## Creating a Custom Config Class

```typescript
import { Config, BaseConfigVars } from '@easysui/sdk'

interface MyConfigVars extends BaseConfigVars {
  MY_CUSTOM_VAR: string
  API_KEY?: string
  FEATURE_FLAG: boolean
}

export class MyConfig extends Config<MyConfigVars> {
  static override get vars(): MyConfigVars {
    const baseVars = super.vars

    return {
      ...baseVars,
      MY_CUSTOM_VAR: process.env.MY_CUSTOM_VAR || '',
      API_KEY: process.env.API_KEY,
      FEATURE_FLAG: process.env.FEATURE_FLAG === 'true',
    }
  }
}

const config = MyConfig.vars
console.log(config.NETWORK)
console.log(config.MY_CUSTOM_VAR)
```

## Using Extended Config with Deploy Function

Override the `extraVars` getter to automatically find and store object IDs during deployment:

```typescript
import { deploy, BaseConfigVars, Config, ExtraVarsMap } from '@easysui/sdk'

interface MyConfigVars extends BaseConfigVars {
  SETUP_AUTH?: string
  ADMIN_CAP?: string
}

export class MyConfig extends Config<MyConfigVars> {
  static override get vars(): MyConfigVars {
    const baseVars = super.vars
    return {
      ...baseVars,
      SETUP_AUTH: process.env.SETUP_AUTH,
      ADMIN_CAP: process.env.ADMIN_CAP,
    }
  }

  static override get extraVars(): ExtraVarsMap {
    return {
      SETUP_AUTH: "{packageId}::setup::SetupAuth",
      ADMIN_CAP: "{packageId}::admin::AdminCap",
    }
  }
}

const result = await deploy(MyConfig)
```

The `{packageId}` placeholder is automatically replaced with the deployed package ID. The `deploy()` function will:
1. Deploy your package
2. Read `extraVars` from your Config class
3. Find objects by their Move types using `PublishSingleton.findObjectIdByType()`
4. Add them to your config
5. Write everything to `.env.{network}`

## Environment File Structure

The SDK supports environment-specific config files:

```
.env
.env.localnet
.env.devnet
.env.testnet
.env.mainnet
```

Example `.env.localnet`:
```bash
PACKAGE_PATH=./contracts
PACKAGE_ID=0x123...
UPGRADE_CAP_ID=0x456...
MY_CUSTOM_VAR=localhost:3000
API_KEY=dev-key
FEATURE_FLAG=true
```
