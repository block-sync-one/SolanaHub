import { Component, effect, OnInit, signal } from '@angular/core';
import { IonLabel, IonText } from '@ionic/angular/standalone';
import { PositionComponent } from '../../../stake-positions/stake/position.component';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { IonIcon } from '@ionic/angular/standalone';
import { EpochProgressBarComponent } from '../../../epoch-progress-bar/epoch-progress-bar.component';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { StakeAccount, StakeService } from '@app/pages/staking/stake.service';
import { take } from 'rxjs';

@Component({
  selector: 'slow-unstake-wizard',
  templateUrl: './slow-unstake-wizard.component.html',
  styleUrls: ['./slow-unstake-wizard.component.scss'],
  standalone: true,
  imports: [IonLabel, PositionComponent, ChipComponent, IonIcon, EpochProgressBarComponent, IonText]
})
export class SlowUnstakeWizardComponent  implements OnInit {
  public stakePosition: StakeAccount = null;
  constructor(
    private _shs: SolanaHelpersService,
    private _tx: TxInterceptorService,
    private _lss: LiquidStakeService, private _stakeService: StakeService) {
    addIcons({arrowForwardOutline});
    effect(() => {
      console.log(this._lss.unstakeAccount());
      if(this._lss.unstakeAccount()){
        console.log('listen to value change');
        
        this._shs.connection.onAccountChange(this._lss.unstakeAccount(), async (accountInfo) => {
          const {publicKey} = this._shs.getCurrentWallet();
          await this._stakeService.updateStakePositions(publicKey.toString());
          this._stakeService.nativePositions$.pipe(take(1)).subscribe((positions) => {
            this.stakePosition = positions.find(position => position.address == this._lss.unstakeAccount().toBase58());
            console.log('stakePosition', this.stakePosition, positions);
            this.slowUnstakeWizard.set('account-ready');
          });
          console.log('accountInfo', accountInfo);

        },{commitment: 'confirmed'});
      }
    });
   }
  
  ngOnInit() {

  }
  slowUnstakeWizard = signal('signed');
}
