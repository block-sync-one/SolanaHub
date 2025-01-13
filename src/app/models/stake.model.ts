import { Validator } from "./stakewiz.model"


// export interface Stake {
//     type: 'native' | 'liquid'
//     lockedDue?: string
//     locked?: boolean
//     address?: string
//     validatorName?: string
//     shortAddress?: string
//     balance: number
//     value: number
//     state: 'activating' | 'deactivating' | 'active' | 'inactive' | 'directStake' | 'delegationStrategyPool'
//     apy: number
//     logoURI: string
//     symbol: string
// }
export interface StakeAccountShyft{
    _lamports: number
    meta: {
      lockup: {
        epoch: string
        custodian: string
        unix_timestamp: string
      }
      authorized: {
        staker: string
        withdrawer: string
      }
      rentExemptReserve: string
    }
    stake: {
      delegation: {
        stake: string
        voter: string
        activationEpoch: string
        deactivationEpoch: string
        warmupCooldownRate: number
      }
      creditsObserved: string
    }
    pubkey: string
  }
  export interface Stake2{
    amount: number
    role: Array<string>
    status: string
    type: string
    voter: string
    deactivationEpoch: number
    active_stake_amount: number
    delegated_stake_amount: number
    sol_balance: number
    total_reward: string
    stake_account: string
    activation_epoch: number
    stake_type: number
  }
  
export interface DirectStake {

    mSOL?: {
        amount: string
        tokenOwner: string
        validatorVoteAccount: string
        validator?: Validator
    }
    vSOL?: {
      amount: string
      tokenOwner: string
      validatorVoteAccount: string
      validator?: Validator
  }
    bSOL?: Array<{
        amount: number
        tokenOwner: string
        validatorVoteAccount: string
        validator?: Validator
    }>
    lastCache?: string

}