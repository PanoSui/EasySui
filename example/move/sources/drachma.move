// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
module example::drachma;

use sui::{coin, url};

const DECIMALS: u8 = 6;
const SYMBOL: vector<u8> = b"DRX";
const NAME: vector<u8> = b"Drachma";
const DESCRIPTION: vector<u8> = b"Drachma, the ancient greek currency";
const ICON_URL: vector<u8> =
    b"https://aggregator.walrus-mainnet.h2o-nodes.com/v1/blobs/DYlIcfM32ICsXfTJR69kQ6Vv4roYnQbOvoUbRiwsg6g";

// The type identifier of coin. The coin will have a type
// tag of kind: `Coin<example::coin::DRACHMA>`
// Make sure that the name of the type matches the module's name.
public struct DRACHMA has drop {}

// Module initializer is called once on module publish. A treasury
// cap is sent to the publisher, who then controls minting and burning.
fun init(otw: DRACHMA, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        otw,
        DECIMALS,
        SYMBOL,
        NAME,
        DESCRIPTION,
        option::some(url::new_unsafe_from_bytes(ICON_URL)),
        ctx,
    );

    // Freezing this object makes the metadata immutable, including the title, name, and icon image.
    // If you want to allow mutability, share it with public_share_object instead.
    transfer::public_freeze_object(metadata);
    transfer::public_transfer(treasury, ctx.sender())
}

#[test_only]
public(package) fun init_for_testing(ctx: &mut TxContext) {
    DRACHMA {}.init(ctx);
}
