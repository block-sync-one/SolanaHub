import { Component, OnInit, signal, WritableSignal, computed, effect, Input, SimpleChanges } from '@angular/core';
import { InputComponent } from '../input/input.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LiquidStakeToken, StakeAccount, Token, WalletExtended } from 'src/app/models';
import { JupToken } from 'src/app/models';
import { JupRoute } from 'src/app/models';
import { Observable, take, takeLast } from 'rxjs';
import { NativeStakeService, SolanaHelpersService } from 'src/app/services';
import { StakeService } from '../../stake.service';
import { UtilService } from 'src/app/services';
import { TxInterceptorService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { JupStoreService } from 'src/app/services';
import { UnstakePathComponent } from './unstake-path/unstake-path.component';
import { IonButton, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { FreemiumService } from '@app/shared/layouts/freemium';
import { PremiumActions } from '@app/enums';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { SlowUnstakeWizardComponent } from './slow-unstake-wizard/slow-unstake-wizard.component';
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
    IonButton,
    SlowUnstakeWizardComponent
  ]
})
export class UnstakeFormComponent implements OnInit {
  @Input() manualUnstakeLST: LiquidStakeToken;
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
  public unstakeState = signal<'swap' | 'unstake' | 'preparing transaction' | 'Deactivate account' | 'Unstake'>('swap');
  public unstakePath = signal<'instant' | 'slow'>('instant');
  public jupTokens = signal<JupToken[]>(null);
  public slippage = signal(0.5);
  public swapReceive = signal(0);
  public slowUnstakeReceive = signal(0);
  public lstExchangeRate = signal(null);
  public bestRoute: WritableSignal<JupRoute> = signal(null);
  public unstakeWizard: WritableSignal<string> = signal(null)// computed(() => this._txi.txState() === 'signed' ? 'prep-account' : 'account-ready');

  public stakePositionToUnstake: StakeAccount = null;
  public counter = 0;
  constructor(
    private _shs: SolanaHelpersService,
    private _fb: FormBuilder,
    private _jupStore: JupStoreService,
    private _util: UtilService,
    private _lss: LiquidStakeService,
    private _stakeService: StakeService,
    private _txi: TxInterceptorService,
    private _freemiumService: FreemiumService,
    private _nss: NativeStakeService,
  ) {
    addIcons({ arrowForwardOutline });
    effect(() => {

      if (this._txi.txState() === 'signed' && this._lss.unstakeAccount() && this.unstakeWizard() !== 'account-ready') {
        this.unstakeWizard.set('prep-account');
      }

    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }
ngOnChanges(changes: SimpleChanges): void {
  //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
  //Add '${implements OnChanges}' to the class.

  if(changes['manualUnstakeLST'] && this.manualUnstakeLST){

    this.initializeForm();
    this.setupFormSubscriptions();
    // aggregate incoming manualUnstakeLST into out token 
    setTimeout(() => {
      this.unstakeForm.get('inputToken').setValue(this.manualUnstakeLST);
    });
    
  }
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

      this.swapReceive.set(Number(minOutAmount));
      this.bestRoute.set(route)

    } finally {
      this.loading.set(false);
    }
  }

  private async _setPool(inputToken: Token) {
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
    //reset unstake account
    this._lss.unstakeAccount.set(null)
    this.unstakePath.set(path);
    this.unstakeState.set(path === 'instant' ? 'swap' : 'unstake');
  }

  async submitForm() {
    this.unstakeState.set('preparing transaction');
    if (this.unstakePath() === 'instant') {
      await this.submitSwap()
 
        this.unstakeState.set('swap');
    
    } else {
      await this.submitUnstake()
  
        this.unstakeState.set('unstake');
    
    }

  }
  private async submitUnstake(): Promise<void> {
    try {
      const { inputAmount, tokenPool } = this.unstakeForm.value;

      // Attempt to unstake tokens
      const unstakeSuccess = await this._lss.unstake(tokenPool, inputAmount);
      
      if (unstakeSuccess.signature) {
        const walletPublicKey = this._shs.getCurrentWallet().publicKey.toString();
        
        // Update stake positions and handle the unstaked account
        await this._stakeService.updateStakePositions(walletPublicKey, 'native');
        
        // Find and process the newly created unstake position
        this._stakeService.nativePositions$.pipe(take(1)).subscribe(positions => {
          const unstakeAccountAddress = this._lss.unstakeAccount().toBase58();
          this.stakePositionToUnstake = positions.find(
            position => position.address === unstakeAccountAddress
          );
          
          if (this.stakePositionToUnstake) {
            this.unstakeWizard.set('account-ready');
            this.completeDeactivateAccount();
          }
        });
      }
    } catch (error) {
      console.error('Unstake failed:', error);
      this.unstakeState.set('unstake');
    }
  }

  private async submitSwap(): Promise<void> {
    try {
      const route = { ...this.bestRoute() };
      if (!route) throw new Error('No valid swap route found');

      // Convert amounts to proper decimals for the blockchain
      const decimals = this.unstakeForm.value.outputToken.decimals;
      const multiplier = 10 ** decimals;
      
      route.outAmount = Math.floor(Number(route.outAmount) * multiplier).toString();
      route.otherAmountThreshold = Math.floor(Number(route.otherAmountThreshold) * multiplier).toString();

      // Execute swap transaction
      const tx = await this._jupStore.swapTx(route);
      const success = await this._txi.sendMultipleTxn([tx]);
      
      if (success) {
        this._lss._triggerUpdate.next({ type: 'full' });
      }
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    } finally {
      this.unstakeState.set('swap');
    }
  }

  public async completeDeactivateAccount(): Promise<void> {
    try {
      const { publicKey } = this._shs.getCurrentWallet();
      this.unstakeState.set('Deactivate account');
      const success = await this._nss.deactivateStakeAccount(
        this.stakePositionToUnstake.address, 
        publicKey
      );
      
      if (success) {
        this.unstakeState.set('Unstake');
        this.unstakeWizard.set(null);
        this._lss.unstakeAccount.set(null);
      }
    } catch (error) {
      console.error('Failed to deactivate stake account:', error);
      // Reset states on failure
      this.unstakeState.set('unstake');
    }
  }
ngOnDestroy(): void {
  //Called once, before the instance is destroyed.
  //Add 'implements OnDestroy' to the class.
  this._stakeService.manualUnstakeLST.set(null);
}
}
