import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { VirtualStorageService } from './virtual-storage.service';
import { StorageKey } from '@app/enums';
import { HubraBannerComponent } from '../shared/components/hubra-banner/hubra-banner.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HubraBannerService {

  constructor(
    private modalCtrl: ModalController,
    private walletStore: WalletStore,
    private virtualStorageService: VirtualStorageService
  ) {
    // Show banner when wallet connects if cooldown expired

  }


  hideBannerFor2weeks() {
    this.virtualStorageService.hideHubraBannerFor2Weeks();
    this.modalCtrl.dismiss();
  }
}
