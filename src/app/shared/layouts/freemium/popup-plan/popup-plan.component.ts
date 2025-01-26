import { Component, inject } from '@angular/core';
import {Router} from "@angular/router";
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import { FreemiumService } from "@app/shared/layouts/freemium";
import { RoutingPath } from "@app/shared/constants";
import { UtilService } from "@app/services";

@Component({
  selector: 'freemium-popup-plan',
  templateUrl: './popup-plan.component.html',
  styleUrls: ['./popup-plan.component.scss'],
})
export class PopupPlanComponent  {
  public freemiumService = inject(FreemiumService);
  public stake = this.freemiumService.stake;
  public utils = inject(UtilService);
  private _modalCtrl= inject(ModalController);
  private _router= inject(Router);

  constructor() {
    addIcons({checkmarkOutline, closeOutline})
  }

  closeModal(){
    this._modalCtrl.dismiss();
  }

  gotoStakingPage() {
    this._router.navigate([RoutingPath.STAKING])
      .then(() => this.closeModal())
  }
}
