import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonButtons, IonChip,
  IonContent,
  IonHeader, IonIcon, IonImg, IonInput,
  IonItem, IonLabel,
  IonModal, IonText,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";

import { ModalController } from '@ionic/angular';
import { PopupPlanComponent } from '../popup-plan/popup-plan.component';
import { ChipComponent } from "../../../components/chip/chip.component";

@Component({
  selector: 'app-modal-message',
  templateUrl: './modal-upgrade-message.component.html',
  styleUrls: ['./modal-upgrade-message.component.scss'],
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonModal,
    IonTitle,
    IonToolbar,
    IonImg,
    IonIcon,
    IonLabel,
    IonText,
    ChipComponent,
    IonChip,
    ChipComponent,
  ],
  standalone: true
})
export class ModalUpgradeMessageComponent {
  private _modalCtrl= inject(ModalController);

  async openFreemiumAccessPopup(){
    await this._modalCtrl.dismiss();
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }
}
