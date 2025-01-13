import { Component, Input, OnInit } from '@angular/core';
import { StakeComponent } from '../stake.component';
import { Stake } from 'src/app/models';
import {
  IonLabel,
  IonInput,
  IonText,
  IonCheckbox
} from '@ionic/angular/standalone';

@Component({
  selector: 'instant-unstake-modal',
  templateUrl: './instant-unstake-modal.component.html',
  styleUrls: ['./instant-unstake-modal.component.scss'],
  standalone: true,
  imports: [
    StakeComponent,
    IonLabel
  ]
})
export class InstantUnstakeModalComponent  implements OnInit {
  @Input() stake: Stake;
  constructor() { }

  ngOnInit() {}

}
