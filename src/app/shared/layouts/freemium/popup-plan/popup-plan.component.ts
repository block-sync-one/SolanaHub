import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import { FreemiumService } from "../freemium.service";

@Component({
  selector: 'freemium-popup-plan',
  templateUrl: './popup-plan.component.html',
  styleUrls: ['./popup-plan.component.scss'],
})
export class PopupPlanComponent  {
  public stake = inject(FreemiumService).stake;
  private _modalCtrl= inject(ModalController);

  constructor() {
    addIcons({checkmarkOutline, closeOutline})
  }

  closeModal(){
    this._modalCtrl.dismiss();
  }
}
