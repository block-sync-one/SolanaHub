import { Component, Input, OnChanges, OnInit, Signal, SimpleChanges, computed, inject, signal } from '@angular/core';
import { InputLabelComponent } from 'src/app/shared/components/input-label/input-label.component';
import { IonInput, IonIcon, IonButton, IonImg, IonSkeletonText } from '@ionic/angular/standalone';
import { JupToken, Token } from 'src/app/models';
import { ModalController } from '@ionic/angular';
import { JupStoreService } from 'src/app/services';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

import { ModalComponent } from 'src/app/shared/components/modal/modal.component';
import { StakeAbleAsset } from '../stake-form.component';
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
    DecimalPipe
  ]
})
export class InputComponent implements OnInit, OnChanges {

  @Input() assetControl;
  @Input() amountControl;
  @Input() outValue = null;
  // public amountValue = null
  @Input() stakeAbleAssets = signal([] as StakeAbleAsset[])
  @Input() readonly: boolean = false;
  @Input() tokenPrice = signal(0);
  // public usdValue = computed(() => this.tokenPrice() * this.amountControl.value)
  @Input() waitForBestRoute = signal(false);
  private _jupStore = inject(JupStoreService);
  private _modalCtrl = inject(ModalController);

  public visibleValue = signal(null)
  ngOnInit(): void {
    console.log(this.assetControl.value)
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // this.getTokenPrice();
  }
  ngOnChanges(changes: SimpleChanges) {
    this.readonly ? this.visibleValue.set(this.outValue) : this.visibleValue.set(this.amountControl.value);

    this.getTokenPrice();


    
  }

  valueChange(ev) {
    let value = ev.detail !== undefined ? ev.detail.value : ev
    const definitelyValidValue = value.toString().indexOf(',') > 0 ? value.replaceAll(",", "") : value
    this.amountControl.patchValue(definitelyValidValue)
    this.getTokenPrice();
    this.readonly ? this.visibleValue.set(this.outValue) : this.visibleValue.set(this.amountControl.value);

  }
  async openTokensModal() {
    const config = {
      logoURI: 'assets/images/tokens-icon.svg',
      title: 'Select Token',
      desc: 'Select token you wish to swap',
      btnText: 'select',
    }

    const modal = await this._modalCtrl.create({
      component: ModalComponent,
      componentProps: {
        componentName: 'token-list',
        data: { stakeAbleAssets: this.stakeAbleAssets },
        config
      },
      cssClass: 'modal-style',
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(data)
    // let jupToken: JupToken = data

    // if (data) {
    //   this.tokenControl.setValue(jupToken);
    //   this.getTokenPrice();
    // }

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

}
