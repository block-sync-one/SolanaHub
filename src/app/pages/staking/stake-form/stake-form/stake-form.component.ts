import { Component, effect, OnInit, signal, WritableSignal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel, IonImg, IonButton, IonIcon } from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { JupRoute, JupToken, Token, WalletExtended } from 'src/app/models';
import { JupStoreService, SolanaHelpersService, TxInterceptorService, UtilService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { PercentPipe } from '@angular/common';
import { StakeService } from '../../stake.service';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box/convert-to-hub-sol-box.component';
import { InputComponent } from '../input/input.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'stake-form',
  templateUrl: './stake-form.component.html',
  styleUrls: ['./stake-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonIcon, 
    IonButton, 
    IonImg,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    ChipComponent,
    IonSkeletonText,
    ConvertToHubSOLBoxComponent,
    ReactiveFormsModule,
    InputComponent,
    PercentPipe
  ]
})
export class StakeFormComponent  implements OnInit {

  public wallet$: Observable<WalletExtended> = this._shs.walletExtended$
  public tokenIn: Token = {
    "address": "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
    "chainId": 101,
    "decimals": 9,
    "name": "SolanaHub Staked SOL",
    "symbol": "hubSOL",
    "logoURI": "assets/images/hubSOL.svg",
  }
  public tokenOut: Token = {
    "address": "So11111111111111111111111111111111111111112",
    "decimals": 9,
    "chainId": 101,
    "name": "SOL",
    "symbol": "SOL",
    "logoURI": "assets/images/sol.svg",
     balance: null,
    type: 'liquid'
  }
  public loading = signal(false);

  public jupTokens = signal(null as JupToken[])
  public slippage = signal(0.5);
  public getInTokenPrice = signal(null);
  public getOutTokenPrice = signal(null);
  public hubSOLApy = signal(null);
  public hubSOLExchangeRate = signal(null);
  public bestRoute: WritableSignal<JupRoute> = signal(null);
  public tokenSwapForm: FormGroup;
  constructor(
    private _shs: SolanaHelpersService,
    private _fb: FormBuilder,
    private _jupStore: JupStoreService,
    private _util: UtilService,
    private _lss: LiquidStakeService,
    private _stakeService: StakeService,
    private _txi: TxInterceptorService
  ) {
    this._lss.getStakePoolList().then(sp => {
      const {apy, exchangeRate} = sp.find(s => s.tokenMint === "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX")
      this.hubSOLApy.set(apy)
      this.hubSOLExchangeRate.set(exchangeRate)
    })
  }



  async ngOnInit() {
  
    this.tokenSwapForm = this._fb.group({
      inputToken: [this.tokenOut, [Validators.required]],
      outputToken: [this.tokenIn, [Validators.required]],
      inputAmount: ['', [Validators.required]],
      slippage: [50, [Validators.required]]
    })

    this.tokenSwapForm.valueChanges.subscribe(async (values: { inputToken, outputToken, inputAmount, slippage }) => {

      this.calcBestRoute()
      if (!values.inputAmount) {
        this.bestRoute.set(null)
      }
    })

  }

  async calcBestRoute() {
    const { inputToken, outputToken, inputAmount, slippage } = this.tokenSwapForm.value
    this.getInTokenPrice.set(null)
    this.getOutTokenPrice.set(null)
    this.bestRoute.set(null)
    // const inputAmount = values.inputAmount
    if (this.tokenSwapForm.valid) {
      this.loading.set(true)
      const route = await this._jupStore.computeBestRoute(inputAmount, inputToken, outputToken, slippage)
      const outAmount = (Number(route.outAmount) / 10 ** outputToken.decimals).toString()
      const minOutAmount = (Number(route.otherAmountThreshold) / 10 ** outputToken.decimals).toString()


      route.outAmount = outAmount
      route.otherAmountThreshold = minOutAmount

      // this._getSelectedTokenPrice(values, route.outAmount)


      //  this.formControl.patchValue(definitelyValidValue);
      this.bestRoute.set(route)
      //  const minimumReceived = Number(route.outAmount) / 10 **  values.outputToken.decimals
      //  this.toReceive.set(minimumReceived)
      this.loading.set(false)
      // console.log(this.bestRoute());

    }
  }

  public getOutValue() {
    const { inputToken } = this.tokenSwapForm.value

    // setTimeout(() => {
    return inputToken.type === 'native' 
    ? inputToken.balance / this.hubSOLExchangeRate() 
    : this.bestRoute()?.outAmount
    // });
  }
  public swapState = signal('Stake')
  public async submitSwap(): Promise<void> {
    try {
      this.loading.set(true);
      this.swapState.set('preparing transaction');

      const route = { ...this.bestRoute() };
      if (!route) {
        throw new Error('No valid swap route found');
      }

      // Calculate amounts using single-line operations
      const { decimals } = this.tokenSwapForm.value.outputToken;
      const multiplier = Math.pow(10, decimals);
      
      route.outAmount = (Number(route.outAmount) * multiplier).toFixed(0);
      route.otherAmountThreshold = (Number(route.otherAmountThreshold) * multiplier).toFixed(0);

      const tx = await this._jupStore.swapTx(route);
      await this._txi.sendMultipleTxn([tx]);
      
      this.swapState.set('Stake');
    } catch (error) {
      this.swapState.set('Stake');
      console.error('Swap failed:', error);
      throw error; // Re-throw to be handled by caller if needed
    } finally {
      this.loading.set(false);
      // Reset state after a delay
      setTimeout(() => this.swapState.set('Stake'), 2000);
    }
  }
}
