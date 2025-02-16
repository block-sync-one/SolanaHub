import { AfterViewInit, Component, ComponentFactoryResolver, ComponentRef, EmbeddedViewRef, Injector, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NFT, Stake, Validator } from 'src/app/models';
import { IonButton, IonImg, IonText } from '@ionic/angular/standalone'

import { NativeStakeService, SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { PublicKey } from '@solana/web3.js';
import { TokenListComponent } from 'src/app/pages/swap/token-list/token-list.component';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { SendNftModalComponent } from 'src/app/pages/collectibles/send-nft-modal/send-nft-modal.component';
import { ListNftModalComponent } from 'src/app/pages/collectibles/list-nft-modal/list-nft-modal.component';
import { NftsService } from 'src/app/services/nfts.service';
import {  ProUpgradeMessageComponent } from "../../layouts/freemium";
import { FreemiumService } from "../../layouts/freemium/freemium.service";
import { IsPremiumServiceDirective } from "../../directives/is-premium-service.directive";
import { SplitModalComponent } from '@app/pages/staking/stake-positions/stake/split-modal/split-modal.component';
import { MergeModalComponent } from '@app/pages/staking/stake-positions/stake/merge-modal/merge-modal.component';
import { TransferAuthModalComponent } from '@app/pages/staking/stake-positions/stake/transfer-auth-modal/transfer-auth-modal.component';


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonImg,
    MergeModalComponent,
    SplitModalComponent,
    TransferAuthModalComponent,
    TokenListComponent,
    SendNftModalComponent,
    ListNftModalComponent,
    ProUpgradeMessageComponent,
    IsPremiumServiceDirective
  ]

})
export class ModalComponent implements AfterViewInit {
  public onSubmit: boolean = false;
  @Input() config = {
    logoURI: null,
    title: null,
    desc: null,
    btnText: null
  }
  @Input() data
  @Input() componentName: 'stash-modal' | 'll-faq-modal' | 'list-nft-modal' | 'send-nft-modal' | 'burn-nft-modal' | 'delegate-lst-modal' | 'unstake-lst-modal' | 'validators-modal' | 'merge-modal' | 'split-modal' | 'instant-unstake-modal' | 'transfer-auth-modal' | 'token-list'
  public emittedValue = signal(null)

  constructor(
    private _modalCtrl: ModalController,
    private _shs: SolanaHelpersService,
    private _nfts: NftsService,
    private _nss: NativeStakeService,
    private _lss: LiquidStakeService,
    private _txi: TxInterceptorService,
    protected _freemiumService: FreemiumService
  ) {
  }

  ngAfterViewInit() {

  }
  async submit() {

    const wallet = this._shs.getCurrentWallet()

    switch (this.componentName) {

      case 'split-modal':
        this._nss.splitStakeAccounts(wallet.publicKey, new PublicKey(this.data.stake.address), this.emittedValue().newStakeAccount, this.emittedValue().amount)
        break;
      case 'merge-modal':
        const accountsToMerge = this.emittedValue().accountsToMerge.map((acc: Stake) => new PublicKey(acc.address))
        this._nss.mergeStakeAccounts(wallet.publicKey, new PublicKey(this.data.stake.address), accountsToMerge);
        break;
      case 'transfer-auth-modal':
        const targetAddress = new PublicKey(this.emittedValue().targetAddress)
        const authToTransfer = this.emittedValue().authorities;
        this._nss.transferStakeAccountAuth(new PublicKey(this.data.stake.address), wallet.publicKey, targetAddress, authToTransfer);

        break;

      case 'send-nft-modal':
        const nftsToTransfer: NFT[] = this.emittedValue().nftsToTransfer;
        const from_Address = wallet.publicKey.toBase58()
        const to_address = this.emittedValue().targetAddress;

        let transferIns = await this._nfts.transferNft(nftsToTransfer, from_Address, to_address);
        const record2 = { message: 'nfts', data: { action: 'send', numberOfNfts: nftsToTransfer.length } }
        this._txi.sendMultipleTxn(transferIns, null, record2)
        break;
      default:
        break;
    }
    this.closeModal()
  }
  closeModal() {
    this._modalCtrl.dismiss(this.emittedValue())
  }


}
