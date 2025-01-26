import { Component, inject, OnInit } from '@angular/core';
import { IonImg, IonRow, IonCol, IonSkeletonText } from "@ionic/angular/standalone";
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { map, Observable, shareReplay } from 'rxjs';
import { Season } from 'src/app/models';
import { LoyaltyLeagueService } from 'src/app/services/loyalty-league.service';
import { NumberCounterComponent } from 'src/app/shared/components/number-counter/number-counter.component';
import { UtilService } from 'src/app/services';

@Component({
  selector: 'season-stats',
  templateUrl: './season-stats.component.html',
  styleUrls: ['./season-stats.component.scss'],
  standalone: true,
  imports: [DecimalPipe, IonSkeletonText, IonCol, IonRow, IonImg,NumberCounterComponent, AsyncPipe]
})
export class SeasonStatsComponent  implements OnInit {

  private _utilService = inject(UtilService)
  public seasonStats$: Observable<Season> = inject(LoyaltyLeagueService).getSessionMetrics().pipe(shareReplay())

  ngOnInit() {}

  public formatBigNumber(number: number) {
    return this._utilService.formatBigNumbers(number)
  }
}
