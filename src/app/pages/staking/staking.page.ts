import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormComponent } from './form/form.component';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonHeader,
  IonImg,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonSkeletonText,
  IonProgressBar,
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { JupStoreService, PriceHistoryService, SolanaHelpersService, UtilService } from 'src/app/services';
import { Validator } from 'src/app/models';
import { forkJoin, map, take } from 'rxjs';
import { PositionsComponent } from './positions/positions.component';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { MenuComponent } from 'src/app/shared/components/menu/menu.component';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { gitBranchOutline, hourglassOutline, leafOutline, statsChartOutline } from 'ionicons/icons';
interface ValidatorsStats {
  numberOfValidators: number,
  clusterAPY: number,
  epoch: { number: number, eta: number }
  totalStake: number
}
@Component({
  selector: 'app-staking',
  templateUrl: './staking.page.html',
  styleUrls: ['./staking.page.scss'],
  standalone: true,
  imports: [

    PageHeaderComponent,
    IonGrid,
    IonRow,
    IonCol,
    IonContent,
    IonProgressBar,
    PositionsComponent,

    IonSkeletonText,
    FormComponent,
    IonIcon
  ]
})
export class StakingPage implements OnInit {
  public validatorsStats: WritableSignal<ValidatorsStats> = signal(null);
  public validatorsList = signal([] as Validator[])
  private _validatorsData$ = forkJoin({
    validatorsList: this._shs.getValidatorsList(),
    avgAPY: this._shs.getAvgApy(),
    epochInfo: this._shs.getEpochInfo(),
    totalStake: this._shs.getClusterStake()
  }).pipe(map(data => {
    this.validatorsList.set(data.validatorsList)
    this.validatorsData = [

      {
        title: 'Cluster APY',
        icon: 'stats-chart-outline',
        desc: data.avgAPY + '%',
      },
      {
        title: 'Total SOL staked',
        icon: 'leaf-outline',
        //@ts-ignore
        desc: this._util.formatBigNumbers(data.totalStake.activeStake),
      },
      {
        icon: 'git-branch-outline',
        title: 'Validators',
        desc: this._util.decimalPipe.transform(data.validatorsList.length),
      },
      {
        icon: 'hourglass-outline',
        title: 'EPOCH ' + data.epochInfo.epoch,
        desc: data.epochInfo.ETA,
        extraData: data.epochInfo
      },
    ]
  }
  ))

  public validatorsData: any = [
    {
      icon: 'stats-chart-outline',
      title: 'Cluster APY',
      desc: ''
    },
    {
      icon: 'leaf-outline',
      title: 'Total SOL staked',
      desc: ''
    },
    {
      icon: 'git-branch-outline',
      title: 'Validators',
      desc: ''
    },
    {
      icon: 'hourglass-outline',
      title: 'EPOCH ',
      desc: ''
    },
  ]
  constructor(
    private _shs: SolanaHelpersService,
    private _util: UtilService,
    private _jupStore: JupStoreService,
    private _lss: LiquidStakeService,

  ) {
    addIcons({
      gitBranchOutline,
      statsChartOutline,
      hourglassOutline,
      leafOutline
    })
  }
  public solPrice = this._jupStore.solPrice;
  public stakePools = signal([])

  ngOnInit() {

    this._validatorsData$.pipe(take(1)).subscribe()
    this._lss.getStakePoolList().then(pl => this.stakePools.set(pl));
  }

}
