import { Component, inject, Input, OnInit, signal } from '@angular/core';
import {
  IonContent,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { LiquidStakeToken, StakeAccount } from '@app/models';
import { StakeService } from '@app/pages/staking/stake.service';
import { AsyncPipe } from '@angular/common';
import { filter, map } from 'rxjs';
import { PositionComponent } from '../../stake-positions/stake/position.component';
import { PopoverController } from '@ionic/angular';
import { NativeStakeService, PortfolioService } from 'src/app/services';

@Component({
  selector: 'app-select-position',
  templateUrl: './select-position.component.html',
  styleUrls: ['./select-position.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    PositionComponent,
    IonSkeletonText
  ]
})
export class SelectPositionComponent  implements OnInit {
  @Input() formType: 'stake' | 'unstake' = 'stake';
  constructor(
    private _stakeService: StakeService, 
    private _popoverController: PopoverController,
    private _portfolioService: PortfolioService,
    private _nss: NativeStakeService
  ) { }
  public positions$ = this._stakeService.activePositions$.pipe(
    map((positions: (LiquidStakeToken | StakeAccount)[]) => {
      // add SOL item from the wallet only for stake form
      console.log(positions);
      
      if (this.formType === 'stake') {
        positions = positions.filter(p => 
          p.symbol !== 'hubSOL' && 
          (!('validator' in p) || p.validator.vote_identity === this._nss.SolanaHubVoteKey)
        );
        console.log(positions);
        
        const sol = this._portfolioService.tokens().find(t => t.address == "So11111111111111111111111111111111111111112");
        if(sol) {
          positions.push({
            ...sol,
            exchangeRate: 1,
            source: 'liquid'
          } as LiquidStakeToken);
        }
      }
      if (this.formType === 'unstake') {
        positions = positions.filter(p => p.source == 'liquid');
      }
      return positions;
    })
  );
  ngOnInit() {

  }

  onSelectAsset(position: StakeAccount | LiquidStakeToken) {
    this._popoverController.dismiss(position);
  }
}
