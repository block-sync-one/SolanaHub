import {Component, computed, inject, signal} from '@angular/core';
import {ChipComponent} from "@app/shared/components";
import {IonButton, IonCheckbox, IonIcon} from "@ionic/angular/standalone";
import {ModalController} from "@ionic/angular";
import {addIcons} from "ionicons";
import {closeOutline} from "ionicons/icons";
import {ConvertPositionsService} from "@app/services/convert-positions.service";
import {ConvertToHubSolItemComponent} from "./convert-to-hub-sol-item/convert-to-hub-sol-item.component";
import {ConvertToHubSolToken} from "@app/models";
import {UtilService} from "@app/services";
import {FreemiumModule} from "@app/shared/layouts/freemium/freemium.module";
import { PercentPipe } from '@angular/common';
import va from "@vercel/analytics";

@Component({
  selector: 'app-convert-positions-modal',
  templateUrl: './convert-positions-modal.component.html',
  styleUrls: ['./convert-positions-modal.component.scss'],
  imports: [
    ChipComponent,
    IonButton,
    IonCheckbox,
    IonIcon,
    PercentPipe,
    ConvertToHubSolItemComponent,
    FreemiumModule
  ],
  standalone: true
})
export class ConvertPositionsModalComponent {
  private readonly _modalCtrl = inject(ModalController);
  private readonly _convertPositionsService = inject(ConvertPositionsService);
  public readonly utils = inject(UtilService);

  public data = signal<ConvertToHubSolToken[]>(this._convertPositionsService.lst());
  public total = this._convertPositionsService.totalHubSolValue;
  public selectItems = computed(() => this.data().filter(item => item.checked).length);
  public totalChecked = computed(() => this.selectItems() !== 0);
  public hubSOLAPY = this._convertPositionsService.hubSOLAPY;
  constructor() {
    addIcons({closeOutline});
  }

  async convertToHubSOL() {
    const success = await this._convertPositionsService.convertToHubSOL(this.data())
    if (success.length > 0)
      this.closeModal()
  }

  closeModal() {
    this._modalCtrl.dismiss();
  }

  hide() {
    va.track('convert-to-hubSOL', { event: 'close modal' })
    this._convertPositionsService.hide();
    this.closeModal()
  }

  /**
   * Toggles the checked state of a specific item in the list.
   * @param {string} address - The address identifier of the item to toggle
   * @description Updates the checked property of the matching item while preserving all other items.
   * @example
   * // Assuming this.data.items = [
   * //   { address: '123', checked: true },
   * //   { address: '456', checked: false }
   * // ]
   * toggleItem('123'); // Sets item with address '123' to unchecked
   */
  toggleItem(address: string) {
    this.data.update(itemsValue => itemsValue.map((item: any) =>
      item.address === address ? ({...item, checked: !item.checked}) : item
    ))
  }

  /**
   * Toggles the checked state of all items in the dataset.
   * @description Updates all items' checked property based on the inverse of the current totalChecked state.
   * @example
   * // Assuming this.data.items = [{checked: true}, {checked: false}]
   * // And this.totalChecked() returns true
   * toggleAll(); // Sets all items to unchecked
   */
  toggleAll() {
    this.data.update((itemsValue) => {
      return itemsValue.map(item =>
        ({...item, checked: !this.totalChecked()}));
    })
  }
}
