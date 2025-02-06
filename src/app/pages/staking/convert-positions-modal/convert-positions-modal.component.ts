import {Component, inject} from '@angular/core';
import {ChipComponent} from "@app/shared/components";
import {IonButton, IonCheckbox, IonIcon, IonImg, IonLabel} from "@ionic/angular/standalone";
import {ModalController} from "@ionic/angular";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {addIcons} from "ionicons";
import {closeOutline} from "ionicons/icons";
import {ConvertPositionsService} from "@app/services/convert-positions.service";


@Component({
  selector: 'app-convert-positions-modal',
  templateUrl: './convert-positions-modal.component.html',
  styleUrls: ['./convert-positions-modal.component.scss'],
  imports: [
    ChipComponent,
    IonButton,
    IonImg,
    IonLabel,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    IonCheckbox,
    IonIcon
  ],
  standalone: true
})
export class ConvertPositionsModalComponent {
  private _modalCtrl= inject(ModalController);
  private _convertPositionsService= inject(ConvertPositionsService);

  constructor() {
    addIcons({closeOutline})
  }

  convertToHubSOL() {

  }

  closeModal() {
    this._modalCtrl.dismiss();
  }

  hide() {
    this._convertPositionsService.hide();
    this.closeModal()
  }
}
