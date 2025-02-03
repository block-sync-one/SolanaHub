import { Component, computed, Input, OnChanges, signal, SimpleChanges } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

import { IonButton, IonRow, IonCol, IonIcon, IonImg, IonTitle, IonLabel, IonSkeletonText, IonInput } from '@ionic/angular/standalone';
import { AsyncPipe, DecimalPipe, JsonPipe, KeyValuePipe, NgStyle } from '@angular/common';
import { addIcons } from 'ionicons';
import { copyOutline, discOutline, informationCircleOutline } from 'ionicons/icons';
import { CopyTextDirective } from 'src/app/shared/directives/copy-text.directive';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
import { ModalController } from '@ionic/angular';
import { loyaltyLeagueMember, Tier } from 'src/app/models';
import { ReferAFriendModalComponent, LoyaltyPathComponent, LoyaltyBadgeComponent } from '../';
import { NumberCounterComponent } from "../../../shared/components/number-counter/number-counter.component";
import { LoyaltyLeagueService } from 'src/app/services/loyalty-league.service';
import { distinctUntilChanged, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { SolanaHelpersService, UtilService } from 'src/app/services';
import { CodesComponent } from './codes/codes.component';
import { QuestsComponent } from '../quests/quests.component';
// import { LoyaltyBadgeComponent } from './loyalty-badge/loyalty-badge.component';
import { PopoverController } from '@ionic/angular';
import va from '@vercel/analytics'; 

@Component({
  selector: 'app-member-stats',
  templateUrl: './member-stats.component.html',
  styleUrls: ['./member-stats.component.scss'],
  standalone: true,
  imports: [
    TooltipModule,
    IonSkeletonText, 
    IonLabel,
    JsonPipe,
    KeyValuePipe,
    LoyaltyPathComponent,
    IonImg,
    LoyaltyBadgeComponent,
    TooltipModule,
    DecimalPipe,
    AsyncPipe,


    IonRow,
    IonCol,

    IonIcon,
   ],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void <=> *', animate('300ms ease-in-out'))
    ])
  ]
})
export class MemberStatsComponent implements OnChanges {
  public communityBanner = signal('')
  constructor(
    private _modalCtrl: ModalController,
    private _loyaltyLeagueService: LoyaltyLeagueService,
    private _shs: SolanaHelpersService,
    public _popoverController: PopoverController,
    private _utilService: UtilService,
  ) {

    addIcons({discOutline,informationCircleOutline,copyOutline});
  }
  tiers: Tier[] = this._loyaltyLeagueService.tiers
  public wallet$ = this._shs.walletExtended$
  public member$: Observable<loyaltyLeagueMember> = this._loyaltyLeagueService.member$.pipe(

    map(member => {
      if(member.hubSOLBreakdown){
       member.hubSOLBreakdown = Object.entries(member.hubSOLBreakdown)
        .filter(([_, value]) => Number(value) >= 0.001)
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {}) as any;

      if(Object.keys(member.hubSOLBreakdown).length > 0){
     this.pointCategories.push({title: 'Snapshot', key:'hubSOLBreakdown', tooltip: 'Your current hubSOL holding according to last snapshot.'})
      }
      // this._loyaltyLeagueService.getSessionMetrics().pipe(take(1)).subscribe(metrics => {
      //   console.log('metrics', metrics);
      //   if(metrics.airdrop > 0){
      //     this.pointCategories.push({ title: 'Your airdrop', key: 'airdrop', tooltip: 'Your allocation base on your share in the points pool'  });
      //     member.airdrop = member.totalPts / metrics.totalPoints * metrics.airdrop
      //   }
      // })
      }
      return member
    }),
    shareReplay(1),
  ) 
  toFixedNoRounding(num: any) {
    return num.toFixedNoRounding(3)
  }
  ngOnChanges(changes: SimpleChanges): void {


  }
  formatToSignificantDigit(num) {
    console.log('original num:', num);

    // Convert the number to a string
    let numStr = num.toString();

    // Find the index of the first non-zero digit after the decimal point
    const decimalIndex = numStr.indexOf('.') + 1;
    const firstNonZeroIndex = decimalIndex + [...numStr.split('.')[1]].findIndex(char => char !== '0');

    // Determine if the number is greater than 0.01 or not
    if (num > 0.01) {
      // Slice the string to include two digits after the first significant digit
      numStr = numStr.slice(0, firstNonZeroIndex + 2);
    } else {
      // Slice the string to include one digit after the first significant digit
      numStr = numStr.slice(0, firstNonZeroIndex + 1);
    }

    return numStr;
  }
  public getDeFiImg(name: any) {
    return this._loyaltyLeagueService.supportedDeFi.find(defi => defi.title === name)?.img
  }
  public async openReferAFriendModal() {
    const refCode = this._loyaltyLeagueService._member.referralCode
    const modal = await this._modalCtrl.create({
      component: ReferAFriendModalComponent,
      componentProps: {
        refCode ,
      },
      cssClass: 'refer-a-friend-modal'
    });
    modal.present();
  }

  pointCategories = [
    { title: 'Staking', key: 'stakingPts', tooltip: 'Staking points are earned by staking your SOL or LST with SolanaHub validator.' },
    { title: 'DAO', key: 'daoPts', tooltip: 'DAO points are earned by participating in marinade and SolBlaze DAO tokens voting stake allocation towards SolanaHub validator. (check SolanaHub docs for more details)' },
    { title: 'Referrals', key: 'referralPts', tooltip: 'Referral points are earned by referred friends who stake with SolanaHub validator.' },
    { title: 'Quests', key: 'questsPts', tooltip: 'Quests are special activities that earn you points. Check the quests section for more details.'  },
  ];
  //'Bonus points earned from loyalty tier boost and quests.'
  public async openQuests(event: any) {
    va.track('loyalty league', { event: 'quests open' })
    const modal = await this._popoverController.create({
      component: QuestsComponent,
      cssClass: 'quests-modal',
      mode: 'ios',
      event: event,
    })
    modal.present();
  }
  public formatNumber(num: any) {
    return this._utilService.fixedNumber(num)
  }
}
