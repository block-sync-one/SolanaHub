import { Component, computed, effect, ElementRef, HostListener, OnInit, signal, ViewChild, viewChild, WritableSignal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel, IonImg, IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { ChipComponent } from "../../../shared/components/chip/chip.component";

import { PercentPipe } from '@angular/common';
import { StakeFormComponent } from './stake-form/stake-form.component';
import { UnstakeFormComponent } from './unstake-form/unstake-form.component';
import { StakeService } from '../stake.service';
import { FreemiumModule } from '@app/shared/layouts/freemium/freemium.module';
import { ProUpgradeMessageComponent } from '@app/shared/layouts/freemium/pro-upgrade-message/pro-upgrade-message.component';
import { IsPremiumServiceDirective } from '@app/shared/directives';


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
    UnstakeFormComponent,
    FreemiumModule,
    ProUpgradeMessageComponent,
    IsPremiumServiceDirective
  ]
})
export class StakeBoxWrapperComponent implements OnInit {
  public loading = signal(false);
  public hubSOLpool = this._stakeService.hubSOLpool;
  public segmentedStakeView: WritableSignal<'stake' | 'unstake'> = signal('stake');
  public manualUnstakeLST = this._stakeService.manualUnstakeLST;

  constructor(
    private _stakeService: StakeService
  ) {
    effect(() => {
      if(this._stakeService.manualUnstakeLST()){
          this.segmentedStakeView.set('unstake');
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    // Component initialization if needed
  }

  onSegmentChange(event: any){
      this.segmentedStakeView.set(event.detail.value)
    
  }

  // Update the computed logic

}
