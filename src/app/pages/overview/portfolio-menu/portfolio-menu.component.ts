import { Component, computed, inject } from '@angular/core';
import { IonIcon} from "@ionic/angular/standalone";
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';
import { PortfolioService, SolanaHelpersService, UtilService, WalletBoxSpinnerService } from '@app/services';
import { FreemiumService, PopupPlanComponent } from "@app/shared/layouts/freemium";
import { AddPortfolioPopupComponent } from "./add-portfolio-popup/add-portfolio-popup.component";
import { PortfolioBoxComponent } from './portfolio-box/portfolio-box.component';
import { FreemiumModule } from "@app/shared/layouts/freemium/freemium.module";
@Component({
  selector: 'portfolio-menu',
  templateUrl: './portfolio-menu.component.html',
  styleUrls: ['./portfolio-menu.component.scss'],
  standalone: true,
  imports: [
    IonIcon,
    PortfolioBoxComponent,
    FreemiumModule
  ]
})
export class PortfolioMenuComponent {
  protected readonly spinnerState = inject(WalletBoxSpinnerService).spinner;

  constructor(
    private _portfolioService: PortfolioService,
    private _utils: UtilService,
    private _shs: SolanaHelpersService,
    private _freemiumService: FreemiumService,
    private _modalCtrl: ModalController
  ) {
    addIcons({ addCircleOutline });
  }

  protected readonly walletBoxSpinnerService = inject(WalletBoxSpinnerService)
  public canAddWallet = computed(() => this.walletsPortfolio().length < this._portfolioService.MAX_LINKED_WALLETS);
  public connectedWalletAddress = this._shs?.getCurrentWallet()?.publicKey?.toBase58()
  public walletsPortfolio = computed(() =>
    this._portfolioService.portfolio().map(
      ({ walletAddress, portfolio }) => ({
        walletAddress,
        walletAddressShort: this._utils.addrUtil(walletAddress).addrShort,
        value: portfolio.netWorth,
        enabled: portfolio.enabled,
        nickname: portfolio.nickname
      })
    ).sort((a, b) => {
      if (a.walletAddress === this.connectedWalletAddress) return -1;
      if (b.walletAddress === this.connectedWalletAddress) return 1;
      return 0;
    })
  )

  openPortfolioSetup(walletAddress?: string) {
    if (this.walletBoxSpinnerService.spinner())
      return;

    // if (this._freemiumService.isPremium()) {
      this.openAddPortfolioPopup(walletAddress);
    // } else {
    //   this.openFreemiumAccessPopup();
    // }
  }

  async openFreemiumAccessPopup() {
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }

  async openAddPortfolioPopup(walletAddress?: string) {
    const modal = await this._modalCtrl.create({
      component: AddPortfolioPopupComponent,
      cssClass: 'multi-wallet-modal',
      componentProps: {
        walletAddress
      }
    });
    await modal.present();
    const {data} = await modal.onDidDismiss()
    if (data?.address) {
      // walletAddress present, delete the old one and fetch the new one
      if (walletAddress) {
        this.delete(walletAddress)
      }
      console.log('data', data);
      this._portfolioService.syncPortfolios(data.address, null, data?.nickname);
      this._portfolioService.updateLinkedWallets({address: data.address, nickname: data?.nickname})
    }
  }

  reload(walletAddress: string) {
    this._portfolioService.syncPortfolios(walletAddress, true);
  }

  delete(walletAddress: string) {
    this._portfolioService.removeFromPortfolioMap(walletAddress)
  }

  toggle(walletAddress: string) {
    this._portfolioService.toggleWallet(walletAddress)
  }
}
