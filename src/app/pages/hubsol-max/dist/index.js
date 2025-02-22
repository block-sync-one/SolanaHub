"use strict";Object.defineProperty(exports, "__esModule", {value: true});var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/farm.ts
var _anchor = require('@coral-xyz/anchor');
var _spltoken = require('@solana/spl-token');





var _web3js = require('@solana/web3.js');

// src/utils.ts











// src/idl/farming-idl.ts
var IDL = {
  "version": "0.2.2",
  "name": "farming",
  "docs": [
    "Dual farming program"
  ],
  "instructions": [
    {
      "name": "initializePool",
      "docs": [
        "Initializes a new pool. Able to create pool with single reward by passing the same Mint account for reward_a_mint and reward_a_mint"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "stakingMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Staking mint"
          ]
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Staking vault PDA"
          ]
        },
        {
          "name": "rewardAMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Reward A mint"
          ]
        },
        {
          "name": "rewardAVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Reward A vault PDA"
          ]
        },
        {
          "name": "rewardBMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Reward B mint"
          ]
        },
        {
          "name": "rewardBVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Reward B vault PDA"
          ]
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Authority of the pool"
          ]
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Base"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "System program"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "SPL Token program"
          ]
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Rent"
          ]
        }
      ],
      "args": [
        {
          "name": "rewardDuration",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createUser",
      "docs": [
        "Initialize a user staking account"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User"
          ]
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "Authority of user account"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Misc."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "pause",
      "docs": [
        "Pause the pool"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the pool"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "unpause",
      "docs": [
        "Unpauses a previously paused pool. Allowing for funding."
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the pool"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "docs": [
        "User deposit tokens in the pool."
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the deposit/withdraw instance."
          ]
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Staking vault PDA."
          ]
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of user"
          ]
        },
        {
          "name": "stakeFromAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User staking ATA"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Misc."
          ]
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "User withdraw tokens in the pool."
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the deposit/withdraw instance."
          ]
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Staking vault PDA."
          ]
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of user"
          ]
        },
        {
          "name": "stakeFromAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User staking ATA"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Misc."
          ]
        }
      ],
      "args": [
        {
          "name": "sptAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "authorizeFunder",
      "docs": [
        "Authorize additional funders for the pool"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the pool"
          ]
        }
      ],
      "args": [
        {
          "name": "funderToAdd",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "deauthorizeFunder",
      "docs": [
        "Deauthorize funders for the pool"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the pool"
          ]
        }
      ],
      "args": [
        {
          "name": "funderToRemove",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "fund",
      "docs": [
        "Fund the pool with rewards.  This resets the clock on the end date, pushing it out to the set duration. And, linearly redistributes remaining rewards."
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Staking vault PDA"
          ]
        },
        {
          "name": "rewardAVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Reward A Vault PDA"
          ]
        },
        {
          "name": "rewardBVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Reward B Vault PDA"
          ]
        },
        {
          "name": "funder",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Funder"
          ]
        },
        {
          "name": "fromA",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Funder reward A ATA"
          ]
        },
        {
          "name": "fromB",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Funder reward B ATA"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Misc."
          ]
        }
      ],
      "args": [
        {
          "name": "amountA",
          "type": "u64"
        },
        {
          "name": "amountB",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim",
      "docs": [
        "User claim rewards"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Staking vault PDA."
          ]
        },
        {
          "name": "rewardAVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Reward A Vault PDA"
          ]
        },
        {
          "name": "rewardBVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Reward B Vault PDA"
          ]
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User."
          ]
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of user"
          ]
        },
        {
          "name": "rewardAAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User's Reward A ATA"
          ]
        },
        {
          "name": "rewardBAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "User's Reward B ATA"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdrawExtraToken",
      "docs": [
        "Withdraw token that mistakenly deposited to staking_vault"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Global accounts for the staking instance."
          ]
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Staking vault PDA"
          ]
        },
        {
          "name": "withdrawToAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Token account to receive mistakenly deposited token"
          ]
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true,
          "docs": [
            "Authority of the staking instance"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Misc."
          ]
        }
      ],
      "args": []
    },
    {
      "name": "closeUser",
      "docs": [
        "Closes a users stake account. Validation is done to ensure this is only allowed when the user has nothing staked and no rewards pending."
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "migrateFarmingRate",
      "docs": [
        "anyone can call this"
      ],
      "accounts": [
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closePool",
      "docs": [
        "Closes a pool account. Only able to be done when there are no users staked."
      ],
      "accounts": [
        {
          "name": "refundee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingRefundee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardARefundee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardBRefundee",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakingVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rewardBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "docs": [
        "Pool account wrapper"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Privileged account."
            ],
            "type": "publicKey"
          },
          {
            "name": "paused",
            "docs": [
              "Paused state of the program"
            ],
            "type": "bool"
          },
          {
            "name": "stakingMint",
            "docs": [
              "Mint of the token that can be staked."
            ],
            "type": "publicKey"
          },
          {
            "name": "stakingVault",
            "docs": [
              "Vault to store staked tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardAMint",
            "docs": [
              "Mint of the reward A token."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardAVault",
            "docs": [
              "Vault to store reward A tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardBMint",
            "docs": [
              "Mint of the reward B token."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardBVault",
            "docs": [
              "Vault to store reward B tokens."
            ],
            "type": "publicKey"
          },
          {
            "name": "baseKey",
            "docs": [
              "Base key"
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardDuration",
            "docs": [
              "The period which rewards are linearly distributed."
            ],
            "type": "u64"
          },
          {
            "name": "rewardDurationEnd",
            "docs": [
              "The timestamp at which the current reward period ends."
            ],
            "type": "u64"
          },
          {
            "name": "lastUpdateTime",
            "docs": [
              "The last time reward states were updated."
            ],
            "type": "u64"
          },
          {
            "name": "rewardARate",
            "docs": [
              "deprecated field"
            ],
            "type": "u64"
          },
          {
            "name": "rewardBRate",
            "docs": [
              "deprecated field"
            ],
            "type": "u64"
          },
          {
            "name": "rewardAPerTokenStored",
            "docs": [
              "Last calculated reward A per pool token."
            ],
            "type": "u128"
          },
          {
            "name": "rewardBPerTokenStored",
            "docs": [
              "Last calculated reward B per pool token."
            ],
            "type": "u128"
          },
          {
            "name": "userStakeCount",
            "docs": [
              "Users staked"
            ],
            "type": "u32"
          },
          {
            "name": "funders",
            "docs": [
              "authorized funders",
              "[] because short size, fixed account size, and ease of use on",
              "client due to auto generated account size property"
            ],
            "type": {
              "array": [
                "publicKey",
                3
              ]
            }
          },
          {
            "name": "rewardARateU128",
            "docs": [
              "reward_a_rate in u128 form"
            ],
            "type": "u128"
          },
          {
            "name": "rewardBRateU128",
            "docs": [
              "reward_b_rate in u128 form"
            ],
            "type": "u128"
          },
          {
            "name": "poolBump",
            "docs": [
              "Pool bump"
            ],
            "type": "u8"
          },
          {
            "name": "totalStaked",
            "docs": [
              "Total staked amount"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "user",
      "docs": [
        "Farming user account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "docs": [
              "Pool the this user belongs to."
            ],
            "type": "publicKey"
          },
          {
            "name": "owner",
            "docs": [
              "The owner of this account."
            ],
            "type": "publicKey"
          },
          {
            "name": "rewardAPerTokenComplete",
            "docs": [
              "The amount of token A claimed."
            ],
            "type": "u128"
          },
          {
            "name": "rewardBPerTokenComplete",
            "docs": [
              "The amount of token B claimed."
            ],
            "type": "u128"
          },
          {
            "name": "rewardAPerTokenPending",
            "docs": [
              "The amount of token A pending claim."
            ],
            "type": "u64"
          },
          {
            "name": "rewardBPerTokenPending",
            "docs": [
              "The amount of token B pending claim."
            ],
            "type": "u64"
          },
          {
            "name": "balanceStaked",
            "docs": [
              "The amount staked."
            ],
            "type": "u64"
          },
          {
            "name": "nonce",
            "docs": [
              "Signer nonce."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "EventDeposit",
      "fields": [
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "EventWithdraw",
      "fields": [
        {
          "name": "amount",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "EventFund",
      "fields": [
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "EventClaim",
      "fields": [
        {
          "name": "amountA",
          "type": "u64",
          "index": false
        },
        {
          "name": "amountB",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "EventAuthorizeFunder",
      "fields": [
        {
          "name": "newFunder",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "EventUnauthorizeFunder",
      "fields": [
        {
          "name": "funder",
          "type": "publicKey",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6e3,
      "name": "InsufficientFundWithdraw",
      "msg": "Insufficient funds to withdraw."
    },
    {
      "code": 6001,
      "name": "AmountMustBeGreaterThanZero",
      "msg": "Amount must be greater than zero."
    },
    {
      "code": 6002,
      "name": "SingleDepositTokenBCannotBeFunded",
      "msg": "Reward B cannot be funded - pool is single deposit."
    },
    {
      "code": 6003,
      "name": "PoolPaused",
      "msg": "Pool is paused."
    },
    {
      "code": 6004,
      "name": "DurationTooShort",
      "msg": "Duration cannot be shorter than one day."
    },
    {
      "code": 6005,
      "name": "FunderAlreadyAuthorized",
      "msg": "Provided funder is already authorized to fund."
    },
    {
      "code": 6006,
      "name": "MaxFunders",
      "msg": "Maximum funders already authorized."
    },
    {
      "code": 6007,
      "name": "CannotDeauthorizePoolAuthority",
      "msg": "Cannot deauthorize the primary pool authority."
    },
    {
      "code": 6008,
      "name": "CannotDeauthorizeMissingAuthority",
      "msg": "Authority not found for deauthorization."
    },
    {
      "code": 6009,
      "name": "MathOverflow",
      "msg": "Math operation overflow"
    }
  ]
};

// src/constant.ts
var _spltokenregistry = require('@solana/spl-token-registry');

var FARMING_API_ENDPOINT = Object.freeze({
  devnet: "https://dev-mer-amm.raccoons.dev/farms",
  "mainnet-beta": "https://amm.meteora.ag/farms"
});
var FARM_PROGRAM_ID = new (0, _web3js.PublicKey)(
  "FarmuwXPWXvefWUeqFAa5w6rifLkq5X6E8bimYvrhCB1"
);
var AMM_PROGRAM_ID = new (0, _web3js.PublicKey)(
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"
);
var SIMULATION_USER = new (0, _web3js.PublicKey)(
  "HrY9qR5TiB2xPzzvbBu5KrBorMfYGQXh9osXydz4jy9s"
);
var DEVNET_COIN = [
  {
    chainId: _spltokenregistry.ENV.Devnet,
    address: "So11111111111111111111111111111111111111112",
    decimals: 9,
    name: "Wrapped SOL",
    symbol: "SOL",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    extensions: {
      coingeckoId: "solana",
      serumV3Usdc: "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT",
      serumV3Usdt: "HWHvQhFmJB3NUcu1aihKmrKegfVxBEHzwVX6yZCKEsi1",
      website: "https://solana.com/"
    }
  },
  {
    chainId: _spltokenregistry.ENV.Devnet,
    address: "zVzi5VAf4qMEwzv7NXECVx5v2pQ7xnqVVjCXZwS9XzA",
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    extensions: {
      coingeckoId: "usd-coin",
      serumV3Usdt: "77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS",
      website: "https://www.centre.io/"
    }
  },
  {
    chainId: _spltokenregistry.ENV.Devnet,
    address: "9NGDi2tZtNmCCp8SVLKNuGjuWAVwNF3Vap5tT8km5er9",
    decimals: 9,
    name: "USDT",
    symbol: "USDT",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    tags: ["stablecoin"],
    extensions: {
      coingeckoId: "tether",
      serumV3Usdc: "77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS",
      website: "https://tether.to/"
    }
  }
];

// src/utils.ts
var getFarmProgram = (connection) => {
  const provider = new (0, _anchor.AnchorProvider)(
    connection,
    {},
    _anchor.AnchorProvider.defaultOptions()
  );
  const program = new (0, _anchor.Program)(IDL, FARM_PROGRAM_ID, provider);
  return { provider, program };
};
var getFarmInfo = (cluster = "mainnet-beta") => __async(void 0, null, function* () {
  const data = yield fetch(FARMING_API_ENDPOINT[cluster]).then(
    (res) => res.json()
  );
  return data;
});
var getOrCreateATAInstruction = (tokenMint, owner, connection) => __async(void 0, null, function* () {
  let toAccount;
  try {
    toAccount = yield _spltoken.getAssociatedTokenAddress.call(void 0, 
      owner,
      tokenMint,
      false,
      _spltoken.TOKEN_PROGRAM_ID,
      _spltoken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const account = yield connection.getAccountInfo(toAccount);
    if (!account) {
      const ix = _spltoken.createAssociatedTokenAccountInstruction.call(void 0, 
        owner,
        toAccount,
        owner,
        tokenMint,
        _spltoken.TOKEN_PROGRAM_ID,
        _spltoken.ASSOCIATED_TOKEN_PROGRAM_ID
      );
      return [toAccount, ix];
    }
    return [toAccount, void 0];
  } catch (e) {
    console.error("Error::getOrCreateATAInstruction", e);
    throw e;
  }
});
function chunks(array, size) {
  return Array.apply(0, new Array(Math.ceil(array.length / size))).map(
    (_, index) => array.slice(index * size, (index + 1) * size)
  );
}

// src/farm.ts
function chunkedGetMultipleAccountInfos(connection, pks, chunkSize = 100) {
  return __async(this, null, function* () {
    const accountInfos = (yield Promise.all(
      chunks(pks, chunkSize).map(
        (chunk) => connection.getMultipleAccountsInfo(chunk)
      )
    )).flat();
    return accountInfos;
  });
}
var chunkedFetchMultipleUserAccount = (program, pks, chunkSize = 100) => __async(void 0, null, function* () {
  const accounts = (yield Promise.all(
    chunks(pks, chunkSize).map(
      (chunk) => program.account.user.fetchMultiple(chunk)
    )
  )).flat();
  return accounts.filter(Boolean);
});
var chunkedFetchMultiplePoolAccount = (program, pks, chunkSize = 100) => __async(void 0, null, function* () {
  const accounts = (yield Promise.all(
    chunks(pks, chunkSize).map(
      (chunk) => program.account.pool.fetchMultiple(chunk)
    )
  )).flat();
  return accounts.filter(Boolean);
});
var getAllPoolState = (farmMints, program) => __async(void 0, null, function* () {
  const poolStates = yield chunkedFetchMultiplePoolAccount(
    program,
    farmMints
  );
  return poolStates;
});
var MAX_CLAIM_ALL_ALLOWED = 2;
var PoolFarmImpl = class _PoolFarmImpl {
  constructor(address, program, eventParser, poolState, opt) {
    this.address = address;
    this.program = program;
    this.eventParser = eventParser;
    this.poolState = poolState;
    this.opt = {
      cluster: "mainnet-beta"
    };
    this.opt = opt;
  }
  static create(connection, farm, opt) {
    return __async(this, null, function* () {
      var _a;
      const cluster = (_a = opt == null ? void 0 : opt.cluster) != null ? _a : "mainnet-beta";
      const { program } = getFarmProgram(connection);
      const eventParser = new (0, _anchor.EventParser)(FARM_PROGRAM_ID, program.coder);
      const poolState = yield program.account.pool.fetchNullable(farm);
      if (!poolState)
        throw new Error("No pool state found");
      return new _PoolFarmImpl(farm, program, eventParser, poolState, {
        cluster
      });
    });
  }
  static createMultiple(connection, farmList, opt) {
    return __async(this, null, function* () {
      var _a;
      const cluster = (_a = opt == null ? void 0 : opt.cluster) != null ? _a : "mainnet-beta";
      const { program } = getFarmProgram(connection);
      const eventParser = new (0, _anchor.EventParser)(FARM_PROGRAM_ID, program.coder);
      const poolsState = yield getAllPoolState(farmList, program);
      return poolsState.map((poolState, idx) => {
        const address = farmList[idx];
        return new _PoolFarmImpl(address, program, eventParser, poolState, {
          cluster
        });
      });
    });
  }
  static getFarmAddressesByPoolAddress(poolAddress, cluster) {
    return __async(this, null, function* () {
      const apiData = yield getFarmInfo(cluster);
      const farms = apiData.filter(
        (farm) => farm.pool_address === poolAddress.toBase58()
      );
      if (!farms.length)
        throw new Error("No pool address found ");
      return farms.map((farm) => ({
        farmAddress: new (0, _web3js.PublicKey)(farm.farming_pool),
        APY: farm.farming_apy,
        expired: farm.farm_expire
      }));
    });
  }
  static getFarmAddressesByLp(lpAddress, cluster) {
    return __async(this, null, function* () {
      const apiData = yield getFarmInfo(cluster);
      const farms = apiData.filter(
        (farm) => farm.lp_mint === lpAddress.toBase58()
      );
      if (!farms.length)
        throw new Error("No pool address found ");
      return farms.map((farm) => ({
        farmAddress: new (0, _web3js.PublicKey)(farm.farming_pool),
        APY: farm.farming_apy,
        expired: farm.farm_expire
      }));
    });
  }
  static getUserBalances(connection, owner, farmMints) {
    return __async(this, null, function* () {
      const { program } = getFarmProgram(connection);
      const userStakingPda = farmMints.map((mint) => {
        const [userStakingAddress] = _web3js.PublicKey.findProgramAddressSync(
          [owner.toBuffer(), mint.toBuffer()],
          FARM_PROGRAM_ID
        );
        return userStakingAddress;
      });
      const usersState = yield chunkedFetchMultipleUserAccount(
        program,
        userStakingPda,
        100
      );
      return usersState.reduce((acc, userState) => {
        const userStaked = userState.balanceStaked;
        if (userStaked.isZero())
          return acc;
        acc.set(userState.pool.toBase58(), userStaked);
        return acc;
      }, /* @__PURE__ */ new Map());
    });
  }
  static claimAll(connection, owner, farmMints, opt) {
    return __async(this, null, function* () {
      const { program } = getFarmProgram(connection);
      const poolFarmsImpl = yield _PoolFarmImpl.createMultiple(
        connection,
        farmMints,
        { cluster: opt == null ? void 0 : opt.cluster }
      );
      const claimAllTxs = yield Promise.all(
        poolFarmsImpl.map((poolFarmImpl) => __async(this, null, function* () {
          const claimMethod = yield poolFarmImpl.claimMethodBuilder(owner);
          return yield claimMethod.transaction();
        }))
      );
      const chunkedClaimAllTx = chunks(claimAllTxs, MAX_CLAIM_ALL_ALLOWED);
      const { blockhash, lastValidBlockHeight } = yield connection.getLatestBlockhash("confirmed");
      return Promise.all(
        chunkedClaimAllTx.map((claimAllTx) => __async(this, null, function* () {
          return new (0, _web3js.Transaction)({
            feePayer: owner,
            blockhash,
            lastValidBlockHeight
          }).add(_web3js.ComputeBudgetProgram.setComputeUnitLimit({ units: 14e5 })).add(...claimAllTx);
        }))
      );
    });
  }
  getUserBalance(owner) {
    return __async(this, null, function* () {
      const [userStakingAddress] = _web3js.PublicKey.findProgramAddressSync(
        [owner.toBuffer(), this.address.toBuffer()],
        FARM_PROGRAM_ID
      );
      const userState = yield this.program.account.user.fetchNullable(
        userStakingAddress
      );
      return userState.balanceStaked;
    });
  }
  getUserPda(owner) {
    const [userPda] = _web3js.PublicKey.findProgramAddressSync(
      [owner.toBuffer(), this.address.toBuffer()],
      this.program.programId
    );
    return userPda;
  }
  getUserState(owner) {
    return __async(this, null, function* () {
      const userPda = this.getUserPda(owner);
      return this.program.account.user.fetchNullable(owner);
    });
  }
  createUserInstruction(owner) {
    return __async(this, null, function* () {
      const userPda = this.getUserPda(owner);
      const userState = yield this.getUserState(userPda);
      if (userState)
        return void 0;
      return yield this.program.methods.createUser().accounts({
        owner,
        pool: this.address,
        user: userPda
      }).instruction();
    });
  }
  deposit(owner, amount) {
    return __async(this, null, function* () {
      const userPda = this.getUserPda(owner);
      const instructions = [];
      const userCreateInstruction = yield this.createUserInstruction(owner);
      userCreateInstruction && instructions.push(userCreateInstruction);
      const [userStakingATA, userStakingIx] = yield getOrCreateATAInstruction(
        this.poolState.stakingMint,
        owner,
        this.program.provider.connection
      );
      userStakingIx && instructions.push(userStakingIx);
      const depositTx = yield this.program.methods.deposit(amount).accounts({
        owner,
        user: userPda,
        pool: this.address,
        stakeFromAccount: userStakingATA,
        stakingVault: this.poolState.stakingVault,
        tokenProgram: _spltoken.TOKEN_PROGRAM_ID
      }).preInstructions(instructions).transaction();
      return new (0, _web3js.Transaction)(__spreadValues({
        feePayer: owner
      }, yield this.program.provider.connection.getLatestBlockhash(
        "finalized"
      ))).add(depositTx);
    });
  }
  withdraw(owner, amount) {
    return __async(this, null, function* () {
      const userPda = this.getUserPda(owner);
      const instructions = [];
      const [userStakingATA, userStakingIx] = yield getOrCreateATAInstruction(
        this.poolState.stakingMint,
        owner,
        this.program.provider.connection
      );
      userStakingIx && instructions.push(userStakingIx);
      const withdrawTx = yield this.program.methods.withdraw(amount).accounts({
        owner,
        pool: this.address,
        stakeFromAccount: userStakingATA,
        stakingVault: this.poolState.stakingVault,
        tokenProgram: _spltoken.TOKEN_PROGRAM_ID,
        user: userPda
      }).preInstructions(instructions).transaction();
      return new (0, _web3js.Transaction)(__spreadValues({
        feePayer: owner
      }, yield this.program.provider.connection.getLatestBlockhash(
        "finalized"
      ))).add(withdrawTx);
    });
  }
  claimMethodBuilder(owner) {
    return __async(this, null, function* () {
      const userPda = this.getUserPda(owner);
      const isDual = !this.poolState.rewardAMint.equals(
        this.poolState.rewardBMint
      );
      const preInstructions = [];
      const [[userRewardAATA, userRewardAIx], [userRewardBATA, userRewardBIx]] = yield Promise.all(
        isDual ? [
          getOrCreateATAInstruction(
            this.poolState.rewardAMint,
            owner,
            this.program.provider.connection
          ),
          getOrCreateATAInstruction(
            this.poolState.rewardBMint,
            owner,
            this.program.provider.connection
          )
        ] : [
          getOrCreateATAInstruction(
            this.poolState.rewardAMint,
            owner,
            this.program.provider.connection
          ),
          [void 0, void 0]
        ]
      );
      userRewardAIx && preInstructions.push(userRewardAIx);
      userRewardBIx && preInstructions.push(userRewardBIx);
      return this.program.methods.claim().accounts({
        owner,
        pool: this.address,
        rewardAAccount: userRewardAATA,
        rewardBAccount: isDual ? userRewardBATA : userRewardAATA,
        rewardAVault: this.poolState.rewardAVault,
        rewardBVault: this.poolState.rewardBVault,
        stakingVault: this.poolState.stakingVault,
        tokenProgram: _spltoken.TOKEN_PROGRAM_ID,
        user: userPda
      }).preInstructions(preInstructions);
    });
  }
  claim(owner) {
    return __async(this, null, function* () {
      const claimTx = yield (yield this.claimMethodBuilder(owner)).transaction();
      return new (0, _web3js.Transaction)(__spreadValues({
        feePayer: owner
      }, yield this.program.provider.connection.getLatestBlockhash(
        "finalized"
      ))).add(claimTx);
    });
  }
  static getClaimableRewards(owner, farmMints, connection) {
    return __async(this, null, function* () {
      const { program } = getFarmProgram(connection);
      const usersPda = farmMints.map((mint) => {
        const [userStakingAddress] = _web3js.PublicKey.findProgramAddressSync(
          [owner.toBuffer(), mint.toBuffer()],
          FARM_PROGRAM_ID
        );
        return userStakingAddress;
      });
      const accountsToFetched = [_web3js.SYSVAR_CLOCK_PUBKEY, ...farmMints, ...usersPda];
      const accounts = yield chunkedGetMultipleAccountInfos(
        connection,
        accountsToFetched
      );
      const [clockAccountInfo, ...restAccounts] = accounts;
      const clockData = clockAccountInfo == null ? void 0 : clockAccountInfo.data;
      const onChainTime = Number(clockData.readBigInt64LE(8 * 4));
      const poolStatesMap = /* @__PURE__ */ new Map();
      for (let i = 0; i < farmMints.length; i++) {
        const farmMint = farmMints[i];
        const poolAccount = restAccounts[i];
        const userPdaAccount = restAccounts[i + farmMints.length];
        const poolState = (poolAccount == null ? void 0 : poolAccount.data) ? program.coder.accounts.decode("pool", poolAccount.data) : void 0;
        const userState = (userPdaAccount == null ? void 0 : userPdaAccount.data) ? program.coder.accounts.decode(
          "user",
          userPdaAccount.data
        ) : void 0;
        if (!poolState)
          throw new Error("Pool state not found");
        poolStatesMap.set(farmMint.toBase58(), {
          poolState,
          userState
        });
      }
      return Array.from(poolStatesMap.entries()).reduce((accValue, [farmMint, { poolState, userState }]) => {
        const rewardDurationEnd = poolState.rewardDurationEnd.toNumber();
        const lastTimeRewardApplicable = onChainTime < rewardDurationEnd ? onChainTime : rewardDurationEnd;
        const { a, b } = rewardPerToken(poolState, lastTimeRewardApplicable);
        if (!userState || !poolState)
          return accValue;
        const rewardA = userState.balanceStaked.mul(a.sub(userState.rewardAPerTokenComplete)).div(new (0, _anchor.BN)(1e9)).add(userState.rewardAPerTokenPending);
        const rewardB = userState.balanceStaked.mul(b.sub(userState.rewardBPerTokenComplete)).div(new (0, _anchor.BN)(1e9)).add(userState.rewardBPerTokenPending);
        if (rewardA.isZero() && rewardB.isZero())
          return accValue;
        accValue.set(farmMint, {
          rewardA,
          rewardB
        });
        return accValue;
      }, /* @__PURE__ */ new Map());
    });
  }
};
function rewardPerToken(pool, lastTimeRewardApplicable) {
  let totalStake = pool.totalStaked;
  if (totalStake.isZero()) {
    return {
      a: pool.rewardAPerTokenStored,
      b: pool.rewardBPerTokenStored
    };
  }
  let timePeriod = new (0, _anchor.BN)(
    lastTimeRewardApplicable - pool.lastUpdateTime.toNumber()
  );
  return {
    a: pool.rewardAPerTokenStored.add(
      timePeriod.mul(pool.rewardARateU128).div(totalStake)
    ),
    b: pool.rewardBPerTokenStored.add(
      timePeriod.mul(pool.rewardBRateU128).div(totalStake)
    )
  };
}



exports.PoolFarmImpl = PoolFarmImpl; exports.chunkedGetMultipleAccountInfos = chunkedGetMultipleAccountInfos;
//# sourceMappingURL=index.js.map