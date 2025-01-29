import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { NgIf } from "@angular/common";
import { PopoverController } from "@ionic/angular";

export enum WalletAddressAction {
  RELOAD,
  DELETE,
  UPDATE,
}

@Component({
  selector: 'app-wallet-portfolio-popover',
  templateUrl: './wallet-portfolio-popover.component.html',
  styleUrls: ['./wallet-portfolio-popover.component.scss'],
  imports: [
    IonButton,
    IonIcon,
    NgIf
  ],
  standalone: true
})
export class WalletPortfolioPopoverComponent {
  private _popoverCtr = inject(PopoverController);
  @Input() isPrimary = false;
  protected readonly WalletAddressAction = WalletAddressAction;

  @Output() action = new EventEmitter<WalletAddressAction>()

  async onActionClicked(action: WalletAddressAction) {
    await this._popoverCtr.dismiss(action)
  }

}
