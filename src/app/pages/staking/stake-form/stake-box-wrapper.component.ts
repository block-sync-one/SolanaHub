import { Component, effect, OnInit, signal, WritableSignal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel, IonImg, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ChipComponent } from "../../../shared/components/chip/chip.component";


import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { PercentPipe } from '@angular/common';
import { StakeFormComponent } from './stake-form/stake-form.component';
import { UnstakeFormComponent } from './unstake-form/unstake-form.component';


@Component({
  selector: 'stake-box-wrapper',
  templateUrl: './stake-box-wrapper.component.html',
  styleUrls: ['./stake-box-wrapper.component.scss'],
  standalone: true,
  imports: [
    IonImg,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    ChipComponent,
    IonSkeletonText,
    PercentPipe,
    StakeFormComponent,
    UnstakeFormComponent
  ]
})
export class StakeBoxWrapperComponent implements OnInit {
  public loading = signal(false);
  public hubSOLApy = signal(null);
  public hubSOLExchangeRate = signal(null);

  constructor(
    private _lss: LiquidStakeService,
  ) {
    this._lss.getStakePoolList().then(sp => {
      const {apy, exchangeRate} = sp.find(s => s.tokenMint === "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX")
      this.hubSOLApy.set(apy)
      this.hubSOLExchangeRate.set(exchangeRate)
    })
  }

  async ngOnInit() {
    // Component initialization if needed
  }
}
