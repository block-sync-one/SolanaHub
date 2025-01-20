import { Component, inject, OnInit, signal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonImg
} from '@ionic/angular/standalone';
import { StakeService } from '../../stake.service';
import { StakeAbleAsset } from '../stake-form.component';
import { AsyncPipe } from '@angular/common';
import { filter, map } from 'rxjs';
import { PositionComponent } from '../../stake-positions/stake/position.component';
import { PopoverController } from '@ionic/angular';
@Component({
  selector: 'app-select-position',
  templateUrl: './select-position.component.html',
  styleUrls: ['./select-position.component.scss'],
  standalone: true,
  imports: [
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonImg,
    AsyncPipe,
    PositionComponent
  ]
})
export class SelectPositionComponent  implements OnInit {

  constructor(
    private _stakeService: StakeService, 
    private _popoverController: PopoverController
  ) { }
  public positions$ = this._stakeService.activePositions$;
  ngOnInit() {

  }

  onSelectAsset(event: any) {
    this._popoverController.dismiss(event);
  }
}
