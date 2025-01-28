import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IonButton,
  IonRippleEffect,
  IonText,
  IonIcon,
  IonToggle,
  IonSkeletonText, IonPopover } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { trashOutline, ellipsisVertical, reloadOutline } from 'ionicons/icons';
import {
  WalletAddressAction,
  WalletPortfolioPopoverComponent
} from "../wallet-portfolio-popvover/wallet-portfolio-popover.component";
import { PopoverController } from "@ionic/angular";

@Component({
  selector: 'portfolio-box',
  templateUrl: './portfolio-box.component.html',
  styleUrls: ['./portfolio-box.component.scss'],
  standalone: true,
  imports: [
    IonPopover,
    IonToggle,
    IonIcon,
    IonText,
    IonRippleEffect,
    CurrencyPipe,
    IonSkeletonText,
    IonButton
  ],
   changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioBoxComponent  {

  @Input() isPrimary = false;
  @Input() wallet: { walletAddressShort: string, walletAddress: string, value: number, enabled: boolean, nickname: string };

  @Output() update = new EventEmitter<string>()
  @Output() delete = new EventEmitter<string>()
  @Output() toggle = new EventEmitter<string>()
  @Output() reload = new EventEmitter<string>()
  constructor(private popoverController: PopoverController) {
    addIcons({ellipsisVertical,reloadOutline,trashOutline});
  }

  toggleWallet(walletAddress: string) {
    this.toggle.emit(walletAddress)
  }

  async presentPopover(event: Event, walletAddress: string) {
    const popover = await this.popoverController.create({
      component: WalletPortfolioPopoverComponent, // Create a separate component for the popover content
      cssClass: 'portfolio-box-popover',
      event,
      componentProps: {
        isPrimary: this.isPrimary
      },
      backdropDismiss: true,
      showBackdrop: false,
      dismissOnSelect: true,
    });
    await popover.present();

    const {data} = await popover.onDidDismiss();
    switch (data) {
      case WalletAddressAction.UPDATE:
        this.update.emit(walletAddress)
        break;
      case WalletAddressAction.DELETE:
        this.delete.emit(walletAddress)
        break;
      case WalletAddressAction.RELOAD:
        this.reload.emit(walletAddress)
        break;
    }
  }
}
