import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild, WritableSignal, effect, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {

  IonInput,
  IonButton,

} from '@ionic/angular/standalone';



import { StakePool, Validator, WalletExtended } from 'src/app/models';
import { SolanaHelpersService, UtilService, TxInterceptorService, PriceHistoryService, NativeStakeService, JupStoreService } from 'src/app/services';
import { Observable } from 'rxjs';
import { ApyCalcComponent } from './apy-calc/apy-calc.component';
import { IonicModule } from '@ionic/angular';

import { Keypair, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { StakePathComponent } from './stake-path/stake-path.component';
import { SelectValidatorComponent } from './select-validator/select-validator.component';
import { LockStakeComponent } from './lock-stake/lock-stake.component';
import { SelectStakePoolComponent } from './select-stake-pool/select-stake-pool.component';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { CustomValidatorComponent } from './custom-validator/custom-validator.component';
import { InputLabelComponent } from 'src/app/shared/components/input-label/input-label.component';
import { LoyaltyLeagueService } from 'src/app/services/loyalty-league.service';
import { VirtualStorageService } from 'src/app/services/virtual-storage.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'stake-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  standalone: true,
  imports: [
    ApyCalcComponent,
    StakePathComponent,
    SelectValidatorComponent,
    LockStakeComponent,
    SelectStakePoolComponent,
    CustomValidatorComponent,
    IonInput,
    IonButton,
    CurrencyPipe,
    ReactiveFormsModule,
    InputLabelComponent
  ]
})
export class FormComponent implements OnInit, AfterViewInit {
  public solanaHubVoteKey = '7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh';
  public asset = {
    "address": "So11111111111111111111111111111111111111112",
    "decimals": 9,
    "chainId": 101,
    "name": "Wrapped SOL",
    "symbol": "SOL",
    "logoURI": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
  }
  @Input() validatorsList = signal([] as Validator[])
  @Input() stakePools: WritableSignal<StakePool[]>
  public stakeAPY = signal(null);
  public stakePath = signal('native');
  public loading = signal(false)
  public showCustomValidator: any = false;
  public stakeForm: FormGroup;
  public wallet$: Observable<WalletExtended> = this._shs.walletExtended$
  public solPrice = this._jupStore.solPrice
  constructor(
    private _loyaltyLeagueService: LoyaltyLeagueService,
    private _shs: SolanaHelpersService,
    private _fb: FormBuilder,
    private _util: UtilService,
    private _lss: LiquidStakeService,
    private _nss: NativeStakeService,
    private _tis: TxInterceptorService,
    private _jupStore: JupStoreService,
    private _vrs: VirtualStorageService,
    private _activatedRoute: ActivatedRoute
  ) {

  }
  onShowCustomValidator(show){
    this.showCustomValidator = show

    // return to delegation strategy if user cancelled custom validator
    if(!show){
      this.stakeForm.controls['validatorVoteIdentity'].reset()
    }
    
  }
  ngOnInit() {
    
    this.stakeForm = this._fb.group({
      amount: [null, [Validators.required]],
      validatorVoteIdentity: [null, [Validators.required]],
      stakingPath: ['native', Validators.required],
      lockupDuration: [0],
    })

    // this.stakeForm.valueChanges.subscribe(v=> console.log(v))
    this._shs.getValidatorsList().then(vl => this.validatorsList.set(vl));
    console.log('running from form component')
  }

  setStakePath = 'native'
  ngAfterViewInit(): void {
    const queryParams = this._activatedRoute.snapshot.queryParams;
    if(queryParams['path'] === 'LST'){
      this.setStakePath = 'liquid'

    }
  }

  setStakeSize(amount) {
    this.stakeForm.controls['amount'].setValue(amount)
  }


  selectStakePath(stakePath: 'native' | 'liquid') {
    
    this.stakePath.set(stakePath)
    this.stakeForm.controls['validatorVoteIdentity'].reset()
    this.stakeForm.controls['stakingPath'].setValue(stakePath)
    if (stakePath === 'native') {
      this.stakeForm.controls['validatorVoteIdentity'].addValidators(Validators.required)
      this._removeStakePoolControl()
    }
    if (stakePath === 'liquid') {
      this.stakeForm.controls['validatorVoteIdentity'].removeValidators(Validators.required);
      this._addStakePoolControl()
    }
  }


  private _addStakePoolControl() {
    const stakePoolControl = new FormControl('', Validators.required)
    this.stakeForm.addControl('pool', stakePoolControl)
  }
  private _removeStakePoolControl() {
    this.stakeForm.removeControl('pool')
  }

  // private async _liquidStake(poolName: string, amount: number, validatorVoteAccount:string) {
  //   const sol = new BN(amount * LAMPORTS_PER_SOL);
  //   return await this._stakePoolStore.stakeSOL(poolName.toLowerCase(), sol, validatorVoteAccount)
  // }
  public stakeState = signal('stake');
  public async submitNewStake(): Promise<void> {
    this.loading.set(true)
    this.stakeState.set('preparing transaction');

    let { amount, validatorVoteIdentity, lockupDuration, stakingPath, pool } = this.stakeForm.value;
    const lamportsToDelegate = amount * LAMPORTS_PER_SOL
    const walletOwner = this._shs.getCurrentWallet().publicKey;
    const stakeReferer = this._vrs.localStorage.getData('refCode')

    try {
      
    if (stakingPath === 'native') {
      // const stakeIx =  this._nss.createStakeAccount(lamportsToDelegate,walletOwner)
      // const stakeAcc: Keypair = stakeIx.newStakeAccount;
      // const stakeAccIns: Transaction = stakeIx.newStakeAccountIns;
      // await this._tis.sendTx([stakeAccIns], walletOwner, [stakeAcc])
      const stake = await this._nss.stake(lamportsToDelegate, walletOwner, validatorVoteIdentity, lockupDuration);
      console.log('stake', stake)
      // add stakers to loyalty league referee program
      if (stake && stakeReferer && this.solanaHubVoteKey === validatorVoteIdentity) {
        const participantAddress = walletOwner.toBase58()
        this._loyaltyLeagueService.addReferral(stakeReferer, participantAddress)
      }
    } else if (stakingPath === 'liquid') {
      const participantAddress = walletOwner.toBase58()
      if(pool.poolName.toLowerCase() == 'solanahub staked sol'){
        const liquidStake = await this._lss.depositSolHubSolPool(walletOwner,lamportsToDelegate)
        if(liquidStake){
          this._loyaltyLeagueService.addReferral(stakeReferer, participantAddress)
        }
      }else{ 
        const liquidStake = await this._lss.stake(pool, lamportsToDelegate, walletOwner, validatorVoteIdentity)
        if(liquidStake){
          await this._nss.getOwnerNativeStake(this._shs.getCurrentWallet().publicKey.toBase58())
        }
        // add stakers to loyalty league referee program
        if (liquidStake && stakeReferer && this.solanaHubVoteKey === validatorVoteIdentity) {
          this._loyaltyLeagueService.addReferral(stakeReferer, participantAddress)
        }
      }
    }
  } catch (error) {
      console.error(error);
  }
  this.loading.set(false)
  this.stakeState.set('stake');
  }
  setValidator(validator: Validator) {
    this.stakeForm.controls['validatorVoteIdentity'].setValue(validator.vote_identity);
    if (this.stakePath() === 'native') {
      this.stakeAPY.set(validator.total_apy / 100)
    }
  }
  setPool(pool) {
    this.stakeForm.controls['pool'].setValue(pool)
    this.stakeAPY.set(pool.apy)
  }

}
