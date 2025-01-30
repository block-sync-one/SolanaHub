import { NgModule } from '@angular/core';
import {IonIcon, IonImg, IonButton, IonLabel, IonContent} from '@ionic/angular/standalone';
import {
  PopupPlanComponent,
  BadgeComponent,
  RoadComponent,
  AdComponent,
} from './';
import { CommonModule } from '@angular/common';
import { ChipComponent } from '../../components/chip/chip.component';
import {RouterLink} from "@angular/router";
import {IsProDirective} from "@app/shared/directives/is-pro.directive";


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
    RouterLink,
    IonContent,
    IsProDirective
  ],
  exports: [
    PopupPlanComponent,
    BadgeComponent,
    RoadComponent,
    AdComponent,
  ],

})
export class FreemiumModule { }
