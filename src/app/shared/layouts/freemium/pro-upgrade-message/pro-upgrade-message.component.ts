import { Component, inject } from '@angular/core';
import {
  IonButton,
  IonText,
} from "@ionic/angular/standalone";

import { FreemiumService } from '@app/shared/layouts/freemium';
import { ChipComponent } from "../../../components/chip/chip.component";
import { NgIf } from '@angular/common';
import { IsProDirective } from "@app/shared/directives/is-pro.directive";

@Component({
  selector: 'pro-upgrade-message',
  templateUrl: './pro-upgrade-message.component.html',
  styleUrls: ['./pro-upgrade-message.component.scss'],
  imports: [
    IonButton,
    IonText,
    ChipComponent,
    NgIf,
    IsProDirective
  ],
  standalone: true
})
export class ProUpgradeMessageComponent {
  private _freemiumService = inject(FreemiumService);
  public isPremium = this._freemiumService.isPremium;
}
