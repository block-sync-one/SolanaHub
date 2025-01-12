import { NgModule } from '@angular/core';
import {IonIcon, IonImg, IonButton, IonLabel} from '@ionic/angular/standalone';
import {
  PopupPlanComponent,
  BadgeComponent,
  RoadComponent,
  AdComponent,
} from './';
import { CommonModule } from '@angular/common';
import { ChipComponent } from '../../components/chip/chip.component';
import {RouterLink} from "@angular/router";


@NgModule({
  declarations: [
    PopupPlanComponent,
    BadgeComponent,
    RoadComponent,
    AdComponent,
  ],
    imports: [
        ChipComponent,
        CommonModule,
        IonIcon,
        IonButton,
        IonImg,
        IonLabel,
        RouterLink
    ],
  exports: [
    PopupPlanComponent,
    BadgeComponent,
    RoadComponent,
    AdComponent,
  ],

})
export class FreemiumModule { }
