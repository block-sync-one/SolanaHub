import { Component, Input, OnChanges, OnInit, Signal, SimpleChanges, computed, inject, signal } from '@angular/core';
import { InputLabelComponent } from 'src/app/shared/components/input-label/input-label.component';
import { IonInput, IonIcon, IonButton, IonImg, IonSkeletonText } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';
import { JupStoreService, UtilService } from 'src/app/services';
import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';

import { SelectPositionComponent } from '../select-position/select-position.component';
import { PositionComponent } from '../../stake-positions/stake/position.component';
@Component({
  selector: 'stake-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  standalone: true,
  imports: [
    InputLabelComponent,
    IonInput,
    IonIcon,
    IonButton,
    IonImg,
    IonSkeletonText,
    CurrencyPipe,
    DecimalPipe,
    PositionComponent,
    NgClass
  ]
})
export class InputComponent implements OnInit, OnChanges {
  @Input() formType: 'stake' | 'unstake' = 'stake';
  @Input() label: string = 'stake';
  @Input() assetControl;
  @Input() amountControl;
  @Input() outValue = null;
  // public amountValue = null

  @Input() readonly: boolean = false;
  @Input() tokenPrice = signal(0);
  // public usdValue = computed(() => this.tokenPrice() * this.amountControl.value)
  @Input() waitForBestRoute = signal(false);
  private _jupStore = inject(JupStoreService);
  private _utilService = inject(UtilService);
  private _popoverCtrl = inject(PopoverController);
  public visibleValue = signal(null)
  ngOnInit(): void {
    // this.getTokenPrice();
  }
  ngOnChanges(changes: SimpleChanges) {

    this.readonly ? this.visibleValue.set(this.outValue) : this.visibleValue.set(this.amountControl.value);
    if (this.assetControl.value.type == 'liquid') {
      this.getTokenPrice();
    }



  }

  valueChange(ev) {

    let value = ev.detail !== undefined ? ev.detail.value : ev
    const definitelyValidValue = value.toString().indexOf(',') > 0 ? value.replaceAll(",", "") : value
    this.amountControl.patchValue(definitelyValidValue)
    this.getTokenPrice();
    this.readonly ? this.visibleValue.set(this.outValue) : this.visibleValue.set(this.amountControl.value);

  }

  getTokenPrice() {
    const { address } = this.assetControl.value

    this._jupStore.fetchPriceFeed(address, 1).then(res => {
      const price = res.data[address]['price'];
      if (this.tokenPrice() != price) {
        this.tokenPrice.set(Number(price));
      }
    });
  }


  async openStakeAbleAssetsModal(ev) {
    if (this.readonly && this.assetControl.value.type != 'native') {
      return
    }
    const popover = await this._popoverCtrl.create({
      component: SelectPositionComponent,
      cssClass: 'modal-style',
      componentProps: {
        formType: this.formType
      },
      event: ev,
      side: 'bottom',
      alignment: 'center',
      translucent: true,
      dismissOnSelect: true,
      showBackdrop: false,
      mode: 'ios',

    });
    popover.present();

    const { data, role } = await popover.onWillDismiss();
    console.log(data, this.amountControl?.value, this.outValue)
    if (data) {
      // aggregate position to follow up stakeable assets interface 
      console.log(data);
      setTimeout(() => {

        this.assetControl.setValue(data)
        if (data.type == 'native') {
          this.visibleValue.set(data.balance)
          this.readonly = true
        } else {
          this.visibleValue.set(0)
          this.readonly = false
        }
      });
    }


  }


  getLogoURI(stake: any): string {
    return stake.validator?.image || stake.logoURI || 'assets/images/unknown.svg';
  }
  getStakeName(stake: any): string {
    return stake.validator?.name || stake?.symbol;
  }

  getAccountShortAddress(stake: any): string {
    return this._utilService.addrUtil(stake.address).addrShort;
  }
}
