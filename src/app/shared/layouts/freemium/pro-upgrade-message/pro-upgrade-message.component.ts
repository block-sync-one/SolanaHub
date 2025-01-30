import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonText,

} from "@ionic/angular/standalone";

import { ModalController } from '@ionic/angular';
import { FreemiumService, PopupPlanComponent } from '@app/shared/layouts/freemium';
import { ChipComponent } from "../../../components/chip/chip.component";
import { NgIf } from '@angular/common';

@Component({
  selector: 'pro-upgrade-message',
  templateUrl: './pro-upgrade-message.component.html',
  styleUrls: ['./pro-upgrade-message.component.scss'],
  imports: [
    IonButton,
    IonText,
    ChipComponent,
    NgIf
  ],
  standalone: true
})
export class ProUpgradeMessageComponent {
  private _modalCtrl = inject(ModalController);
  private _freemiumService = inject(FreemiumService);
  public isPremium = this._freemiumService.isPremium;
  async openFreemiumAccessPopup() {
    try {
      await this._modalCtrl.dismiss();
    } catch (error) {
      console.log(error);
    }
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }
}
