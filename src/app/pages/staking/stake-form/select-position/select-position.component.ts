import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonImg
} from '@ionic/angular/standalone';
import { LiquidStakeToken, StakeService } from '../../stake.service';
import { AsyncPipe } from '@angular/common';
import { filter, map } from 'rxjs';
import { PositionComponent } from '../../stake-positions/stake/position.component';
import { PopoverController } from '@ionic/angular';
import { PortfolioService } from 'src/app/services';

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
  @Input() formType: 'stake' | 'unstake' = 'stake';
  constructor(
    private _stakeService: StakeService, 
    private _popoverController: PopoverController,
    private _portfolioService: PortfolioService
  ) { }
  public positions$ = this._stakeService.activePositions$.pipe(
    map(positions => {
      positions = positions.filter(p => p.symbol != 'hubSOL');
      // add SOL item from the wallet only for stake form

      if (this.formType === 'stake') {
        const sol = this._portfolioService.tokens().find(t => t.address == "So11111111111111111111111111111111111111112");
        if(sol) {
          positions.push({
            ...sol,
            exchangeRate: 1,
            type: 'liquid'
          } as LiquidStakeToken);
        }
      }
      return positions;
    })
  );
  ngOnInit() {

  }

  onSelectAsset(event: any) {
    this._popoverController.dismiss(event);
  }
}
