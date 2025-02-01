import { Component, OnInit, ViewChild } from '@angular/core';
import { StakeService } from '../stake.service';
import { map, ReplaySubject, shareReplay } from 'rxjs';
import { PositionComponent } from './stake/position.component';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { IonSkeletonText,  IonLabel, IonText, IonAccordionGroup, IonAccordion } from "@ionic/angular/standalone";
import { JupStoreService } from 'src/app/services';
import { StakeEpochComponent } from './stake-epoch/stake-epoch.component';
import { ProInsightsComponent } from './pro-insights/pro-insights.component';

@Component({
  selector: 'stake-positions',
  templateUrl: './stake-positions.component.html',
  styleUrls: ['./stake-positions.component.scss'],
  standalone: true,
  imports: [ProInsightsComponent, StakeEpochComponent, IonText, IonLabel, IonSkeletonText, PositionComponent, AsyncPipe, ChipComponent, CurrencyPipe, IonAccordionGroup, IonAccordion]
})
export class StakePositionsComponent implements OnInit {
  public solPrice = this._jupStore.solPrice;
  constructor(private _jupStore: JupStoreService,private _stakeService: StakeService) { }
  @ViewChild('accordionGroup', { static: true }) accordionGroup!: IonAccordionGroup;

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
        // Only include liquid value for active state
        const totalLiquidValue = state === 'active' 
          ? positions?.liquid?.reduce((acc, position) => acc + position.balance * position.exchangeRate * this.solPrice(), 0) || 0
          : 0;
        const totalValue = Number(totalNativeValue) + Number(totalLiquidValue);
        const group = {
          state,
          description: stateDesc[state],
          totalValue,
          avgAPY,
          positions: nativePositions
        }
        return group;
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
  alternateClick(ev){
    if(ev.target.id !== 'toggle-btn'){
      ev.stopPropagation()
    }
  }
  toggleAccordion () {
    const nativeEl = this.accordionGroup;
    if (nativeEl.value === 'first') {
      nativeEl.value = undefined;
    } else {
      nativeEl.value = 'first';
    }

  };
}
