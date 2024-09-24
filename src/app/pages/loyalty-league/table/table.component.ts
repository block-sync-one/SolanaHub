import { AfterViewInit, Component, Input, OnInit, Signal, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { IonIcon, IonImg } from '@ionic/angular/standalone';
import { MftModule } from 'src/app/shared/layouts/mft/mft.module';
import { CopyTextDirective } from 'src/app/shared/directives/copy-text.directive';
import {  LeaderBoard, loyaltyLeagueMember, Tier } from 'src/app/models';
import { DecimalPipe } from '@angular/common';
import { LoyaltyLeagueService } from 'src/app/services/loyalty-league.service';
import { SolanaHelpersService, UtilService } from 'src/app/services';
import { toSignal } from '@angular/core/rxjs-interop';
@Component({
  selector: 'll-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  standalone: true,
  imports: [
    MftModule,
    IonImg,
    IonIcon,
    DecimalPipe,
    CopyTextDirective
  ]
})
export class TableComponent implements OnInit, AfterViewInit {
  @ViewChild('addressTpl', { static: true }) addressTpl: TemplateRef<any> | any;
  @Input() tiers: Tier[] = [];
  constructor(
    private _loyaltyLeagueService: LoyaltyLeagueService,
  ) {

  }

  public leaderBoard = toSignal<loyaltyLeagueMember[]>(this._loyaltyLeagueService.getLeaderBoard());



  public getTierIcon(daysLoyal: number) {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (daysLoyal >= this.tiers[i].loyaltyDaysRequirement) {
        return this.tiers[i].iconFull;
      }
    }
    return  ''
  }
  public columns: WritableSignal<any[]> = signal([]);


  ngAfterViewInit(): void {
    this.columns.set(this.regularTemplate())
    // this.leaderBoard = toSignal(this._loyaltyLeagueService.getLeaderBoard().pipe(
    //   combineLatestWith(this._shs.walletExtended$),
    //   switchMap(async ([ll, wallet]) => {
  
  
    //     // const prizePool = await firstValueFrom(this._loyaltyLeagueService.getPrizePool())
    //     let loyaltyLeagueExtended = ll.loyaltyLeagueMembers.map((staker: loyaltyLeagueMember, i: number) => {
    //       let loyaltyPoints = staker.totalPts
    //       return {
    //         rank: i + 1,
    //         walletOwner: this._utilService.addrUtil(staker.walletOwner),
    //         tierIcon: this.getTierIcon(staker.daysLoyal),
    //         daysLoyal: staker.daysLoyal,
    //         stakingPts: staker.stakingPts,
    //         daoPts: staker.daoPts,
    //         referrals: staker.referralPts,
    //         // questsPts: staker.questsPts,
    //         totalPoints: this._utilService.formatBigNumbers(loyaltyPoints),
    //       }
    //     })
    //     if (wallet) {
    //       loyaltyLeagueExtended.sort((x, y) => { return x.walletOwner.addr === wallet.publicKey.toBase58() ? -1 : y.walletOwner === wallet.publicKey.toBase58() ? 1 : 0; });
  
    //     }
    //     return loyaltyLeagueExtended
    //   }))) as any
  }
  ngOnInit() { }
  public regularTemplate() {
    return [
      // { key: 'rank', title: 'Rank', width: '10%', cssClass: { name: 'ion-text-left', includeHeader: true } },
      { key: 'walletOwner', title: 'Wallet address', width: '40%', cellTemplate: this.addressTpl, cssClass: { name: 'ion-text-left', includeHeader: true } },
      { key: 'stakingPts', title: 'Staking points', cssClass: { name: 'ion-text-center', includeHeader: true } },
      { key: 'daoPts', title: 'DAO points', cssClass: { name: 'ion-text-center', includeHeader: true } },
      // { key: 'questsPts', title: 'Quests', cssClass: { name: 'ion-text-center', includeHeader: true } },
      { key: 'referralPts', title: 'Referrals', cssClass: { name: 'ion-text-center', includeHeader: true } },
      { key: 'totalPts', title: 'Total Points', cssClass: { name: 'bold-text', includeHeader: true } },
    ]
  }
}
