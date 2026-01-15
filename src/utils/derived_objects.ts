import {bcs} from "@mysten/sui/bcs";
import {deriveObjectID as doi} from "@mysten/sui/utils";

export function deriveObjectId(
    parentId: string,
    module: string,
    key: string,
    packageId: string,
    type?: string,
    serializedBcs?: any
) {
    serializedBcs ??= bcs.struct(key, { dummy_value: bcs.bool() }).serialize({ dummy_value: false })
    const keyU8 = serializedBcs.toBytes();
    let typeTag = `${packageId}::${module}::${key}`
    if (type) {
        typeTag += `<${type}>`
    }
    return doi(parentId, typeTag, keyU8)
}