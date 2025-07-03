import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output,  SimpleChanges, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import { IonInput } from '@ionic/angular/standalone';
import { Token } from 'src/app/models';
import { JupStoreService } from 'src/app/services';
@Component({
  selector: 'amount-input',
  templateUrl: './amount-input.component.html',
  styleUrls: ['./amount-input.component.scss'],
  standalone: true,
  imports:[IonInput, CurrencyPipe, DecimalPipe]
})
export class AmountInputComponent  implements OnInit, OnChanges {
  // @Input() inputAmount: NgControl
  @Input() token: Token;
  @Input() value: number;
  @Output() onValueChange = new EventEmitter();
  public tokenPrice = signal(0);
  public visibleValue = signal(0)
  constructor(private _jupStore: JupStoreService) { }
ngOnInit(): void {
  this.tokenPrice.set(this.token?.price || 0)
}
ngOnChanges(changes: SimpleChanges): void {
  //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
  //Add '${implements OnChanges}' to the class.
  this.visibleValue.set(this.value);
  if(!this.token.price && changes['token'].currentValue != changes['token'].currentValue){
    this.getTokenPrice();
  }
}
  valueChange(ev) {
    let value = ev.detail !== undefined ? ev.detail.value : ev
    // const definitelyValidValue = value.toString().indexOf(',') > 0 ? value.replaceAll(",", "") : value
    this.onValueChange.emit(value)
    // this.visibleValue.set(definitelyValidValue)
    // this.getTokenPrice();

  }
  getTokenPrice() {
    const { address } = this.token
    this._jupStore.fetchPriceFeed(address, 1).then(res => {
      const price = res[address]['usdPrice'];
      if (this.tokenPrice() != price) {
        this.tokenPrice.set(Number(price));
      }
    });
  }
}
