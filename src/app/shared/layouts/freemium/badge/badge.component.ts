import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PopupPlanComponent } from '../popup-plan/popup-plan.component';
import { FreemiumService } from '../freemium.service';
import { addIcons } from 'ionicons';
import { starOutline } from 'ionicons/icons';

@Component({
  selector: 'freemium-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
})
export class BadgeComponent {
  public _freemiumService = inject(FreemiumService);
  private _modalCtrl= inject(ModalController);
  public isPremium = this._freemiumService.isPremium;

  constructor() {
    addIcons({starOutline})
   }

  async openFreemiumAccessPopup(){
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }
}
