import * as _solana_web3_js from '@solana/web3.js';
import { Connection, PublicKey, Cluster, Transaction } from '@solana/web3.js';
import { IdlAccounts, BN } from '@coral-xyz/anchor';

type Farming = {
    "version": "0.2.2";
    "name": "farming";
    "docs": [
        "Dual farming program"
    ];
    "instructions": [
        {
            "name": "initializePool";
            "docs": [
                "Initializes a new pool. Able to create pool with single reward by passing the same Mint account for reward_a_mint and reward_a_mint"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "stakingMint";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Staking mint"
                    ];
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Staking vault PDA"
                    ];
                },
                {
                    "name": "rewardAMint";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Reward A mint"
                    ];
                },
                {
                    "name": "rewardAVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Reward A vault PDA"
                    ];
                },
                {
                    "name": "rewardBMint";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Reward B mint"
                    ];
                },
                {
                    "name": "rewardBVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Reward B vault PDA"
                    ];
                },
                {
                    "name": "authority";
                    "isMut": true;
                    "isSigner": true;
                    "docs": [
                        "Authority of the pool"
                    ];
                },
                {
                    "name": "base";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Base"
                    ];
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "System program"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "SPL Token program"
                    ];
                },
                {
                    "name": "rent";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Rent"
                    ];
                }
            ];
            "args": [
                {
                    "name": "rewardDuration";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "createUser";
            "docs": [
                "Initialize a user staking account"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User"
                    ];
                },
                {
                    "name": "owner";
                    "isMut": true;
                    "isSigner": true;
                    "docs": [
                        "Authority of user account"
                    ];
                },
                {
                    "name": "systemProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Misc."
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "pause";
            "docs": [
                "Pause the pool"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of the pool"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "unpause";
            "docs": [
                "Unpauses a previously paused pool. Allowing for funding."
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of the pool"
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "deposit";
            "docs": [
                "User deposit tokens in the pool."
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the deposit/withdraw instance."
                    ];
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Staking vault PDA."
                    ];
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User."
                    ];
                },
                {
                    "name": "owner";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of user"
                    ];
                },
                {
                    "name": "stakeFromAccount";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User staking ATA"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Misc."
                    ];
                }
            ];
            "args": [
                {
                    "name": "amount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "withdraw";
            "docs": [
                "User withdraw tokens in the pool."
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the deposit/withdraw instance."
                    ];
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Staking vault PDA."
                    ];
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User."
                    ];
                },
                {
                    "name": "owner";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of user"
                    ];
                },
                {
                    "name": "stakeFromAccount";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User staking ATA"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Misc."
                    ];
                }
            ];
            "args": [
                {
                    "name": "sptAmount";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "authorizeFunder";
            "docs": [
                "Authorize additional funders for the pool"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of the pool"
                    ];
                }
            ];
            "args": [
                {
                    "name": "funderToAdd";
                    "type": "publicKey";
                }
            ];
        },
        {
            "name": "deauthorizeFunder";
            "docs": [
                "Deauthorize funders for the pool"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of the pool"
                    ];
                }
            ];
            "args": [
                {
                    "name": "funderToRemove";
                    "type": "publicKey";
                }
            ];
        },
        {
            "name": "fund";
            "docs": [
                "Fund the pool with rewards.  This resets the clock on the end date, pushing it out to the set duration. And, linearly redistributes remaining rewards."
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Staking vault PDA"
                    ];
                },
                {
                    "name": "rewardAVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Reward A Vault PDA"
                    ];
                },
                {
                    "name": "rewardBVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Reward B Vault PDA"
                    ];
                },
                {
                    "name": "funder";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Funder"
                    ];
                },
                {
                    "name": "fromA";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Funder reward A ATA"
                    ];
                },
                {
                    "name": "fromB";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Funder reward B ATA"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Misc."
                    ];
                }
            ];
            "args": [
                {
                    "name": "amountA";
                    "type": "u64";
                },
                {
                    "name": "amountB";
                    "type": "u64";
                }
            ];
        },
        {
            "name": "claim";
            "docs": [
                "User claim rewards"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Staking vault PDA."
                    ];
                },
                {
                    "name": "rewardAVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Reward A Vault PDA"
                    ];
                },
                {
                    "name": "rewardBVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Reward B Vault PDA"
                    ];
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User."
                    ];
                },
                {
                    "name": "owner";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of user"
                    ];
                },
                {
                    "name": "rewardAAccount";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User's Reward A ATA"
                    ];
                },
                {
                    "name": "rewardBAccount";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "User's Reward B ATA"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [];
        },
        {
            "name": "withdrawExtraToken";
            "docs": [
                "Withdraw token that mistakenly deposited to staking_vault"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Global accounts for the staking instance."
                    ];
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Staking vault PDA"
                    ];
                },
                {
                    "name": "withdrawToAccount";
                    "isMut": true;
                    "isSigner": false;
                    "docs": [
                        "Token account to receive mistakenly deposited token"
                    ];
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                    "docs": [
                        "Authority of the staking instance"
                    ];
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                    "docs": [
                        "Misc."
                    ];
                }
            ];
            "args": [];
        },
        {
            "name": "closeUser";
            "docs": [
                "Closes a users stake account. Validation is done to ensure this is only allowed when the user has nothing staked and no rewards pending."
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "user";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "owner";
                    "isMut": true;
                    "isSigner": true;
                }
            ];
            "args": [];
        },
        {
            "name": "migrateFarmingRate";
            "docs": [
                "anyone can call this"
            ];
            "accounts": [
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                }
            ];
            "args": [];
        },
        {
            "name": "closePool";
            "docs": [
                "Closes a pool account. Only able to be done when there are no users staked."
            ];
            "accounts": [
                {
                    "name": "refundee";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "stakingRefundee";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "rewardARefundee";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "rewardBRefundee";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "pool";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "authority";
                    "isMut": false;
                    "isSigner": true;
                },
                {
                    "name": "stakingVault";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "rewardAVault";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "rewardBVault";
                    "isMut": true;
                    "isSigner": false;
                },
                {
                    "name": "tokenProgram";
                    "isMut": false;
                    "isSigner": false;
                }
            ];
            "args": [];
        }
    ];
    "accounts": [
        {
            "name": "pool";
            "docs": [
                "Pool account wrapper"
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "authority";
                        "docs": [
                            "Privileged account."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "paused";
                        "docs": [
                            "Paused state of the program"
                        ];
                        "type": "bool";
                    },
                    {
                        "name": "stakingMint";
                        "docs": [
                            "Mint of the token that can be staked."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "stakingVault";
                        "docs": [
                            "Vault to store staked tokens."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "rewardAMint";
                        "docs": [
                            "Mint of the reward A token."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "rewardAVault";
                        "docs": [
                            "Vault to store reward A tokens."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "rewardBMint";
                        "docs": [
                            "Mint of the reward B token."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "rewardBVault";
                        "docs": [
                            "Vault to store reward B tokens."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "baseKey";
                        "docs": [
                            "Base key"
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "rewardDuration";
                        "docs": [
                            "The period which rewards are linearly distributed."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "rewardDurationEnd";
                        "docs": [
                            "The timestamp at which the current reward period ends."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "lastUpdateTime";
                        "docs": [
                            "The last time reward states were updated."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "rewardARate";
                        "docs": [
                            "deprecated field"
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "rewardBRate";
                        "docs": [
                            "deprecated field"
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "rewardAPerTokenStored";
                        "docs": [
                            "Last calculated reward A per pool token."
                        ];
                        "type": "u128";
                    },
                    {
                        "name": "rewardBPerTokenStored";
                        "docs": [
                            "Last calculated reward B per pool token."
                        ];
                        "type": "u128";
                    },
                    {
                        "name": "userStakeCount";
                        "docs": [
                            "Users staked"
                        ];
                        "type": "u32";
                    },
                    {
                        "name": "funders";
                        "docs": [
                            "authorized funders",
                            "[] because short size, fixed account size, and ease of use on",
                            "client due to auto generated account size property"
                        ];
                        "type": {
                            "array": [
                                "publicKey",
                                3
                            ];
                        };
                    },
                    {
                        "name": "rewardARateU128";
                        "docs": [
                            "reward_a_rate in u128 form"
                        ];
                        "type": "u128";
                    },
                    {
                        "name": "rewardBRateU128";
                        "docs": [
                            "reward_b_rate in u128 form"
                        ];
                        "type": "u128";
                    },
                    {
                        "name": "poolBump";
                        "docs": [
                            "Pool bump"
                        ];
                        "type": "u8";
                    },
                    {
                        "name": "totalStaked";
                        "docs": [
                            "Total staked amount"
                        ];
                        "type": "u64";
                    }
                ];
            };
        },
        {
            "name": "user";
            "docs": [
                "Farming user account"
            ];
            "type": {
                "kind": "struct";
                "fields": [
                    {
                        "name": "pool";
                        "docs": [
                            "Pool the this user belongs to."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "owner";
                        "docs": [
                            "The owner of this account."
                        ];
                        "type": "publicKey";
                    },
                    {
                        "name": "rewardAPerTokenComplete";
                        "docs": [
                            "The amount of token A claimed."
                        ];
                        "type": "u128";
                    },
                    {
                        "name": "rewardBPerTokenComplete";
                        "docs": [
                            "The amount of token B claimed."
                        ];
                        "type": "u128";
                    },
                    {
                        "name": "rewardAPerTokenPending";
                        "docs": [
                            "The amount of token A pending claim."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "rewardBPerTokenPending";
                        "docs": [
                            "The amount of token B pending claim."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "balanceStaked";
                        "docs": [
                            "The amount staked."
                        ];
                        "type": "u64";
                    },
                    {
                        "name": "nonce";
                        "docs": [
                            "Signer nonce."
                        ];
                        "type": "u8";
                    }
                ];
            };
        }
    ];
    "events": [
        {
            "name": "EventDeposit";
            "fields": [
                {
                    "name": "amount";
                    "type": "u64";
                    "index": false;
                }
            ];
        },
        {
            "name": "EventWithdraw";
            "fields": [
                {
                    "name": "amount";
                    "type": "u64";
                    "index": false;
                }
            ];
        },
        {
            "name": "EventFund";
            "fields": [
                {
                    "name": "amountA";
                    "type": "u64";
                    "index": false;
                },
                {
                    "name": "amountB";
                    "type": "u64";
                    "index": false;
                }
            ];
        },
        {
            "name": "EventClaim";
            "fields": [
                {
                    "name": "amountA";
                    "type": "u64";
                    "index": false;
                },
                {
                    "name": "amountB";
                    "type": "u64";
                    "index": false;
                }
            ];
        },
        {
            "name": "EventAuthorizeFunder";
            "fields": [
                {
                    "name": "newFunder";
                    "type": "publicKey";
                    "index": false;
                }
            ];
        },
        {
            "name": "EventUnauthorizeFunder";
            "fields": [
                {
                    "name": "funder";
                    "type": "publicKey";
                    "index": false;
                }
            ];
        }
    ];
    "errors": [
        {
            "code": 6000;
            "name": "InsufficientFundWithdraw";
            "msg": "Insufficient funds to withdraw.";
        },
        {
            "code": 6001;
            "name": "AmountMustBeGreaterThanZero";
            "msg": "Amount must be greater than zero.";
        },
        {
            "code": 6002;
            "name": "SingleDepositTokenBCannotBeFunded";
            "msg": "Reward B cannot be funded - pool is single deposit.";
        },
        {
            "code": 6003;
            "name": "PoolPaused";
            "msg": "Pool is paused.";
        },
        {
            "code": 6004;
            "name": "DurationTooShort";
            "msg": "Duration cannot be shorter than one day.";
        },
        {
            "code": 6005;
            "name": "FunderAlreadyAuthorized";
            "msg": "Provided funder is already authorized to fund.";
        },
        {
            "code": 6006;
            "name": "MaxFunders";
            "msg": "Maximum funders already authorized.";
        },
        {
            "code": 6007;
            "name": "CannotDeauthorizePoolAuthority";
            "msg": "Cannot deauthorize the primary pool authority.";
        },
        {
            "code": 6008;
            "name": "CannotDeauthorizeMissingAuthority";
            "msg": "Authority not found for deauthorization.";
        },
        {
            "code": 6009;
            "name": "MathOverflow";
            "msg": "Math operation overflow";
        }
    ];
};

type PoolState = IdlAccounts<Farming>["pool"];

declare function chunkedGetMultipleAccountInfos(connection: Connection, pks: PublicKey[], chunkSize?: number): Promise<_solana_web3_js.AccountInfo<Buffer<ArrayBufferLike>>[]>;
declare class PoolFarmImpl {
    address: PublicKey;
    private program;
    private eventParser;
    poolState: PoolState;
    private opt;
    private constructor();
    static create(connection: Connection, farm: PublicKey, opt?: {
        cluster?: Cluster;
    }): Promise<PoolFarmImpl>;
    static createMultiple(connection: Connection, farmList: Array<PublicKey>, opt?: {
        cluster?: Cluster;
    }): Promise<PoolFarmImpl[]>;
    static getFarmAddressesByPoolAddress(poolAddress: PublicKey, cluster?: Cluster): Promise<{
        farmAddress: PublicKey;
        APY: string;
        expired: boolean;
    }[]>;
    static getFarmAddressesByLp(lpAddress: PublicKey, cluster?: Cluster): Promise<{
        farmAddress: PublicKey;
        APY: string;
        expired: boolean;
    }[]>;
    static getUserBalances(connection: Connection, owner: PublicKey, farmMints: Array<PublicKey>): Promise<Map<string, BN>>;
    static claimAll(connection: Connection, owner: PublicKey, farmMints: Array<PublicKey>, opt?: {
        cluster?: Cluster;
    }): Promise<Transaction[]>;
    getUserBalance(owner: PublicKey): Promise<BN>;
    getUserPda(owner: PublicKey): PublicKey;
    getUserState(owner: PublicKey): Promise<{
        pool: PublicKey;
        owner: PublicKey;
        rewardAPerTokenComplete: BN;
        rewardBPerTokenComplete: BN;
        rewardAPerTokenPending: BN;
        rewardBPerTokenPending: BN;
        balanceStaked: BN;
        nonce: number;
    }>;
    private createUserInstruction;
    deposit(owner: PublicKey, amount: BN): Promise<Transaction>;
    withdraw(owner: PublicKey, amount: BN): Promise<Transaction>;
    private claimMethodBuilder;
    claim(owner: PublicKey): Promise<Transaction>;
    static getClaimableRewards(owner: PublicKey, farmMints: Array<PublicKey>, connection: Connection): Promise<Map<string, {
        rewardA: BN;
        rewardB: BN;
    }>>;
}

export { PoolFarmImpl, chunkedGetMultipleAccountInfos };
