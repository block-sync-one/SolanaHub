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
import { FreemiumService } from '@app/shared/layouts/freemium';
import { PremiumActions } from '@app/enums';

interface UnstakeFormData {
  inputToken: Token;
  outputToken: Token;
  tokenPool: any; // Replace with proper type
  inputAmount: string;
  slippage: number;
}

@Component({
  selector: 'unstake-form',
  templateUrl: './unstake-form.component.html',
  styleUrls: ['./unstake-form.component.scss'],
  standalone: true,
  imports: [IonLabel, 
    InputComponent,
    ReactiveFormsModule,
    UnstakePathComponent,
    IonButton
  ]
})
export class UnstakeFormComponent implements OnInit {
  // Form
  public unstakeForm: FormGroup;
  public platformFeeInSOL = signal(0);

  // Tokens
  public wallet$: Observable<WalletExtended> = this._shs.walletExtended$;
  public readonly tokenOut: Token = {
    address: "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
    chainId: 101,
    decimals: 9,
    name: "SolanaHub Staked SOL",
    symbol: "hubSOL",
    logoURI: "assets/images/hubSOL.svg",
  };
  public readonly tokenIn: Token = {
    address: "So11111111111111111111111111111111111111112",
    decimals: 9,
    chainId: 101,
    name: "SOL",
    symbol: "SOL",
    logoURI: "assets/images/sol.svg",
    balance: null,
    type: 'liquid'
  };

  // Signals
  public loading = signal(false);
  public unstakeState = signal<'swap' | 'unstake' | 'preparing transaction' | 'executing Unstake' | 'Unstake'>('swap');
  public unstakePath = signal<'instant' | 'slow'>('instant');
  public jupTokens = signal<JupToken[]>(null);
  public slippage = signal(0.5);
  public swapReceive = signal(0);
  public slowUnstakeReceive = signal(0);
  public lstExchangeRate = signal(null);
  public bestRoute: WritableSignal<JupRoute> = signal(null);

  constructor(
    private _shs: SolanaHelpersService,
    private _fb: FormBuilder,
    private _jupStore: JupStoreService,
    private _util: UtilService,
    private _lss: LiquidStakeService,
    private _stakeService: StakeService,
    private _txi: TxInterceptorService,
    private _freemiumService: FreemiumService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  private initializeForm(): void {
    this.unstakeForm = this._fb.group({
      inputToken: [this.tokenOut, [Validators.required]],
      outputToken: [this.tokenIn, [Validators.required]],
      tokenPool: [null],
      inputAmount: ['', [Validators.required]],
      slippage: [50, [Validators.required]]
    });
  }

  private async setupFormSubscriptions(): Promise<void> {
    // Initialize token pool
    const sp = await this._lss.getStakePoolList();
    const tokenPool = sp.find(s => s.tokenMint === this.unstakeForm.get('inputToken').value.address);
    this.unstakeForm.patchValue({ tokenPool }, { emitEvent: false });

    // Subscribe to input token changes
    this.unstakeForm.get('inputToken').valueChanges.subscribe(async (inputToken) => {
      await this._setPool(inputToken);
    });

    // Subscribe to form changes for route calculations
    this.unstakeForm.valueChanges.subscribe(async (values: UnstakeFormData) => {
      if (values.inputAmount) {
          this.calcSwapRoute(),
          this.calcUnstakeRoute()
      } 
      if (!values.inputAmount) {
        this.bestRoute.set(null);
      }
    });
  }

  public async calcSwapRoute(): Promise<void> {
    if (!this.unstakeForm.valid) return;

    try {
      this.loading.set(true);
      const { inputToken, outputToken, inputAmount, slippage } = this.unstakeForm.value;
      
      const route = await this._jupStore.computeBestRoute(inputAmount, inputToken, outputToken, slippage);
      
      const outAmount = (Number(route.outAmount) / 10 ** outputToken.decimals).toString();
      const minOutAmount = (Number(route.otherAmountThreshold) / 10 ** outputToken.decimals).toString();
      
      route.outAmount = outAmount;
      route.otherAmountThreshold = minOutAmount;
      console.log(route)
      this.swapReceive.set(Number(minOutAmount));
      this.bestRoute.set(route)
      console.log(this.loading());
      
    } finally {
      this.loading.set(false);
    }
  }

  private async _setPool(inputToken: Token){
    const sp = await this._lss.getStakePoolList();
    const tokenPool = sp.find(s => s.tokenMint === inputToken.address);
    this.unstakeForm.patchValue({ tokenPool }, { emitEvent: false });
  }
  public async calcUnstakeRoute(): Promise<void> {
    const { inputAmount, tokenPool } = this.unstakeForm.value;
    const unstakeReceive = Number(inputAmount * tokenPool.exchangeRate);
    this.slowUnstakeReceive.set(unstakeReceive);
    this.platformFeeInSOL.set(this._freemiumService.calculatePlatformFeeInSOL(PremiumActions.UNSTAKE_LST, unstakeReceive));
  }

  public selectUnstakePath(path: 'instant' | 'slow'): void {
    this.unstakePath.set(path);
    this.unstakeState.set(path === 'instant' ? 'swap' : 'unstake');
  }

  submitForm(){
    this.unstakeState.set('preparing transaction');
    if (this.unstakePath() === 'instant') {
      this.submitSwap()
    } else {
      this.submitUnstake()
    }
  }
  private async submitUnstake(): Promise<void> {
    try {
      const { inputAmount, tokenPool } = this.unstakeForm.value;
      console.log(tokenPool, inputAmount)
      const signature = await this._lss.unstake(tokenPool, inputAmount);

      this.unstakeState.set('Unstake');
    } catch (error) {
      console.error('Unstake failed:', error);
      this.unstakeState.set('unstake');
    }
  }
  
  private async submitSwap(): Promise<void> {
    try {


      const route = { ...this.bestRoute() };
      if (!route) {
        throw new Error('No valid swap route found');
      }

      // Calculate amounts using single-line operations
      const { decimals } = this.unstakeForm.value.outputToken;
      const multiplier = Math.pow(10, decimals);
      
      route.outAmount = (Number(route.outAmount) * multiplier).toFixed(0);
      route.otherAmountThreshold = (Number(route.otherAmountThreshold) * multiplier).toFixed(0);

      const tx = await this._jupStore.swapTx(route);
      await this._txi.sendMultipleTxn([tx]);
      
      this.unstakeState.set('Unstake');
    } catch (error) {
      this.unstakeState.set('Unstake');
      console.error('Swap failed:', error);
      throw error; // Re-throw to be handled by caller if needed
    } finally {
      // Reset state after a delay
      setTimeout(() => this.unstakeState.set('Unstake'), 2000);
    }
  }
}
