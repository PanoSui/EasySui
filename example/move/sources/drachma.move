// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
module example::drachma;

use sui::coin_registry;

const DECIMALS: u8 = 6;
const SYMBOL: vector<u8> = b"DRX";
const NAME: vector<u8> = b"Drachma";
const DESCRIPTION: vector<u8> = b"Drachma, the ancient greek currency";
const ICON_URL: vector<u8> =
    b"https://aggregator.walrus-mainnet.h2o-nodes.com/v1/blobs/DYlIcfM32ICsXfTJR69kQ6Vv4roYnQbOvoUbRiwsg6g";

// The type identifier of coin. The coin will have a type
// tag of kind: `Coin<example::drachma::DRACHMA>`
// Make sure that the name of the type matches the module's name.
public struct DRACHMA has drop {}

// Module initializer is called once on module publish using the new Coin Registry system.
// This creates a currency registered in the Sui Coin Registry at shared object address 0xc.
fun init(witness: DRACHMA, ctx: &mut TxContext) {
    // Create currency using OTW (One-Time Witness) for proof of uniqueness
    // This is the standard and recommended pattern for creating currencies in init functions
    let (builder, treasury_cap) = coin_registry::new_currency_with_otw(
        witness,
        DECIMALS,
        SYMBOL.to_string(),
        NAME.to_string(),
        DESCRIPTION.to_string(),
        ICON_URL.to_string(),
        ctx,
    );

    // Finalize registration and get the metadata cap
    // This creates the shared Currency object in the Coin Registry
    let metadata_cap = builder.finalize(ctx);

    // Transfer both caps to the sender
    // Treasury cap controls minting and burning
    // Metadata cap allows updating currency metadata if needed
    transfer::public_transfer(treasury_cap, ctx.sender());
    transfer::public_transfer(metadata_cap, ctx.sender());
}

#[test_only]
public(package) fun init_for_testing(ctx: &mut TxContext) {
    DRACHMA {}.init(ctx);
}
