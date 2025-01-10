import { Component, OnInit } from '@angular/core';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonHeader,
  IonImg,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonSkeletonText,
  IonProgressBar,
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSegmentView,
  IonSegmentContent
} from '@ionic/angular/standalone';
import { ChipComponent } from "../../../shared/components/chip/chip.component";
import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box/convert-to-hub-sol-box.component';
@Component({
  selector: 'stake-form',
  templateUrl: './stake-form.component.html',
  styleUrls: ['./stake-form.component.scss'],
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, ChipComponent, IonSkeletonText, ConvertToHubSOLBoxComponent, IonSegmentView, IonSegmentContent ]
})
export class StakeFormComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
