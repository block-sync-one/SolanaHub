import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, computed, effect } from '@angular/core';
import { PortfolioService, UtilService } from 'src/app/services';
import {  IonButton, IonImg,IonSkeletonText, IonIcon } from '@ionic/angular/standalone';
import { DecimalPipe } from '@angular/common';
import { Token } from 'src/app/models';
import { walletOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'input-label',
  templateUrl: './input-label.component.html',
  styleUrls: ['./input-label.component.scss'],
  standalone: true,
  imports:[ IonButton,  IonSkeletonText, IonIcon]
})
export class InputLabelComponent  implements OnInit, OnChanges  {
  public walletTokens = this._portfolioService.tokens
  @Input() label: string;
  @Input() showBtns: boolean = true;
  @Input() asset: Token;
  @Output() onSetSize = new EventEmitter()
  constructor(private _portfolioService: PortfolioService, public utils: UtilService) {
    addIcons({walletOutline});

   }
   ngOnChanges(changes: SimpleChanges): void {
   console.log('this.asset', this.asset)
   }
ngOnInit(): void {
  
}

  setSize(size: 'half' | 'max'){

    let amount = Number(this.utils.fixedNumber(this.asset.balance))

    if(size === 'half'){
      amount = amount / 2
    }

    this.onSetSize.emit(amount)
  }

}
