import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { InputComponent } from '../input/input.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Token, WalletExtended } from 'src/app/models';
import { JupToken } from 'src/app/models';
import { JupRoute } from 'src/app/models';
import { Observable } from 'rxjs';
import { SolanaHelpersService } from 'src/app/services';
import { StakeService } from '../../stake.service';
import { UtilService } from 'src/app/services';
import { TxInterceptorService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { JupStoreService } from 'src/app/services';
import { UnstakePathComponent } from './unstake-path/unstake-path.component';
import { IonButton, IonLabel } from '@ionic/angular/standalone';
import { FreemiumModule } from '@app/shared/layouts/freemium/freemium.module';
@Component({
  selector: 'unstake-form',
  templateUrl: './unstake-form.component.html',
  styleUrls: ['./unstake-form.component.scss'],
  standalone: true,
  imports: [IonLabel, 
    InputComponent,
    ReactiveFormsModule,
    UnstakePathComponent,
    IonButton,
    FreemiumModule
  ]
})
export class UnstakeFormComponent  implements OnInit {
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

  public wallet$: Observable<WalletExtended> = this._shs.walletExtended$
  public tokenOut: Token = {
    "address": "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
    "chainId": 101,
    "decimals": 9,
    "name": "SolanaHub Staked SOL",
    "symbol": "hubSOL",
    "logoURI": "assets/images/hubSOL.svg",
  }
  public tokenIn: Token = {
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
  public unstakeForm: FormGroup;
  ngOnInit() {
    this.unstakeForm = this._fb.group({
      inputToken: [this.tokenOut, [Validators.required]],
      outputToken: [this.tokenIn, [Validators.required]],
      inputAmount: ['', [Validators.required]],
      slippage: [50, [Validators.required]]
    })

    this.unstakeForm.valueChanges.subscribe(async (values: { inputToken, outputToken, inputAmount, slippage }) => {

      this.calcBestRoute()
      if (!values.inputAmount) {
        this.bestRoute.set(null)
      }
    })

  }

  async calcBestRoute() {
    const { inputToken, outputToken, inputAmount, slippage } = this.unstakeForm.value
    this.getInTokenPrice.set(null)
    this.getOutTokenPrice.set(null)
    this.bestRoute.set(null)
    // const inputAmount = values.inputAmount
    if (this.unstakeForm.valid) {
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

  public unstakePath = signal('instant')
  public getOutValue() {
    const { inputToken } = this.unstakeForm.value

    // setTimeout(() => {
    return inputToken.type === 'native' 
    ? inputToken.balance / this.hubSOLExchangeRate() 
    : this.bestRoute()?.outAmount
    // });
  }
  selectUnstakePath(unstakePath: 'instant' | 'slow') {
    
    this.unstakePath.set(unstakePath)
    this.unstakeForm.controls['validatorVoteIdentity'].reset()
    this.unstakeForm.controls['stakingPath'].setValue(unstakePath)
    // if (stakePath === 'native') {
    //   this.stakeForm.controls['validatorVoteIdentity'].addValidators(Validators.required)
    //   this._removeStakePoolControl()
    // }
    // if (stakePath === 'liquid') {
    //   this.stakeForm.controls['validatorVoteIdentity'].removeValidators(Validators.required);
    //   this._addStakePoolControl()
    // }
    
  }
  submitUnstake() {
    console.log('submitUnstake')
  }

}
