import { Component, OnInit } from '@angular/core';
import { IonSkeletonText,  IonLabel, IonText } from "@ionic/angular/standalone";
import { EpochProgressBarComponent } from '../../epoch-progress-bar/epoch-progress-bar.component';
@Component({
  selector: 'stake-epoch',
  template: `
  <div id="stake-epoch-wrapper">
    <div id="stake-epoch-header">
      <ion-text>Current EPOCH</ion-text>
      <ion-label>724</ion-label>
    </div>
    <div id="progress-bar">
      <epoch-progress-bar [showTimeRemaining]="true"/>
    </div>
  </div>
  `,
  styleUrls: ['./stake-epoch.component.scss'],
  standalone: true,
  imports: [IonSkeletonText,  IonLabel, IonText, EpochProgressBarComponent]
})
export class StakeEpochComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
