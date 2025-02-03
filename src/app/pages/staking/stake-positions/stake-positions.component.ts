import { Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { StakeService } from '../stake.service';
import { map, ReplaySubject, shareReplay } from 'rxjs';
import { PositionComponent } from './stake/position.component';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { IonSkeletonText,  IonLabel, IonText, IonAccordionGroup, IonAccordion } from "@ionic/angular/standalone";
import { JupStoreService } from 'src/app/services';
import { StakeEpochComponent } from './stake-epoch/stake-epoch.component';
import { ProInsightsComponent } from './pro-insights/pro-insights.component';

// Add these interfaces/types at the top
interface StakeGroup {
  state: StakeState;
  description: string;
  totalValue: number;
  avgAPY: number | null;
  positions: any[]; // Type this properly based on your position interface
}

type StakeState = 'active' | 'inactive' | 'deactivating' | 'activating';

@Component({
  selector: 'stake-positions',
  templateUrl: './stake-positions.component.html',
  styleUrls: ['./stake-positions.component.scss'],
  standalone: true,
  imports: [ProInsightsComponent, StakeEpochComponent, IonText, IonLabel, IonSkeletonText, PositionComponent, AsyncPipe, ChipComponent, CurrencyPipe, IonAccordionGroup, IonAccordion]
})
export class StakePositionsComponent implements OnInit {
  // Move constants outside of the data stream
  private readonly STAKE_STATES: StakeState[] = ['active', 'inactive', 'deactivating', 'activating'];
  private readonly STATE_DESCRIPTIONS = {
    active: "Your stake earns stake rewards every epoch",
    inactive: "Your stake is ready for withdrawal",
    deactivating: "Your stake will be withdrawable next epoch",
    activating: "Your stake starts earning rewards next epoch"
  } as const;

  private readonly STATE_COLORS = {
    active: 'focus',
    deactivating: 'danger',
    activating: 'active',
    inactive: ''
  } as const;

  currentAccordionIndex: number | null = null;
  public solPrice = this._jupStore.solPrice;

  @ViewChild('accordionGroup', { static: true }) accordionGroup!: IonAccordionGroup;
  @ViewChildren('positionRef') positionRef!: QueryList<PositionComponent>;

  public positions$ = this._stakeService.stakePositions$.pipe(
    map(positions => {

      if (!positions) return null;

      const groups = this.STAKE_STATES.map(state => {
        const nativePositions = positions.native.filter(position => position.state === state);
        const avgAPY = this.calculateAverageAPY(state, nativePositions, positions.liquid);
        const totalValue = this.calculateTotalValue(state, nativePositions, positions.liquid);

        const group: StakeGroup = {
          state,
          description: this.STATE_DESCRIPTIONS[state],
          totalValue,
          avgAPY,
          positions: nativePositions
        };
        return group;
      });

      // Add liquid positions to active group
      const activeGroup = groups.find(group => group.state === 'active');
      if (activeGroup && positions.liquid) {
        activeGroup.positions.push(...positions.liquid);
      }
      console.log(groups);
      
      return groups;
    }),
    shareReplay(1)
  );

  constructor(
    private _jupStore: JupStoreService,
    private _stakeService: StakeService
  ) { }

  ngOnInit(): void { }

  onAccordionChange(event: { detail: { value: number } }): void {
    this.currentAccordionIndex = event.detail.value;
  }

  getGroupColor(state: StakeState): string {
    return this.STATE_COLORS[state];
  }

  alternateClick(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).id !== 'toggle-btn') {
      ev.stopPropagation();
    }
    
    setTimeout(() => {
      this.positionRef.forEach((position, index) => {
        position.isOpenProInsight = Number(this.currentAccordionIndex) === index;
      });
    }, 100);
  }

  toggleAccordion(): void {
    try{
      this.accordionGroup.value = this.accordionGroup.value === 'first' ? undefined : 'first';
    }catch(e){
      console.log(e);
    }
  }

  private calculateAverageAPY(state: StakeState, nativePositions: any[], liquidPositions?: any[]): number | null {
    if (state !== 'active') return null;

    const nativeAPY = this.calculatePositionsAPY(nativePositions);
    const liquidAPY = liquidPositions ? this.calculatePositionsAPY(liquidPositions) : 0;
    
    const totalPositions = nativePositions.length + (liquidPositions?.length || 0);
    return totalPositions > 0
      ? Number(((nativeAPY * nativePositions.length + liquidAPY * (liquidPositions?.length || 0)) / totalPositions).toFixed(2))
      : 0;
  }

  private calculatePositionsAPY(positions: any[]): number {
    return positions.length > 0
      ? positions.reduce((acc, position) => acc + (Number(position.validator?.total_apy || position.apy) || 0), 0) / positions.length
      : 0;
  }

  private calculateTotalValue(state: StakeState, nativePositions: any[], liquidPositions?: any[]): number {
    const totalNativeValue = nativePositions.reduce(
      (acc, position) => acc + position.balance * position.exchangeRate * this.solPrice(), 
      0
    );

    const totalLiquidValue = state === 'active' && liquidPositions
      ? liquidPositions.reduce((acc, position) => acc + position.balance * position.exchangeRate * this.solPrice(), 0)
      : 0;

    return Number(totalNativeValue) + Number(totalLiquidValue);
  }
}
