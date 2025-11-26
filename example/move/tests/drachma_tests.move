// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
#[test_only]
module example::drachma_tests;

use example::drachma::{DRACHMA, init_for_testing};
use sui::{coin::{CoinMetadata, TreasuryCap}, test_scenario as ts, test_utils::assert_eq, url};

const ADMIN: address = @0x0;

const DECIMALS: u8 = 6;
const SYMBOL: vector<u8> = b"DRX";
const NAME: vector<u8> = b"Drachma";
const DESCRIPTION: vector<u8> = b"Drachma, the ancient greek currency";
const ICON_URL: vector<u8> =
    b"https://aggregator.walrus-mainnet.h2o-nodes.com/v1/blobs/DYlIcfM32ICsXfTJR69kQ6Vv4roYnQbOvoUbRiwsg6g";

/// Initializes the test scenario and returns scenario and treasury
fun setup(): (ts::Scenario, TreasuryCap<DRACHMA>) {
    let mut scenario = ts::begin(ADMIN);
    init_for_testing(scenario.ctx());
    scenario.next_tx(ADMIN);

    let treasury = scenario.take_from_sender<TreasuryCap<DRACHMA>>();
    (scenario, treasury)
}

#[test]
fun mint_and_burn() {
    let (mut scenario, mut treasury) = setup();

    let coin = treasury.mint(1000, scenario.ctx());
    assert!(treasury.total_supply() == 1000);
    treasury.burn(coin);
    assert!(treasury.total_supply() == 0);

    scenario.return_to_sender(treasury);
    scenario.end();
}

#[test]
fun metadata_is_correct() {
    let (scenario, treasury) = setup();
    let metadata = scenario.take_immutable<CoinMetadata<DRACHMA>>();

    assert_eq(metadata.get_name(), NAME.to_string());
    assert_eq(metadata.get_decimals(), DECIMALS);
    assert_eq(metadata.get_symbol(), SYMBOL.to_ascii_string());
    assert_eq(metadata.get_description(), DESCRIPTION.to_string());
    assert_eq(metadata.get_icon_url(), option::some(url::new_unsafe_from_bytes(ICON_URL)));

    ts::return_immutable(metadata);
    scenario.return_to_sender(treasury);
    scenario.end();
}
