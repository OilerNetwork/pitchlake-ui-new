export const ABI = [
  {
    "type": "impl",
    "name": "FossilClientImpl",
    "interface_name": "pitch_lake::fossil_client::interface::IFossilClient"
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::felt252>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "struct",
    "name": "pitch_lake::vault::interface::RoundSettledReturn",
    "members": [
      {
        "name": "total_payout",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "enum",
    "name": "pitch_lake::vault::interface::L1DataProcessorCallbackReturn",
    "variants": [
      {
        "name": "RoundSettled",
        "type": "pitch_lake::vault::interface::RoundSettledReturn"
      },
      {
        "name": "FirstRoundInitialized",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "pitch_lake::fossil_client::interface::IFossilClient",
    "items": [
      {
        "type": "function",
        "name": "fossil_callback",
        "inputs": [
          {
            "name": "request",
            "type": "core::array::Span::<core::felt252>"
          },
          {
            "name": "result",
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "outputs": [
          {
            "type": "pitch_lake::vault::interface::L1DataProcessorCallbackReturn"
          }
        ],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "fossil_processor",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "struct",
    "name": "pitch_lake::vault::interface::L1Data",
    "members": [
      {
        "name": "twap",
        "type": "core::integer::u256"
      },
      {
        "name": "cap_level",
        "type": "core::integer::u128"
      },
      {
        "name": "reserve_price",
        "type": "core::integer::u256"
      }
    ]
  },
  {
    "type": "event",
    "name": "pitch_lake::fossil_client::contract::FossilClient::FossilCallbackSuccess",
    "kind": "struct",
    "members": [
      {
        "name": "vault_address",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "l1_data",
        "type": "pitch_lake::vault::interface::L1Data",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "pitch_lake::fossil_client::contract::FossilClient::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "FossilCallbackSuccess",
        "type": "pitch_lake::fossil_client::contract::FossilClient::FossilCallbackSuccess",
        "kind": "nested"
      }
    ]
  }
] as const;
