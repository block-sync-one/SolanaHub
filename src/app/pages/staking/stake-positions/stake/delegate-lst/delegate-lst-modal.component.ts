import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { Stake, StakePool } from 'src/app/models';
import { StakeComponent } from '../stake.component';
import {
  IonLabel,
  IonInput, 
  IonImg,
  IonChip,
  IonSkeletonText,
   IonText, IonSegmentButton, IonAvatar } from '@ionic/angular/standalone';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { UtilService } from 'src/app/services';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
@Component({
  selector: 'delegate-lst-modal',
  templateUrl: './delegate-lst-modal.component.html',
  styleUrls: ['./delegate-lst-modal.component.scss'],
  standalone: true,
  imports: [IonAvatar, IonSegmentButton, IonImg, 
    StakeComponent, 
    IonLabel,
    IonInput,
    DecimalPipe,
    IonChip,
    IonSkeletonText,
     IonText,
     PercentPipe
  ]
})
export class DelegateLSTModalComponent implements OnInit{
  @Input() stake:Stake;
  @Input() targetStake: Stake;
  @Output() onSelectPool = new EventEmitter()
  public stakePools: StakePool[]
  public selectedPool: StakePool;

constructor(private _lss: LiquidStakeService){

}
  async ngOnInit() {
    
    const _listedPools = ['solanahub staked sol','solblaze','the vault']
    if(this.stake.validator.vote_identity !== '7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh' ){
     // find and remove solanahub staked sol from the list
      _listedPools.splice(_listedPools.indexOf('solanahub staked sol'), 1)
    }
    const SP = await this._lss.getStakePoolList()
    this.stakePools = SP.filter(p => _listedPools.includes(p.poolName.toLowerCase()))
    
   }
   imagesLoaded = {};
   loadImage(uniqueId) {
     this.imagesLoaded[uniqueId] = true;
   }
   selectPool(pool: StakePool){
    this.selectedPool = pool;
    this.onSelectPool.emit({pool})
  }

}
