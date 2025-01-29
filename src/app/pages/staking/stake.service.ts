import { Injectable, signal, WritableSignal } from '@angular/core';
import { StakePool } from 'src/app/models/stake-pool.model';
import { LAMPORTS_PER_SOL, PublicKey, StakeProgram } from '@solana/web3.js';
import { BehaviorSubject, filter, map, switchMap, from } from 'rxjs';
import { Validator } from 'src/app/models/stakewiz.model';
import { NativeStakeService, PortfolioService, SolanaHelpersService, TxInterceptorService, UtilService } from 'src/app/services';
import { HttpFetchService } from 'src/app/services/http-fetch.service';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';


export interface LiquidStakeToken {
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
  frozen?: boolean
  type: string
  apy?: number
  exchangeRate: number
  poolPublicKey?: string
  tokenMint?: string
  state?: string
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
  type: string
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

export interface StakePositions {
  native: StakeAccount[];
  liquid: LiquidStakeToken[];
}
export interface ProInsights {
  stakeRewards?: StakeRewards[]
  type: string
}
interface StakeRewards {
  epoch: number
  effective_slot: number
  effective_time_unix: number
  effective_time: string
  reward_amount: number
  change_percentage: number
  post_balance: number
  commission: number
}
@Injectable({
  providedIn: 'root'
})
export class StakeService {
  // State management
  private readonly _state$ = new BehaviorSubject<{
    positions: StakePositions | null;
    loading: boolean;
    error: string | null;
  }>({
    positions: null,
    loading: false,
    error: null
  });

  // Selectors
  private readonly state$ = this._state$.asObservable();
  public readonly loading$ = this.state$.pipe(map(state => state.loading));
  public readonly error$ = this.state$.pipe(map(state => state.error));

  // Enhanced positions stream with validator data
  public readonly stakePositions$ = this.state$.pipe(
    map(state => state.positions),
    filter((positions): positions is NonNullable<typeof positions> => positions !== null),
    switchMap(positions => {
      // Convert the Promise to an Observable
      return from(this._shs.getValidatorsList()).pipe(
        map(validators => {
          const nativePositionExtended = positions.native.map(position => {
            const { addrShort } = this._util.addrUtil(position.address);
            const validator = validators.find(v => v.vote_identity === position.voter);
            return { ...position, validator, shortAddress: addrShort };
          });

          return {
            native: nativePositionExtended,
            liquid: positions.liquid
          };
        })
      );
    })
  );

  public readonly activePositions$ = this.stakePositions$.pipe(
    filter((positions): positions is NonNullable<typeof positions> => positions !== null),
    map(positions => [
      ...positions.native.filter(p => p.state === 'active'),
      ...positions.liquid
    ])
  );

  public readonly nativePositions$ = this.stakePositions$.pipe(
    map(positions => positions?.native)
  );

  public readonly liquidPositions$ = this.stakePositions$.pipe(
    map(positions => positions?.liquid)
  );


  constructor(
    private _txi: TxInterceptorService,
    private _lss: LiquidStakeService,
    private _shs: SolanaHelpersService,
    private _httpFetchService: HttpFetchService,
    private _util: UtilService
  ) {
   

  }

  // Helper method to update state
  private setState(newState: Partial<typeof this._state$.value>) {
    this._state$.next({
      ...this._state$.value,
      ...newState
    });
  }

  public async updateStakePositions(walletAddress: string): Promise<void> {
    try {
      this.setState({ loading: true, error: null });
      
      const response = await this._httpFetchService.get<StakePositions>(
        `/api/portfolio/get-stake?address=${walletAddress}`
      );
      
      this.setState({ 
        positions: response,
        loading: false 
      });

    } catch (error) {
      console.error('Error updating stake positions', error);
      this.setState({ 
        error: 'Failed to update stake positions',
        loading: false 
      });
    }
  }


  public async withdrawExcessiveBalance(position: StakeAccount): Promise<string | null> {
    try {
      const walletOwner = new PublicKey(position.authorities.staker);
      const withdrawTx = StakeProgram.withdraw({
        stakePubkey: new PublicKey(position.address),
        authorizedPubkey: walletOwner,
        toPubkey: walletOwner,
        lamports: position.inactive_stake * LAMPORTS_PER_SOL,
      });
      
      return await this._txi.sendTx([...withdrawTx.instructions], walletOwner);
    } catch (error) {
      console.error('Error withdrawing excessive balance', error);
      return null;
    }
  }

  public async getProInsights(position: StakeAccount): Promise<ProInsights> {
    try {
      return await this._httpFetchService.get<ProInsights>(
        `/api/portfolio/get-stake-pro?account_address=${position.address}&type=${position.type}&activation_epoch=${position.activation_epoch}`
      );
    } catch (error) {
      console.error('Error fetching pro insights', error);
      throw error;
    }
  }


  public hubSOLpool: WritableSignal<StakePool> = this._lss.hubSOLpool;

}

