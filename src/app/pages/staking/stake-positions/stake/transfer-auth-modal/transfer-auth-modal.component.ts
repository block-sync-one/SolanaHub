import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { StakeAccount } from 'src/app/models';

import {
  IonLabel,
  IonInput,
  IonCheckbox,
  IonText,
  IonImg
} from '@ionic/angular/standalone';
import { DecimalPipe } from '@angular/common';
import { UtilService } from 'src/app/services';
import { AlertComponent } from 'src/app/shared/components/alert/alert.component';
import { AddressInputComponent } from 'src/app/shared/components/address-input/address-input.component';
import { PositionComponent } from '../position.component';

@Component({
  selector: 'transfer-auth-modal',
  templateUrl: './transfer-auth-modal.component.html',
  styleUrls: ['./transfer-auth-modal.component.scss'],
  standalone: true,
  imports: [
    PositionComponent,
    AlertComponent,
    IonLabel,
    IonText,
    IonImg,
    IonInput,
    IonCheckbox,
    DecimalPipe,
    AddressInputComponent
  ]
})
export class TransferAuthModalComponent implements OnInit {
  @Input() stake:  StakeAccount;
  @Output() onAuthSet = new EventEmitter();
  public targetAddress: string = '';
  public authoritiesChecked = signal({ withdraw: false, stake: false })
  public utils = inject(UtilService)


  ngOnInit() {
    this.stake.authorities.withdrawer = this.utils.addrUtil(this.stake.authorities.withdrawer).addrShort
    this.stake.authorities.staker = this.utils.addrUtil(this.stake.authorities.staker).addrShort

   }
   updateTargetAddress(address){
    this.targetAddress = address
   }
  updateTransferAuth(ev) {

    if(typeof ev !== 'string'){
      this.authoritiesChecked.update(update => ({ ...update, [ev.value]: ev.checked }))
    }else{
      this.targetAddress = ev
    }
    

    let payload = null;
    if ((this.authoritiesChecked().stake || this.authoritiesChecked().withdraw) && this.targetAddress) {
      payload = {authorities: this.authoritiesChecked(), targetAddress: this.targetAddress}
    }

    this.onAuthSet.emit(payload)
  }
}
