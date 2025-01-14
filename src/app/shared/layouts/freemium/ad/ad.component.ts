import {Component, computed, inject} from '@angular/core';
import { FreemiumService } from '../freemium.service';
import { ModalController } from '@ionic/angular';
import { PopupPlanComponent } from '../popup-plan/popup-plan.component';

@Component({
  selector: 'freemium-ad',
  templateUrl: './ad.component.html',
  styleUrls: ['./ad.component.scss'],
})
export class AdComponent {
  public _freemiumService = inject(FreemiumService);
  public adShouldShow = this._freemiumService.isAdEnabled;
  private _modalCtrl= inject(ModalController);

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
