import {Component, OnInit, signal, WritableSignal} from '@angular/core';
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
import {JupRoute, JupToken, Token, WalletExtended} from 'src/app/models';
import {
  ConvertPositionsService,
  SolanaHelpersService,
} from 'src/app/services';
import { PercentPipe } from '@angular/common';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box/convert-to-hub-sol-box.component';
import { InputComponent } from '../input/input.component';
import { CommonModule } from '@angular/common';
import { TokenType } from "@app/enums";

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
    ConvertToHubSOLBoxComponent,
    ReactiveFormsModule,
    InputComponent,
    PercentPipe
  ]
})
export class StakeFormComponent implements OnInit {
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
    private _shs: SolanaHelpersService,
    private _fb: FormBuilder,
    private _convertPositionService: ConvertPositionsService
  ) {
    this._convertPositionService.fetchHubSolExchangeRage();
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
      if (values.inputToken.source == TokenType.NATIVE) {
        this.formState.set('Stake')
      } else {
        this.formState.set('Swap')
      }
    })
  }

  async calcBestRoute() {
    const {inputToken, outputToken, inputAmount, slippage} = this.tokenSwapForm.value
    this.getInTokenPrice.set(null)
    this.getOutTokenPrice.set(null)
    this.bestRoute.set(null)

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

  public async submitForm() {
    const { inputToken, outputToken } = this.tokenSwapForm.value
    this.formState.set('preparing transaction');

    if (inputToken.source == TokenType.NATIVE) {
      const {address} = this.tokenSwapForm.value.inputToken
      await this._convertPositionService.submitDepositAccount(address)
    } else {
      this.loading.set(true);
      await this._convertPositionService.submitSwap({route: {...this.bestRoute()}, outputToken})
      this.loading.set(false)
    }
    this.formState.set('Stake')
  }
}
