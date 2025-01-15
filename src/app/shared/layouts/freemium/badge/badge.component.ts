import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PopupPlanComponent } from '@app/shared/layouts/freemium';
import { FreemiumService } from '../freemium.service';

@Component({
  selector: 'freemium-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
})
export class BadgeComponent {
  public _freemiumService = inject(FreemiumService);
  private _modalCtrl= inject(ModalController);
  public isPremium = this._freemiumService.isPremium;


  async openFreemiumAccessPopup(){
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }
}
