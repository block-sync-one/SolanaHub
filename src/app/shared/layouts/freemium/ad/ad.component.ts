import { Component, inject } from '@angular/core';
import { FreemiumService } from '../freemium.service';
import { ModalController } from '@ionic/angular';
import { PopupPlanComponent } from '@app/shared/layouts/freemium';
import { addIcons } from "ionicons";
import { closeOutline } from "ionicons/icons";

@Component({
  selector: 'freemium-ad',
  templateUrl: './ad.component.html',
  styleUrls: ['./ad.component.scss'],
})
export class AdComponent {
  public _freemiumService = inject(FreemiumService);
  private _modalCtrl= inject(ModalController);

  constructor() {
    addIcons({ closeOutline })

  }
  async openFreemiumAccessPopup(){
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }

  closeAd(): void {
    this._freemiumService.hideAd();
  }
}
