import { Component, inject } from '@angular/core';
import { FreemiumService } from '../freemium.service';
import { PopupPlanComponent } from "../popup-plan/popup-plan.component";
import { ModalController } from "@ionic/angular";

@Component({
  selector: 'freemium-road',
  templateUrl: './road.component.html',
  styleUrls: ['./road.component.scss'],
})
export class RoadComponent {
  private _freemiumService = inject(FreemiumService);
  private _modalCtrl= inject(ModalController);

  public stakeSize = this._freemiumService.stake;

  async openFreemiumAccessPopup(){
    await this._modalCtrl.dismiss();
    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }
}
