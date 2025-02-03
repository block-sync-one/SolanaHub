import { StakePool } from "./stake-pool.model";
import { Validator } from "./stakewiz.model"


export interface StakePositions {
  native: StakeAccount[];
  liquid: LiquidStakeToken[];
}
export interface ProInsights {
  valueAccrued?: StakeRewards[]
  source: string
}
interface StakeRewards {
  epoch: number
  effective_time: string
  reward_amount: number
  projectedValue: number
}
export interface LiquidStakeToken extends StakePool{
  chainId: number
  address: string
  symbol: string
  mint: string
  name: string
  decimals: number
  logoURI: string
  balance: any
  price: number
  value: number
  frozen: boolean
  source: string
  type: 'spl' | 'SanctumSplMulti' | 'SanctumSpl'
  apy: number
  exchangeRate: number
  poolPublicKey: string
  tokenMint: string
  state: string
  proInsights?: ProInsights
}


export interface StakeAccount {
  authorities: {
    staker: string,
    withdrawer: string,
  },
  amount: number
  role: Array<string>
  state: string
  source: string
  voter: string
  deactivationEpoch?: number
  active_stake: number
  inactive_stake: number
  delegated_stake_amount: number
  rentExemptReserve: number
  balance: number
  address: string
  activation_epoch: number
  stake_type: number
  symbol: string
  validator?: Validator
  exchangeRate: number
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