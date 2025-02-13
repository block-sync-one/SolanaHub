import { Component, Input, OnInit, signal } from '@angular/core';
import {
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { StakeAccount, Validator, WalletExtended } from 'src/app/models';
import { addIcons } from 'ionicons';
import { arrowUp, arrowDown, people, peopleCircle, flash, paperPlane, water, swapVertical, navigateOutline } from 'ionicons/icons';
import { NativeStakeService, SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ModalController } from '@ionic/angular';
import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { Router, RouterLink } from '@angular/router';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { StakeService } from '@app/pages/staking/stake.service';

@Component({
  selector: 'options-popover',
  templateUrl: './options-popover.component.html',
  styleUrls: ['./options-popover.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon,RouterLink]
})
export class OptionsPopoverComponent implements OnInit {
  @Input() stake: StakeAccount;
  @Input() stakeAccounts: StakeAccount[];
  constructor(
    private _modalCtrl: ModalController,
    private _shs: SolanaHelpersService,
    private _nss: NativeStakeService,
    private _lss: LiquidStakeService,
    private _stakeService: StakeService,
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
    const {publicKey} = this._shs.getCurrentWallet()
    const res = await this._nss.deactivateStakeAccount(this.stake.address, publicKey)
    if(res){
      this._stakeService.updateStakePositions(publicKey.toString(), 'native')
    }
  }
  public async reStake() {
    const {publicKey} = this._shs.getCurrentWallet()
    let validatorVoteIdentity: string = null;

    if(this.stake.state === 'deactivating'){
      validatorVoteIdentity = this.stake.validator.vote_identity
    }else{
      validatorVoteIdentity = (await this.openValidatorModal('select validator & stake')).vote_identity;

    }
    if(validatorVoteIdentity){
      await this._nss.reStake(this.stake,validatorVoteIdentity,publicKey)
      
    }
  }
  public async withdraw() {
    const {publicKey} = this._shs.getCurrentWallet()
    const res = await this._nss.withdraw([this.stake], publicKey , this.stake.balance)
    if(res){
      this._stakeService.updateStakePositions(publicKey.toString(), 'native')
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
  public setUnstakeLST(){
    this._stakeService.manualUnstakeLST.set(this.stake as any)
  }


}
