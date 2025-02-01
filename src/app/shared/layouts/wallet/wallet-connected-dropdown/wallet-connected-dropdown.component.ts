import { Component, Input, OnInit } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { ActionSheetController, PopoverController } from '@ionic/angular';
import { WalletAdapterOptionsComponent } from '../wallet-adapter-options/wallet-adapter-options.component';
import { addIcons } from 'ionicons';
import {copy, repeat, logOut, trophyOutline } from 'ionicons/icons';
import { PortfolioService, SolanaHelpersService } from 'src/app/services';
import { WatchModeService } from 'src/app/services/watch-mode.service';
import { Router } from '@angular/router';
import { finalize } from "rxjs";

@Component({
  selector: 'app-wallet-connected-dropdown',
  templateUrl: './wallet-connected-dropdown.component.html',
  styleUrls: ['./wallet-connected-dropdown.component.scss'],

})
export class WalletConnectedDropdownComponent {
  @Input() walletAddress: string;
  readonly watchMode$ = this._watchModeService.watchMode$
  constructor(
    private _watchModeService: WatchModeService,
    private _walletStore: WalletStore,
    public popoverController: PopoverController,
    private _portfolioService:PortfolioService,
    private _router: Router,

    ) {
    addIcons({copy, repeat, logOut, trophyOutline })
  }

  public disconnectWallet() {
    this._walletStore.disconnect()
      .pipe(finalize(() => this._portfolioService.clearWallet()))
      .subscribe();
    this.popoverController.dismiss();
  }

  public async showWalletAdapters() {
    this.popoverController.dismiss()
    const popover = await this.popoverController.create({
      component: WalletAdapterOptionsComponent,
      cssClass: 'wallet-adapter-options'
    });
    await popover.present();
  }

}
