import { Component, OnInit } from '@angular/core';
import { StakeService } from '../stake.service';
import { map, ReplaySubject, shareReplay } from 'rxjs';
import { PositionComponent } from './stake/stake.component';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { IonSkeletonText,  IonLabel, IonText } from "@ionic/angular/standalone";
import { JupStoreService } from 'src/app/services';
import { StakeEpochComponent } from './stake-epoch/stake-epoch.component';

@Component({
  selector: 'stake-positions',
  templateUrl: './stake-positions.component.html',
  styleUrls: ['./stake-positions.component.scss'],
  standalone: true,
  imports: [StakeEpochComponent, IonText, IonLabel, IonSkeletonText, PositionComponent, AsyncPipe, ChipComponent, CurrencyPipe]
})
export class StakePositionsComponent implements OnInit {
  public solPrice = this._jupStore.solPrice;
  constructor(private _jupStore: JupStoreService,private _stakeService: StakeService) { }

  ngOnInit() { }
  public positions$ = this._stakeService.stakePositions$.pipe(
    map(positions => {
      if (!positions) return null;

      const states = ['active', 'inactive', 'deactivating', 'activating'];
      const stateDesc = {
        active: "Your stake earns stake rewards every epoch",
        inactive: "Your stake is ready for withdrawal",
        deactivating: "Your stake will be withdrawable next epoch",
        activating: "Your stake starts earning rewards next epoch"
      }
      const groups = states.map(state => {
        const nativePositions = positions?.native.filter(position => position.state === state);

        // Calculate APY only for active group
        let avgAPY = null;
        if (state === 'active') {


          const nativeAPY = nativePositions.length > 0
            ? nativePositions.reduce((acc, position) => {
              return acc + (Number(position.validator?.total_apy) || 0);
            }, 0) / nativePositions.length
            : 0;

          const liquidAPY = positions?.liquid?.length > 0
            ? positions.liquid.reduce((acc, position) => {
              return acc + (Number(position.apy) || 0);
            }, 0) / positions.liquid.length
            : 0;
          // Weighted average of native and liquid APYs
          const totalPositions = nativePositions.length + (positions?.liquid?.length || 0);
          avgAPY = totalPositions > 0
            ? ((nativeAPY * nativePositions.length + liquidAPY * (positions?.liquid?.length || 0)) / totalPositions).toFixed(2)
            : 0;
        }

        const totalNativeValue = nativePositions.reduce((acc, position) => acc + position.balance * position.exchangeRate * this.solPrice(), 0);
        const totalLiquidValue = positions?.liquid?.reduce((acc, position) => acc + position.balance * position.exchangeRate * this.solPrice(), 0);
        const totalValue = Number(totalNativeValue) + Number(totalLiquidValue);
        return {
          state,
          description: stateDesc[state],
          totalValue,
          avgAPY,
          positions: nativePositions
        }
      });

      // include liquid positions into active group
      groups.find(group => group.state === 'active').positions.push(...positions?.liquid as any);

      return groups;
    }),
    shareReplay(1)
  );

  getGroupColor(state: string): string {
    switch (state) {
      case 'active':
        return 'focus';
      case 'deactivating':
        return 'danger';
      case 'activating':
        return 'active';
      default:
        return '';
    }
  }
}
