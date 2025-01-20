import { Component, effect, OnInit, signal, WritableSignal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel, IonImg, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ChipComponent } from "../../../shared/components/chip/chip.component";
import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box/convert-to-hub-sol-box.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from './input/input.component';
import { LiquidStakeToken, StakeAccount, StakeService } from '../stake.service';
import { filter, map, Observable } from 'rxjs';
import { JupRoute, JupToken, Token, Validator, WalletExtended } from 'src/app/models';
import { JupStoreService, PortfolioService, SolanaHelpersService, UtilService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { PercentPipe } from '@angular/common';

export interface StakeAbleAsset {
  logoURI: string;
  symbol: string;
  balance: string;
  address: string;
  mint?: string;
  validator?: Validator;
  type: 'token' | 'stakeAccount';
}
@Component({
  selector: 'stake-form',
  templateUrl: './stake-form.component.html',
  styleUrls: ['./stake-form.component.scss'],
  standalone: true,
  imports: [IonIcon, IonButton, IonImg,
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
export class StakeFormComponent implements OnInit {

  // constructor(
  //   private _stakeService: StakeService,
  //   private _jupStoreService: JupStoreService,
  //   private _shs: SolanaHelpersService,
  //   private _lss: LiquidStakeService
  // ) {

  // }
  // public activePositions = this._stakeService.stakePositions$
  // public solPrice = this._jupStoreService.solPrice;
  // public solHolding = {
  //   logoURI: 'assets/images/sol.svg',
  //   symbol: 'SOL',
  //   balance: null,
  //   price: null,
  //   value: null,
  //   address: 'So11111111111111111111111111111111111111112',
  //   mint: 'So11111111111111111111111111111111111111112',
  //   type: 'liquid',
  //   chainId: 1,
  //   name: 'Solana',
  //   decimals: 9,
  //   exchangeRate: 1,
  //   poolPublicKey: '',
  //   tokenMint: '',
  // }
  // public hubSOLToken = {
  //   logoURI: 'assets/images/hubSOL.svg',
  //   symbol: 'hubSOL',
  //   balance: null,
  //   price: null,
  //   value: null,
  //   address: 'HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX',
  //   mint: 'HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX',
  //   type: 'liquid',
  //   chainId: 1,
  //   name: 'Solana',
  //   decimals: 9,
  //   exchangeRate: 1,
  //   poolPublicKey: '',
  //   tokenMint: '',
  //   apy: null,
  // }

  // public tokenOut: Token = {
  //   "address": "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
  //   "chainId": 101,
  //   "decimals": 9,
  //   "name": "SolanaHub Staked SOL",
  //   "symbol": "hubSOL",
  //   "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  // }
  // public tokenIn: Token = {
  //   "address": "So11111111111111111111111111111111111111112",
  //   "decimals": 9,
  //   "chainId": 101,
  //   "name": "Wrapped SOL",
  //   "symbol": "SOL",
  //   "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
  // }

  
  // public stakeAbleAssets: (LiquidStakeToken | StakeAccount)[] = [];
  // public async ngOnInit(): Promise<void> {
  //   const sp = await this._lss.getStakePoolList()
  //  const {exchangeRate, poolPublicKey,tokenMint, apy} = sp.find(s => s.tokenMint === "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX")
  //  this.hubSOLToken.exchangeRate = exchangeRate
  //  this.hubSOLToken.poolPublicKey = poolPublicKey
  //  this.hubSOLToken.tokenMint = tokenMint
  //  this.hubSOLToken.apy = apy
  //   console.log(sp)
  //   this.activePositions.pipe(
  //     filter(positions => positions != null)
  //   ).subscribe(positions => {

  //     const { balance } = this._shs.getCurrentWallet();
  //     this.solHolding = {
  //       logoURI: 'assets/images/sol.svg',
  //       symbol: 'SOL',
  //       balance,
  //       address: 'So11111111111111111111111111111111111111112',
  //       mint: 'So11111111111111111111111111111111111111112',
  //       type: 'liquid',
  //       chainId: 1,
  //       name: 'Solana',
  //       decimals: 9,
  //       price: this.solPrice(),
  //       value: balance * this.solPrice(),
  //       exchangeRate: 1,
  //       poolPublicKey: '',
  //       tokenMint: '',
  //     }
  //     this.stakeAbleAssets = [this.solHolding, ...positions.liquid, ...positions.native];
  //     this.stakeForm.controls['asset'].setValue(this.solHolding);
  //     console.log(this.stakeAbleAssets);

  //   })
  // }

  // public stakeForm = new FormGroup({
  //   asset: new FormControl(this.solHolding),
  //   assetOut: new FormControl(this.hubSOLToken),
  //   amount: new FormControl(0),
  //   assetType: new FormControl(null), // stake account or liquid asset(SOL/LST)
  // });

  // public unstakeForm = new FormGroup({
  //   asset: new FormControl(null),
  //   amount: new FormControl(null),
  //   assetType: new FormControl(null),
  //   unstakeType: new FormControl('instant'), // instant or delayed
  // });
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
    "logoURI": "assets/images/sol.svg"
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
    private _lss: LiquidStakeService
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
    const tokensList = await this._util.getJupTokens('all');

    this.jupTokens.set(tokensList)
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

  public swapState = signal('Swap')
  public async submitSwap(): Promise<void> {
    this.loading.set(true)
    this.swapState.set('preparing transaction');

    const route = { ...this.bestRoute() }
    const outAmount = (Number(route.outAmount) * 10 ** this.tokenSwapForm.value.outputToken.decimals).toFixed(0).toString()
    const minOutAmount = (Number(route.otherAmountThreshold) * 10 ** this.tokenSwapForm.value.outputToken.decimals).toFixed(0).toString()


    route.outAmount = outAmount
    route.otherAmountThreshold = minOutAmount

    await this._jupStore.swapTx(route);
    this.swapState.set('swap');
    this.loading.set(false)
    
  }


}
