import {Component, inject, OnInit, signal, Input} from '@angular/core';
import {PopoverController} from "@ionic/angular";
import {IonButton, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonText} from "@ionic/angular/standalone";
import {addIcons} from "ionicons";
import {alertCircleOutline, closeOutline, walletOutline } from "ionicons/icons";
import {AddressValidatorService, PortfolioService} from "../../../../services";

@Component({
  selector: 'add-portfolio-popup',
  templateUrl: './add-portfolio-popup.component.html',
  styleUrls: ['./add-portfolio-popup.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonImg,
    IonInput,
    IonLabel,
    IonText,
    IonIcon,
  ]
})
export class AddPortfolioPopupComponent {
  private _popover = inject(PopoverController)
  private _addressValidatorService = inject(AddressValidatorService)
  private _portfolioService = inject(PortfolioService)
  @Input() walletAddress?: string
  // const testAddress = 'HUB3kyuE5kLojcsJn4csoN5Gd27mJpERzTqVuoUTTmUV';

  public errorMessage = signal(null)
  public duplicatedWallet = "Oops! wallet already added."
  public invalidWallet = "Oops! invalid wallet"

  constructor() {
    addIcons({walletOutline,alertCircleOutline,closeOutline});
  }

  addNewPortfolio(walletAddress: any, nickname: any) {
    if (!this._addressValidatorService.isValid(walletAddress)) {
      this.errorMessage.set(this.invalidWallet);
      return
    }

    if(this._portfolioService.containsWallet(walletAddress)) {
      this.errorMessage.set(this.duplicatedWallet);
      return;
    }

    this.errorMessage.set(null);
    this.dismissModal(walletAddress, nickname)
  }

  dismissModal(address?: string | null, nickname?: string | null) {
    this._popover.dismiss({address, nickname})
  }
}
