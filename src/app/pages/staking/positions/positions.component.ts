import { Component, Input, OnChanges, OnInit, WritableSignal, computed, effect, signal } from '@angular/core';
import { JupStoreService, PortfolioService, SolanaHelpersService, UtilService } from 'src/app/services';
import {
  IonButton, IonImg
} from '@ionic/angular/standalone';
import { StakeComponent } from './stake/stake.component';
import { Stake, StakePool, Token, Validator, WalletExtended } from 'src/app/models';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, Subject, map, switchMap } from 'rxjs';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';

@Component({
  selector: 'stake-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss'],
  standalone: true,
  imports: [IonButton, StakeComponent, IonImg, JsonPipe, AsyncPipe]
})
export class PositionsComponent implements OnInit, OnChanges {
  @Input() stakePools: WritableSignal<StakePool[]> = signal([])
  public stakePosition$ = new Subject()
  public stakePosButton = [
    {
      label: 'native',
      imgUrl: 'assets/images/lock-icon.svg'
    },
    {
      label: 'liquid',
      imgUrl: 'assets/images/droplets-icon.svg'
    }
  ]
  public stakeAccounts = this._portfolio.staking
  // private _LSTs = ['msol', 'bsol', 'jitosol']
  public nativeStake = computed(() => this.stakeAccounts() ? this.stakeAccounts() : null)
  public liquidStake = signal(null);
  public positionGroup = signal('native');
  public stakePosition = computed(() => {
    if(this._portfolio.staking())
      if(this.positionGroup() === 'native'){
        return this.nativeStake()
      }else{
        const stakePoolsSymbols = this.stakePools().map(p => p.tokenSymbol.toLowerCase())
        
        const LSTs = this._portfolio.tokens().filter(t => stakePoolsSymbols.includes(t.symbol.toLowerCase())).filter(t => t.price > 1)
        return this._structLiquidPos(LSTs)
      }
  })

  

  _structLiquidPos(stake){
    return stake.map(lst => {
      const pool: StakePool = this.stakePools().find(p => p.tokenMint === lst.address)
  
      
      const stake: Stake = {
        type: 'liquid',
        address: lst.address,
        balance: Number(lst.balance),
        value: Number(lst.value),
        state: pool?.poolName === "jito" || pool?.poolName === "solblaze" || pool?.poolName === 'marinade' ? 'delegationStrategyPool' : 'directStake',
        symbol: lst?.symbol,
        imgUrl: pool?.tokenImageURL,
        // validatorName: lst[directStake[lst.symbol]] ? lst?.extraData?.validator?.name : null,
        pool: pool,
        apy: pool?.apy * 100,
        token: lst
      }

      return stake
    });
  }

  constructor(
    private _portfolio: PortfolioService,
  ) {
 
  }
  ngOnInit(): void {
    // this.stakePosition.set(this.nativeStake)
    // const { publicKey } = this._shs.getCurrentWallet()
    // const directStake = await this._lss.getDirectStake(publicKey.toBase58())
  }
  ngOnChanges(changes) {
  }
  setPositionGroup(group: string) {
    this.positionGroup.set(group)
  }


}
