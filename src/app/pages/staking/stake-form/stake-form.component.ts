import { Component, effect, OnInit, signal } from '@angular/core';
import {
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  IonLabel, IonImg } from '@ionic/angular/standalone';
import { ChipComponent } from "../../../shared/components/chip/chip.component";
import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box/convert-to-hub-sol-box.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from './input/input.component';
import { StakeService } from '../stake.service';
import { map } from 'rxjs';

export interface StakeAbleAsset {
  logoURI: string;
  symbol: string;
  balance: string;
  address: string;
  mint: string;
  type: 'token' | 'stakeAccount';
}
@Component({
  selector: 'stake-form',
  templateUrl: './stake-form.component.html',
  styleUrls: ['./stake-form.component.scss'],
  standalone: true,
  imports: [IonImg, 
    IonSegment,
    IonSegmentButton,
    IonLabel,
    ChipComponent,
    IonSkeletonText,
    ConvertToHubSOLBoxComponent,
    ReactiveFormsModule,
    InputComponent
  ]
})
export class StakeFormComponent implements OnInit {

  constructor(private _stakeService: StakeService) {
   }
  public positions = this._stakeService.stakePositions$
  ngOnInit() { 
    // this._stakeService.updateStakePositions(this._walletService.walletAddress);
  }
  
  public stakeAbleAssets = signal<StakeAbleAsset[]>([
    {
      logoURI: 'assets/images/sol.svg',
      symbol: 'SOL',
      balance: '100',
      address: '11111111111111111111111111111111',
      mint: '11111111111111111111111111111111',
      type:'token',
    }
  ] as StakeAbleAsset[])
  public stakeForm = new FormGroup({
    asset: new FormControl(this.stakeAbleAssets()[0]),
    amount: new FormControl(0),
    assetType: new FormControl(null), // stake account or liquid asset(SOL/LST)
  });

  public unstakeForm = new FormGroup({
    asset: new FormControl(null),
    amount: new FormControl(null),
    assetType: new FormControl(null),
    unstakeType: new FormControl('instant'), // instant or delayed
  });
}
