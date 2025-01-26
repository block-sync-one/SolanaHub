import { Component, computed, inject, Input, signal } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PopupPlanComponent } from '@app/shared/layouts/freemium';
import { FreemiumService } from '../freemium.service';

@Component({
  selector: 'freemium-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
})
export class BadgeComponent {
  @Input() set show(value: boolean) {
    this.showSignal.set(value);
  }
  private _freemiumService = inject(FreemiumService);
  private showSignal = signal(false)
  public isVisible = computed(() => this._freemiumService.isPremium() || this.showSignal());
  private _modalCtrl= inject(ModalController);

  async openFreemiumAccessPopup(event){
    try {
      event.stopPropagation()
      await this._modalCtrl.dismiss();
    } catch (err) {
      console.error("Event is undefined")
    }

    const modal = await this._modalCtrl.create({
      component: PopupPlanComponent,
      cssClass: 'freemium-popup'
    });
    modal.present();
  }
}
