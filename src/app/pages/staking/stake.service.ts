import { Injectable, signal, WritableSignal } from '@angular/core';
import { StakePool } from 'src/app/models/stake-pool.model';
import { LAMPORTS_PER_SOL, PublicKey, StakeProgram } from '@solana/web3.js';
import { BehaviorSubject, filter, map, switchMap, from } from 'rxjs';
import { Validator } from 'src/app/models/stakewiz.model';
import { NativeStakeService, PortfolioService, SolanaHelpersService, TxInterceptorService, UtilService } from 'src/app/services';
import { HttpFetchService } from 'src/app/services/http-fetch.service';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { ProInsights, LiquidStakeToken, StakeAccount, StakePositions } from '@app/models';




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
            ...positions,
            ...(nativePositionExtended?.length > 0 && { native: nativePositionExtended }),
            ...(positions?.liquid?.length > 0 && { liquid: positions.liquid })
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
    private _util: UtilService,
    private _nss: NativeStakeService,
  ) {
   
    this._nss._triggerUpdate.subscribe(() => {
      this.updateStakePositions(this._shs.getCurrentWallet().publicKey.toString(), 'native')
    })
    this._lss._triggerUpdate.subscribe(({type}) => {
      if(type === 'full'){
        this.updateStakePositions(this._shs.getCurrentWallet().publicKey.toString())
      }else{
        this.updateStakePositions(this._shs.getCurrentWallet().publicKey.toString(), 'liquid')
      }
    })
    this._shs.walletExtended$.subscribe(wallet => {
      if(wallet){
        this.updateStakePositions(wallet.publicKey.toString())
      }
    })
  }

  // Helper method to update state
  private setState(newState: Partial<typeof this._state$.value>) {
    this._state$.next({
      ...this._state$.value,
      ...newState
    });
  }

  public async updateStakePositions(walletAddress: string, source?: string): Promise<StakePositions | null> {
    try {
      this.setState({ loading: true, error: null });
      
      const response = await this._httpFetchService.get<StakePositions>(
        `/api/portfolio/get-stake?address=${walletAddress}&source=${source}`
      );
      
      // Merge with existing positions when updating specific source
      const currentPositions = this._state$.value.positions;
      const mergedPositions = source ? {
        native: source === 'native' ? response.native : currentPositions?.native ?? [],
        liquid: source === 'liquid' ? response.liquid : currentPositions?.liquid ?? []
      } : response;

      this.setState({ 
        positions: mergedPositions,
        loading: false 
      });
      return mergedPositions
    } catch (error) {
      console.error('Error updating stake positions', error);
      this.setState({ 
        error: 'Failed to update stake positions',
        loading: false 
      });
      return null
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

  public async getProInsights(position: StakeAccount | LiquidStakeToken): Promise<ProInsights> {
    try {
      let data = {}
      if(position.source === "native") {
        data = {
          account_address: position.address,
          source: position.source,
          activation_epoch: position['activation_epoch']
        }
      } else {
        data = {
          source: position.source,
          lst: position
        }
      }
      const res = await fetch(`${this._lss.restAPI}/api/portfolio/get-stake-pro`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      const insights = await res.json()
      return insights
    } catch (error) {
      console.error('Error fetching pro insights', error);
      throw error;
    }
  }


  public hubSOLpool: WritableSignal<StakePool> = this._lss.hubSOLpool;

}

