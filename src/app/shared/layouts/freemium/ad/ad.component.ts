import { Component, inject } from '@angular/core';
import { FreemiumService } from '../freemium.service';
import { addIcons } from "ionicons";
import { closeOutline } from "ionicons/icons";

@Component({
  selector: 'freemium-ad',
  templateUrl: './ad.component.html',
  styleUrls: ['./ad.component.scss'],
})
export class AdComponent {
  public _freemiumService = inject(FreemiumService);

  constructor() {
    addIcons({ closeOutline })
  }

  closeAd(): void {
    this._freemiumService.hideAd();
  }
}
