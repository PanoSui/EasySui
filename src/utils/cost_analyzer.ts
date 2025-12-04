import { Transaction } from '@mysten/sui/transactions'
import { SuiTransactionBlockResponse } from '@mysten/sui/client'
import { Config } from '../config/config'

const COST_ANALYSIS_FILE = './gas_cost_estimation.csv'
const HEADERS = [
    'environment',
    'executedAt',
    'digest',
    'packageId',
    'call',
    'computationCost',
    'storageCost',
    'storageRebate',
    'nonRefundableStorageFee',
    'gasSpent',
]

export function analyze_cost(ptb: Transaction, resp: SuiTransactionBlockResponse) {
    const fs = require('fs')
    if (!process.env.COST_ANALYZER_ENABLED) {
        return
    }
    if (!fs.existsSync(COST_ANALYSIS_FILE)) {
        fs.writeFileSync(COST_ANALYSIS_FILE, HEADERS.join(',') + '\n')
    }

    const columns: any = [Config.vars.NETWORK, Date.now(), resp.digest]

    const moveCalls = ptb.blockData.transactions.filter((txItem) => txItem.kind === 'MoveCall')
    const moveCall = moveCalls.pop()
    if (!moveCall?.target) {
        return
    }
    const splits = moveCall.target.split('::')
    columns.push(splits[0])
    columns.push(`${splits[1]}::${splits[2]}`)

    const gasUsed = resp.effects?.gasUsed
    columns.push(gasUsed?.computationCost || 'N/A')
    columns.push(gasUsed?.storageCost || 'N/A')
    columns.push(gasUsed?.storageRebate || 'N/A')
    columns.push(gasUsed?.nonRefundableStorageFee || 'N/A')

    const totalGasCost = BigInt(gasUsed?.computationCost || 0) + BigInt(gasUsed?.storageCost || 0)
    const gasSpent = totalGasCost - BigInt(gasUsed?.storageRebate || 0)
    columns.push(gasSpent)

    fs.appendFileSync(COST_ANALYSIS_FILE, columns.join(',') + '\n')
}
