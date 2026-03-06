export type HexAddress = `0x${string}`;
export type ObjectId = HexAddress;
export type Digest = string;
export type Base58String = string;

export interface SuiPublishResponse {
    transaction: {
        V1: TransactionV1;
    };
    effects: {
        V2: EffectsV2;
    };
    clever_error: string | null;
    events: unknown | null;
    changed_objects: ChangedObjectFlat[];
    unchanged_loaded_runtime_objects: unknown[];
    balance_changes: BalanceChange[];
    checkpoint: number;
}

/** ---------------- Transaction ---------------- */

export interface TransactionV1 {
    kind: {
        ProgrammableTransaction: ProgrammableTransaction;
    };
    sender: HexAddress;
    gas_data: GasData;
    expiration: "None" | { Epoch: number } | { EpochId: number } | unknown;
}

export interface ProgrammableTransaction {
    inputs: PTInput[];
    commands: PTCommand[];
}

export type PTInput =
    | { Pure: number[] } // bytes
    | { Object: PTObjectArg }
    | Record<string, unknown>;

export type PTObjectArg =
    | { ImmOrOwnedObject: ObjectRef }
    | { SharedObject: SharedObjectRef }
    | { Receiving: ObjectRef }
    | Record<string, unknown>;

export interface ObjectRef {
    objectId: ObjectId;
    version: string | number;
    digest: Digest;
}

export interface SharedObjectRef {
    objectId: ObjectId;
    initialSharedVersion: string | number;
    mutable: boolean;
}

export type PTCommand =
    | { Publish: [number[][], HexAddress[]] } // [modules-bytes[], dep-ids[]]
    | { TransferObjects: [PTArgument[], PTArgument] }
    // Add more command variants here as you need them:
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
    | { GasCoin: true }
    | Record<string, unknown>;

export interface GasData {
    payment: [ObjectId, number, Digest][];
    owner: HexAddress;
    price: number;
    budget: number;
}

/** ---------------- Effects ---------------- */

export interface EffectsV2 {
    status: "Success" | { Failure: unknown } | string;
    executed_epoch: number;

    gas_used: GasUsed;

    transaction_digest: Digest;
    gas_object_index: number;

    events_digest: Digest | null;
    dependencies: Digest[];

    lamport_version: number;

    changed_objects: ChangedObjectTuple[];
    unchanged_consensus_objects: unknown[];

    aux_data_digest: Digest | null;
}

export interface GasUsed {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
    nonRefundableStorageFee: string;
}

export type ChangedObjectTuple = [
    ObjectId,
    {
        input_state: "NotExist" | { Exist: [ [number, Digest], OwnerV2 ] } | unknown;
        output_state:
            | { ObjectWrite: [Digest, OwnerV2] }
            | { PackageWrite: [number, Digest] }
            | unknown;
        id_operation: "Created" | "None" | "Deleted" | string;
    }
];

export type OwnerV2 =
    | { AddressOwner: HexAddress }
    | { ObjectOwner: ObjectId }
    | { Shared: { initial_shared_version: number | string } }
    | { Immutable: true }
    | Record<string, unknown>;

/** ---------------- Flattened changed_objects (your second list) ---------------- */

export interface ChangedObjectFlat {
    objectId: ObjectId;

    inputState:
        | "INPUT_OBJECT_STATE_DOES_NOT_EXIST"
        | "INPUT_OBJECT_STATE_EXISTS"
        | string;

    outputState:
        | "OUTPUT_OBJECT_STATE_OBJECT_WRITE"
        | "OUTPUT_OBJECT_STATE_PACKAGE_WRITE"
        | string;

    inputVersion?: string;
    inputDigest?: Digest;
    inputOwner?: OwnerFlat;

    outputVersion?: string;
    outputDigest?: Digest;
    outputOwner?: OwnerFlat;

    idOperation: "CREATED" | "NONE" | "DELETED" | string;

    objectType: string; // e.g. "package" or full type string
}

export type OwnerFlat =
    | { kind: "ADDRESS"; address: HexAddress }
    | { kind: "OBJECT"; objectId: ObjectId }
    | { kind: "SHARED"; initialSharedVersion?: string | number }
    | { kind: "IMMUTABLE" }
    | Record<string, unknown>;

/** ---------------- Balance changes ---------------- */

export interface BalanceChange {
    address: HexAddress;
    coin_type: string;
    amount: number;
}