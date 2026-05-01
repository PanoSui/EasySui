export type HexAddress = `0x${string}`;
export type ObjectId = HexAddress;
export type Digest = string;
export type Base58String = string;

export interface SuiPublishResponse {
    digest: Digest;
    transaction: SuiTransaction;
    effects: TransactionEffects;
    objectChanges: ObjectChange[];
    balanceChanges: BalanceChange[];
    timestampMs: string;
    checkpoint: string;
}

/** ---------------- Transaction ---------------- */

export interface SuiTransaction {
    data: TransactionData;
    txSignatures: string[];
}

export interface TransactionData {
    messageVersion: "v1" | string;
    transaction: ProgrammableTransactionBlock;
    sender: HexAddress;
    gasData: GasData;
}

export interface ProgrammableTransactionBlock {
    kind: "ProgrammableTransaction" | string;
    inputs: PTInput[];
    transactions: PTCommand[];
}

export type PTInput =
    | { type: "pure"; valueType: string; value: unknown }
    | {
          type: "object";
          objectType: string;
          objectId: ObjectId;
          version?: string | number;
          digest?: Digest;
          mutable?: boolean;
          initialSharedVersion?: string | number;
      }
    | Record<string, unknown>;

export type PTCommand =
    | { Publish: HexAddress[] }
    | { TransferObjects: [PTArgument[], PTArgument] }
    | { MoveCall: unknown }
    | { SplitCoins: unknown }
    | { MergeCoins: unknown }
    | { MakeMoveVec: unknown }
    | { Upgrade: unknown }
    | Record<string, unknown>;

export type PTArgument =
    | { Input: number }
    | { Result: number }
    | { NestedResult: [number, number] }
    | "GasCoin"
    | Record<string, unknown>;

export interface GasData {
    payment: GasPayment[];
    owner: HexAddress;
    price: string;
    budget: string;
}

export interface GasPayment {
    objectId: ObjectId;
    version: number | string;
    digest: Digest;
}

/** ---------------- Effects ---------------- */

export interface TransactionEffects {
    messageVersion: "v1" | string;
    status: ExecutionStatus;
    executedEpoch: string;
    gasUsed: GasUsed;
    modifiedAtVersions?: ModifiedAtVersion[];
    transactionDigest: Digest;
    created?: OwnedObjectRef[];
    mutated?: OwnedObjectRef[];
    unwrapped?: OwnedObjectRef[];
    deleted?: ObjectRef[];
    wrapped?: ObjectRef[];
    unwrappedThenDeleted?: ObjectRef[];
    gasObject: OwnedObjectRef;
    eventsDigest?: Digest;
    dependencies?: Digest[];
    sharedObjects?: ObjectRef[];
}

export interface ExecutionStatus {
    status: "success" | "failure" | string;
    error?: string;
}

export interface ModifiedAtVersion {
    objectId: ObjectId;
    sequenceNumber: string;
}

export interface OwnedObjectRef {
    owner: Owner;
    reference: ObjectRef;
}

export interface ObjectRef {
    objectId: ObjectId;
    version: number | string;
    digest: Digest;
}

export type Owner =
    | { AddressOwner: HexAddress }
    | { ObjectOwner: ObjectId }
    | { Shared: { initial_shared_version: number | string } }
    | "Immutable"
    | Record<string, unknown>;

export interface GasUsed {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
    nonRefundableStorageFee: string;
}

/** ---------------- Object changes ---------------- */

export type ObjectChange =
    | ObjectChangePublished
    | ObjectChangeCreated
    | ObjectChangeMutated
    | ObjectChangeTransferred
    | ObjectChangeDeleted
    | ObjectChangeWrapped;

export interface ObjectChangePublished {
    type: "published";
    packageId: HexAddress;
    version: string;
    digest: Digest;
    modules: string[];
}

export interface ObjectChangeCreated {
    type: "created";
    sender: HexAddress;
    owner: Owner;
    objectType: string;
    objectId: ObjectId;
    version: string;
    digest: Digest;
}

export interface ObjectChangeMutated {
    type: "mutated";
    sender: HexAddress;
    owner: Owner;
    objectType: string;
    objectId: ObjectId;
    version: string;
    previousVersion: string;
    digest: Digest;
}

export interface ObjectChangeTransferred {
    type: "transferred";
    sender: HexAddress;
    recipient: Owner;
    objectType: string;
    objectId: ObjectId;
    version: string;
    digest: Digest;
}

export interface ObjectChangeDeleted {
    type: "deleted";
    sender: HexAddress;
    objectType: string;
    objectId: ObjectId;
    version: string;
}

export interface ObjectChangeWrapped {
    type: "wrapped";
    sender: HexAddress;
    objectType: string;
    objectId: ObjectId;
    version: string;
}

/** ---------------- Balance changes ---------------- */

export interface BalanceChange {
    owner: Owner;
    coinType: string;
    amount: string;
}
