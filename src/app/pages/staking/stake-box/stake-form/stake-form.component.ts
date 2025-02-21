import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonImg,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { JupRoute, JupToken, Token, WalletExtended } from 'src/app/models';
import {
  ConvertPositionsService,
  NativeStakeService,
  SolanaHelpersService,
} from 'src/app/services';
import { PercentPipe } from '@angular/common';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box/convert-to-hub-sol-box.component';
import { InputComponent } from '../input/input.component';
import { CommonModule } from '@angular/common';
import { TokenType } from "@app/enums";
import { StakePathComponent } from './stake-path/stake-path.component';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
@Component({
  selector: 'stake-form',
  templateUrl: './stake-form.component.html',
  styleUrls: ['./stake-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonLabel,
    ReactiveFormsModule,
    InputComponent,
    StakePathComponent
  ]
})
export class StakeFormComponent implements OnInit {
  public slowStakeReceive = signal(0)
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
    type: 'liquid'
  }
  public loading = signal(false);
  public formState = signal('Stake')
  public jupTokens = signal(null as JupToken[])
  public slippage = signal(0.5);
  public getInTokenPrice = signal(null);
  public getOutTokenPrice = signal(null);
  public hubSOLExchangeRate = this._convertPositionService.getHubSOLExchangeRate;
  public bestRoute: WritableSignal<JupRoute> = signal(null);
  public getOutValue = signal(null);

  public tokenSwapForm: FormGroup;

  constructor(
    private _nss: NativeStakeService,
    private _shs: SolanaHelpersService,
    private _fb: FormBuilder,
    private _convertPositionService: ConvertPositionsService
  ) {
    this._convertPositionService.fetchHubSolExchangeRage();
  }

  async ngOnInit() {
    this.initializeForm();
    this.subscribeToFormChanges();
  }

  private initializeForm() {
    this.tokenSwapForm = this._fb.group({
      inputToken: [this.tokenOut, [Validators.required]],
      outputToken: [this.tokenIn, [Validators.required]],
      inputAmount: ['', [Validators.required]],
      stakePath: ['liquid', [Validators.required]],
      slippage: [50, [Validators.required]]
    })
  }

  private subscribeToFormChanges() {
    this.tokenSwapForm.valueChanges.subscribe(async (values) => {
      this.calcBestRoute();

      // this.updateFormState(values);
    });
  }

  private updateFormState(values: { inputToken, inputAmount }) {
    if (!values.inputAmount) {
      this.bestRoute.set(null)
    }

    this.formState.set(values.inputToken.source === TokenType.NATIVE ? 'Stake' : 'Swap')
  }

  setStakePath(path: string) {
    this.tokenSwapForm.patchValue({ stakePath: path })
  }

  async nativeStake() {
    const { publicKey } = this._shs.getCurrentWallet()
    const lamports = this.tokenSwapForm.value.inputAmount * LAMPORTS_PER_SOL;
    const validator = this._nss.SolanaHubVoteKey
    const tx = await this._nss.stake(lamports, publicKey, validator)
    console.log('tx', tx);
  }

  async calcBestRoute() {
    const { inputToken, outputToken, inputAmount, slippage } = this.tokenSwapForm.value
    this.resetRouteData()

    if (this.tokenSwapForm.valid) {
      this.loading.set(true)
      const {
        route,
        value
      } = await this._convertPositionService.calcBestRoute(inputAmount, inputToken, outputToken, inputToken.source, slippage)
      this.bestRoute.set(route)
      this.getOutValue.set(value);
      this.loading.set(false)
    }
  }

  private resetRouteData() {
    this.getInTokenPrice.set(null)
    this.getOutTokenPrice.set(null)
    this.bestRoute.set(null)
  }

  public async submitForm() {
    const { inputToken, outputToken, stakePath } = this.tokenSwapForm.value
    this.formState.set('preparing transaction');
    if (stakePath == 'liquid') {
      await this.handleNonLiquidStake(inputToken, outputToken)
    } else {
      await this.nativeStake()
    }
    this.formState.set('Stake')
  }

  private async handleNonLiquidStake(inputToken, outputToken) {
    if (inputToken.source == TokenType.NATIVE) {
      console.log('submitDepositAccount', inputToken)
      const { address } = this.tokenSwapForm.value.inputToken
      await this._convertPositionService.submitDepositAccount(address)
    } else {
      this.loading.set(true);
      await this._convertPositionService.submitSwap({ route: { ...this.bestRoute() }, outputToken })
      this.loading.set(false)
    }
  }
}
