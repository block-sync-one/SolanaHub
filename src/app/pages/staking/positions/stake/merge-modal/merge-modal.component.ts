import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  QueryList,
  signal,
  ViewChildren,
  WritableSignal
} from '@angular/core';
import { Stake } from 'src/app/models';
import { StakeComponent } from '../stake.component';
import { IonCheckbox, IonInput, IonLabel, IonText } from '@ionic/angular/standalone';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { DecimalPipe, NgClass } from '@angular/common';
import { FreemiumService } from "../../../../../shared/layouts/freemium/freemium.service";
import { ChipComponent } from "../../../../../shared/components/chip/chip.component";
import { FreemiumModule } from "@app/shared/layouts/freemium/freemium.module";
import { PlatformFeeComponent } from "@app/shared/components/platform-fee/platform-fee.component";
import { PremiumActions } from "@app/enums";

@Component({
  selector: 'merge-modal',
  templateUrl: './merge-modal.component.html',
  styleUrls: ['./merge-modal.component.scss'],
  standalone: true,
  imports: [
    StakeComponent,
    IonLabel,
    IonInput,
    IonText,
    IonCheckbox,
    ScrollingModule,
    NgClass,
    DecimalPipe,
    ChipComponent,
    FreemiumModule,
    PlatformFeeComponent
  ]
})
export class MergeModalComponent implements OnInit {
  public _freemiumService = inject(FreemiumService);
  public fee = signal(this._freemiumService.getDynamicPlatformFeeInSOL(PremiumActions.MERGE, 0))
  @Input() targetStake: Stake;
  @Input() stakeAccounts: Stake[];
  @Output() onAccountsSelected = new EventEmitter();
  @ViewChildren('checkAccounts') checkAccounts: QueryList<IonCheckbox>
  public accountsToMerge: WritableSignal<Stake[]> = signal(null);

  public mergedBalance = computed(() => this.accountsToMerge() ? this.accountsToMerge().reduce((accumulator, currentValue: Stake) => accumulator + currentValue.balance, 0) : 0)

  selectAccount(checkbox, valid) {
    if (valid) {
      checkbox.checked = !checkbox.checked
      const checkedItems = this.checkAccounts.filter(box => box.checked).map(item => item.value)

      this.accountsToMerge.set(checkedItems)

      let payload = null
      if (this.accountsToMerge().length > 0) {
        payload = { accountsToMerge: this.accountsToMerge() }
      }
      this.onAccountsSelected.emit(payload)
    }
  }

  ngOnInit() {
    // hide the target stake account from the list
    this.stakeAccounts = this.stakeAccounts.filter(acc => acc.address != this.targetStake.address);
  }
}
