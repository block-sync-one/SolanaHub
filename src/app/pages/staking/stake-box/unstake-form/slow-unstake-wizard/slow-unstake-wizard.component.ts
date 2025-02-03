import { Component, computed, effect, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { IonLabel, IonText } from '@ionic/angular/standalone';
import { PositionComponent } from '../../../stake-positions/stake/position.component';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { IonIcon } from '@ionic/angular/standalone';
import { EpochProgressBarComponent } from '../../../epoch-progress-bar/epoch-progress-bar.component';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { StakeAccount } from '@app/models';
import { take } from 'rxjs';
import { StakeService } from '@app/pages/staking/stake.service';

@Component({
  selector: 'slow-unstake-wizard',
  templateUrl: './slow-unstake-wizard.component.html',
  styleUrls: ['./slow-unstake-wizard.component.scss'],
  standalone: true,
  imports: [IonLabel, PositionComponent, ChipComponent, IonIcon, EpochProgressBarComponent, IonText]
})
export class SlowUnstakeWizardComponent  implements OnInit {
  @Input() stakePosition: StakeAccount = null;
  @Input() wizard: WritableSignal<string> = signal(null);
  constructor(
    private _txi: TxInterceptorService,
    private _shs: SolanaHelpersService,
    private _lss: LiquidStakeService, private _stakeService: StakeService) {
    addIcons({arrowForwardOutline});
    
   }
  
  ngOnInit() {

  }
}
