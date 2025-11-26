# EasySui SDK

Easy-to-use TypeScript SDK for Sui blockchain development.

## Installation

```bash
npm install @easysui/sdk
# or
pnpm add @easysui/sdk
# or
yarn add @easysui/sdk
```

## Usage

```typescript
import { Config, getKeypair, deploySuiPackage } from '@easysui/sdk'

// Get configuration
const config = Config.vars

// Create keypair from private key
const keypair = getKeypair('your-private-key')

// Deploy a package
const result = await deploySuiPackage(config.PACKAGE_PATH)
```

## Features

- **Configuration Management**: Easy configuration with environment-specific settings
- **Token Utilities**: Helpers for working with Sui tokens and USDC
- **Deployment Tools**: Simplified package deployment and upgrades
- **Cost Analysis**: Gas cost estimation and analysis
- **Test Utilities**: Testing helpers for Sui development

## API Reference

### Config

```typescript
import { Config } from '@easysui/sdk'

// Access configuration variables
const vars = Config.vars

// Write configuration to .env file
Config.write(configVars)
```

### Keypair Management

```typescript
import { getKeypair } from '@easysui/sdk'

const keypair = getKeypair(privateKey)
```

### Package Deployment

```typescript
import { deploySuiPackage, upgradeSuiPackage } from '@easysui/sdk'

// Deploy new package
const deployResult = await deploySuiPackage(packagePath)

// Upgrade existing package
const upgradeResult = await upgradeSuiPackage(packagePath, upgradeCapId)
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm fix
```

## Publishing

This package uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

```bash
# Add a changeset
pnpm changeset

# Version packages
pnpm version

# Build and publish to npm
pnpm release
```

## License

MIT
