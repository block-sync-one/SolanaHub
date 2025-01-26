import {Component, EventEmitter, Input, OnInit, Output, inject, signal} from '@angular/core';
import { Stake } from 'src/app/models';
import { StakeComponent } from '../stake.component';
import {
  IonLabel,
  IonInput
} from '@ionic/angular/standalone';
import { UtilService } from 'src/app/services';
import { DecimalPipe } from '@angular/common';
import { AlertComponent } from 'src/app/shared/components/alert/alert.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { InputLabelComponent } from 'src/app/shared/components/input-label/input-label.component';
import { PlatformFeeComponent } from "@app/shared/components/platform-fee/platform-fee.component";
import { FreemiumService } from "@app/shared/layouts/freemium";
import { PremiumActions } from "@app/enums";

@Component({
  selector: 'unstake-lst-modal',
  templateUrl: './unstake-lst-modal.component.html',
  styleUrls: ['./unstake-lst-modal.component.scss'],
  standalone: true,
    imports: [
        StakeComponent,
        IonLabel,
        IonInput,
        DecimalPipe,
        AlertComponent,
        AmountInputComponent,
        InputLabelComponent,
        PlatformFeeComponent
    ]
})
export class UnstakeLstModalComponent  implements OnInit {
  @Input() stake:Stake;
  @Output() onAmountSet = new EventEmitter();
  public utils = inject(UtilService)
  public _freemiumService = inject(FreemiumService);
  public fee = signal(this._freemiumService.calculatePlatformFeeInSOL(PremiumActions.UNSTAKE_LST, 0))
  public amount:number = 0

  ngOnInit() {

   }

  setAmount(value){
    console.log(value);

    this.amount = value
    let payload = null
    if(this.amount > 0){
       payload = {pool: this.stake.pool,amount: Number(this.amount)}
    }
    this.onAmountSet.emit(payload)

  }

}
