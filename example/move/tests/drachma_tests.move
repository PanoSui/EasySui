// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
#[test_only]
module example::drachma_tests;

use example::drachma::{DRACHMA, init_for_testing};
use sui::{coin::TreasuryCap, coin_registry::MetadataCap, test_scenario as ts};

const ADMIN: address = @0x0;

/// Initializes the test scenario and returns scenario, treasury, and metadata cap
fun setup(): (ts::Scenario, TreasuryCap<DRACHMA>, MetadataCap<DRACHMA>) {
    let mut scenario = ts::begin(ADMIN);
    init_for_testing(scenario.ctx());
    scenario.next_tx(ADMIN);

    let treasury = scenario.take_from_sender<TreasuryCap<DRACHMA>>();
    let metadata_cap = scenario.take_from_sender<MetadataCap<DRACHMA>>();
    (scenario, treasury, metadata_cap)
}

#[test]
fun mint_and_burn() {
    let (mut scenario, mut treasury, metadata_cap) = setup();

    let coin = treasury.mint(1000, scenario.ctx());
    assert!(treasury.total_supply() == 1000);
    treasury.burn(coin);
    assert!(treasury.total_supply() == 0);

    scenario.return_to_sender(treasury);
    scenario.return_to_sender(metadata_cap);
    scenario.end();
}

#[test]
fun verify_caps_transferred() {
    let mut scenario = ts::begin(ADMIN);
    init_for_testing(scenario.ctx());
    scenario.next_tx(ADMIN);

    // Verify both caps exist for sender before taking them
    assert!(scenario.has_most_recent_for_sender<TreasuryCap<DRACHMA>>());
    assert!(scenario.has_most_recent_for_sender<MetadataCap<DRACHMA>>());

    let treasury = scenario.take_from_sender<TreasuryCap<DRACHMA>>();
    let metadata_cap = scenario.take_from_sender<MetadataCap<DRACHMA>>();

    scenario.return_to_sender(treasury);
    scenario.return_to_sender(metadata_cap);
    scenario.end();
}
