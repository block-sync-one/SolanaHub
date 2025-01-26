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
import { JupStoreService, NativeStakeService,  SolanaHelpersService,  UtilService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { StakeBoxWrapperComponent } from './stake-form/stake-box-wrapper.component';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';

import { addIcons } from 'ionicons';
import { gitBranchOutline, hourglassOutline, leafOutline, statsChartOutline } from 'ionicons/icons';
import { StakeService } from './stake.service';
import { StakePositionsComponent } from './stake-positions/stake-positions.component';

interface ValidatorDataItem {
  title: string;
  desc: WritableSignal<number | string>;
  isSignal?: boolean;
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
    IonSkeletonText,
    StakeBoxWrapperComponent,
    StakePositionsComponent
  ]
})
export class StakingPage implements OnInit {

  public validatorData: ValidatorDataItem[] = [
    {
      title: 'Validator Since',
      desc: signal(2021),
    },
    {
      title: 'Total Staked',
      desc: signal(null),
    },
    {
      title: 'Uptime',
      desc: signal(null),
    }
  ]
  constructor(
    private _util: UtilService,
    private _jupStore: JupStoreService,
    private _lss: LiquidStakeService,
    private _nst: NativeStakeService,
    private _stakeService: StakeService,
    private _shs: SolanaHelpersService
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
    const {publicKey} = this._shs.getCurrentWallet();
    this._stakeService.updateStakePositions(publicKey.toBase58());
    // this._nst.getSolanaHubValidatorInfo().then(info => {
    //   this.validatorData[1].desc.set(
    //     this._util.formatBigNumbers(info.activated_stake) + ' SOL'
    //   );
    //   this.validatorData[2].desc.set(
    //     info.uptime.toString() + '%'
    //   );
    // });

    this._lss.getStakePoolList().then(pl => this.stakePools.set(pl));
  }

}
