import { Component, OnInit } from '@angular/core';
import {
  IonImg,
  IonButton,
  IonSkeletonText,
  IonAvatar
} from '@ionic/angular/standalone';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';

@Component({
  selector: 'convert-to-hub-sol-box',
  templateUrl: './convert-to-hub-sol-box.component.html',
  styleUrls: ['./convert-to-hub-sol-box.component.scss'],
  standalone: true,
  imports: [IonAvatar, ChipComponent, IonButton, IonSkeletonText, IonImg]
})
export class ConvertToHubSOLBoxComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}
  // stake position from native and liquid staking
  assetsDetected = [
    {
      name: "Solana",
      icon: "solana.svg"
    },
    {
      name: "Lido",
      icon: "lido.svg"
    },
    {
      name: "Staked SOL",
      icon: "staked-sol.svg"
    }
  ]
}
