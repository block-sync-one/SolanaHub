import { AfterViewInit, Component, ComponentFactoryResolver, ComponentRef, EmbeddedViewRef, Injector, Input, OnInit, TemplateRef, ViewChild, ViewContainerRef, effect, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NFT, Stake, Validator } from 'src/app/models';
import { IonButton, IonImg, IonText } from '@ionic/angular/standalone'

import { NativeStakeService, SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { ValidatorsModalComponent } from 'src/app/pages/staking/form/validators-modal/validators-modal.component';
// import { InstantUnstakeModalComponent } from 'src/app/pages/staking/positions/stake/instant-unstake-modal/instant-unstake-modal.component';
// import { MergeModalComponent } from 'src/app/pages/staking/positions/stake/merge-modal/merge-modal.component';
// import { SplitModalComponent } from 'src/app/pages/staking/positions/stake/split-modal/split-modal.component';
// import { TransferAuthModalComponent } from 'src/app/pages/staking/positions/stake/transfer-auth-modal/transfer-auth-modal.component';
import { TokenListComponent } from 'src/app/pages/swap/token-list/token-list.component';
// import { DelegateLSTModalComponent } from 'src/app/pages/staking/positions/stake/delegate-lst/delegate-lst-modal.component';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { SendNftModalComponent } from 'src/app/pages/collectibles/send-nft-modal/send-nft-modal.component';
import { ListNftModalComponent } from 'src/app/pages/collectibles/list-nft-modal/list-nft-modal.component';
import { BurnNftModalComponent } from 'src/app/pages/collectibles/burn-nft-modal/burn-nft-modal.component';
import { NftsService } from 'src/app/services/nfts.service';
// import { UnstakeLstModalComponent } from 'src/app/pages/staking/positions/stake/unstake-lst-modal/unstake-lst-modal.component';
import { FaqModalComponent } from 'src/app/pages/loyalty-league/faq-modal/faq-modal.component';
import { StashModalComponent } from 'src/app/pages/stash/stash-modal/stash-modal.component';
import { ChipComponent } from "../chip/chip.component";
import { ModalUpgradeMessageComponent } from "../../layouts/freemium";
import { FreemiumService } from "../../layouts/freemium/freemium.service";
import { IsPremiumServiceDirective } from "../../directives/is-premium-service.directive";


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonImg,
    ValidatorsModalComponent,
    MergeModalComponent,
    SplitModalComponent,
    TransferAuthModalComponent,
    TokenListComponent,
    SendNftModalComponent,
    ListNftModalComponent,
    UnstakeLstModalComponent,
    FaqModalComponent,
    ChipComponent,
    IonText,
    ModalUpgradeMessageComponent,
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

      case 'delegate-lst-modal':
        const pool = this.emittedValue().pool;
        this._lss.stakePoolStakeAccount(this.data.stake, pool)
        break;
      case 'unstake-lst-modal':
        this._lss.unstake(this.emittedValue().pool, this.emittedValue().amount)
        break;
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

      // case 'burn-nft-modal':
      //   const nftsToBurn: NFT[] = this.emittedValue().nftsToBurn;
      //   let burnIns = await this._nfts.burnNft(nftsToBurn, wallet.publicKey.toBase58());
      //   const record = { message: 'nfts', data: { action: 'burn', numberOfNfts: nftsToBurn.length } }
      //   this._txi.sendMultipleTxn(burnIns, null, record)
      //   break;
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
