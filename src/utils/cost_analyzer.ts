import * as fs from 'fs'
import { Transaction } from '@mysten/sui/transactions'
import { SuiTransactionBlockResponse } from '@mysten/sui/jsonRpc'
import { Config } from '../config/config'
import {SuiClientTypes} from "@mysten/sui/client";

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

export function analyze_cost(ptb: Transaction, resp: SuiClientTypes.Transaction) {
    if (!process.env.COST_ANALYZER_ENABLED) {
        return
    }
    if (!fs.existsSync(COST_ANALYSIS_FILE)) {
        fs.writeFileSync(COST_ANALYSIS_FILE, HEADERS.join(',') + '\n')
    }

    const columns: any = [Config.vars.NETWORK, Date.now(), resp.digest]

    const moveCalls = ptb.getData().commands.filter((txItem) => txItem.$kind === 'MoveCall')
    const moveCall = moveCalls.pop()
    if (!moveCall) {
        return
    }
    const { package: pkg, module: mod, function: fn } = moveCall.MoveCall
    columns.push(pkg)
    columns.push(`${mod}::${fn}`)

    const gasUsed = (resp.effects as any)?.gasUsed
    columns.push(gasUsed?.computationCost || 'N/A')
    columns.push(gasUsed?.storageCost || 'N/A')
    columns.push(gasUsed?.storageRebate || 'N/A')
    columns.push(gasUsed?.nonRefundableStorageFee || 'N/A')

    const totalGasCost = BigInt(gasUsed?.computationCost || 0) + BigInt(gasUsed?.storageCost || 0)
    const gasSpent = totalGasCost - BigInt(gasUsed?.storageRebate || 0)
    columns.push(gasSpent)

    fs.appendFileSync(COST_ANALYSIS_FILE, columns.join(',') + '\n')
}
