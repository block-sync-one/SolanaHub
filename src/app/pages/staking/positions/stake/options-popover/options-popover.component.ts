import { Component, Input, OnInit, signal } from '@angular/core';
import {
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { Stake, Validator, WalletExtended } from 'src/app/models';
import { addIcons } from 'ionicons';
import { arrowUp, arrowDown, people, peopleCircle, flash, paperPlane, water, swapVertical, navigateOutline } from 'ionicons/icons';
import { NativeStakeService, SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ModalController } from '@ionic/angular';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { Router, RouterLink } from '@angular/router';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';

@Component({
  selector: 'options-popover',
  templateUrl: './options-popover.component.html',
  styleUrls: ['./options-popover.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon,RouterLink]
})
export class OptionsPopoverComponent implements OnInit {
  @Input() stake: Stake;
  @Input() stakeAccounts: Stake[];
  constructor(
    private _modalCtrl: ModalController,
    private _shs: SolanaHelpersService,
    private _nss: NativeStakeService,
    private _lss: LiquidStakeService,
    private _txi: TxInterceptorService,
  ) {
    addIcons({swapVertical,navigateOutline, arrowUp, arrowDown, people, peopleCircle, flash, paperPlane, water });
  }

  ngOnInit() {
    console.log('stake', this.stake);
    
  }
  private  async openValidatorModal(btnText: string) {
    let config = {
      logoURI:'assets/images/validators-icon.svg',
      title :'Select Validator',
      desc : 'Pick the right validator for you',
      btnText
    }
    const validatorsList = await this._shs.getValidatorsList()
    const modal = await this._modalCtrl.create({
      component: ModalComponent,
      componentProps: {
        componentName:'validators-modal',
        config,
        data: signal(validatorsList)
      },
      cssClass: 'modal-style'
    });
    modal.present();
    const { data, role } = await modal.onWillDismiss();
    console.log(data, role);
    if(role === 'backdrop'){
      return null
    }
    let validator: Validator = data
    // if(validator){
      return validator
    // this.selectedValidator.set(validator);
    
    // }
  }
  public async unStake() {
    const walletOwner = this._shs.getCurrentWallet()
    const res = await this._nss.deactivateStakeAccount(this.stake.address, walletOwner as WalletExtended)
    if(res){
      this.reloadStakeAccounts()
    }
  }
  public async reStake() {
    const walletOwner = this._shs.getCurrentWallet().publicKey
    let validatorVoteIdentity: string = null;

    if(this.stake.state === 'deactivating'){
      validatorVoteIdentity = this.stake.validator.vote_identity
    }else{
      validatorVoteIdentity = (await this.openValidatorModal('select validator & stake')).vote_identity;

    }
    console.log(validatorVoteIdentity);
    
    if(validatorVoteIdentity){
      const res = await this._nss.reStake(this.stake,validatorVoteIdentity,walletOwner)
      if(res){
        this.reloadStakeAccounts()
      }
    }
  }
  public async withdraw() {
    const walletOwner = this._shs.getCurrentWallet().publicKey
    const res = await this._nss.withdraw([this.stake], walletOwner , this.stake.accountLamport)
    if(res){
      this.reloadStakeAccounts()
    }
  
  }
  public async setDirectStakevSOL() {
    const walletOwner = this._shs.getCurrentWallet()
    let validatorVoteIdentity: string = null;

    if(this.stake.state === 'deactivating'){
      validatorVoteIdentity = this.stake.validator.vote_identity
    }else{
      validatorVoteIdentity = (await this.openValidatorModal('Set direct stake validator')).vote_identity;

    }
    if(validatorVoteIdentity){
      const ins = await this._lss.setvSOLDirectStake(walletOwner, validatorVoteIdentity)
      const record = { message: 'vSOL direct stake', data: { validatorId: validatorVoteIdentity } }

      await this._txi.sendTx(ins,walletOwner.publicKey, null,record )
    }
  }
  async openModal(componentName: 'delegate-lst-modal' | 'instant-unstake-modal' | 'unstake-lst-modal' | 'merge-modal' | 'split-modal' | 'transfer-auth-modal') {
    let config = {
      logoURI: null,
      title: null,
      desc: null,
      btnText: null
    }
    switch (componentName) {
      case 'delegate-lst-modal':
        config.logoURI = 'assets/images/droplets-icon.svg'
        config.title = 'liquid staking'
        config.desc = 'Turn your stake account into a liquid stake token'
        config.btnText = 'delegate now'
        break;
      case 'instant-unstake-modal':
        config.logoURI = 'assets/images/bolt-icon.svg'
        config.title = 'Instantly unstake your SOL'
        config.desc = 'Instantly unstake your SOL power by sanctum'
        config.btnText = 'unstake now'
        break;
      case 'merge-modal':
        config.logoURI = 'assets/images/merge-icon.svg'
        config.title = 'merge your accounts'
        config.desc = 'you can merge only accounts with the same validator and status'
        config.btnText = 'merge selected accounts'
        break;
      case 'split-modal':
        config.logoURI = 'assets/images/split-icon.svg'
        config.title = 'Split account'
        config.desc = 'you can split your accounts into 2 separate accounts'
        config.btnText = 'split stake account'
        break;
        case 'unstake-lst-modal':
          config.logoURI = 'assets/images/hourglass-icon.svg'
          config.title = 'unstake liquid SOL'
          config.desc = 'remove your SOL from the liquid stake pool'
          config.btnText = 'delayed unstake'
          break;
      case 'transfer-auth-modal':
        config.logoURI = 'assets/images/transfer-auth-icon.svg'
        config.title = 'transfer account authority'
        config.desc = 'transfer your stake or withdraw authority to a new wallet'
        config.btnText = 'transfer authorization'
        break;
      default:
        break;
    }
    
    const modal = await this._modalCtrl.create({
      component: ModalComponent,
      componentProps: {
        componentName,
        data: {stake: this.stake, stakeAccounts: this.stakeAccounts},
        config
      },
      cssClass: 'modal-style'
    });
    modal.present();
    // const { data, role } = await modal.onWillDismiss();

  }

  async reloadStakeAccounts() {
    // refetch stake accounts
   const nativeStake = await this._nss.getOwnerNativeStake(this._shs.getCurrentWallet().publicKey.toBase58())
   console.log('nativeStake', nativeStake);
   
  }
}
