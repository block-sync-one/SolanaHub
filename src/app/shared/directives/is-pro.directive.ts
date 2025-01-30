import {Directive, HostListener, inject, Input} from '@angular/core';
import {FreemiumService, PopupPlanComponent} from "@app/shared/layouts/freemium";
import {ModalController} from "@ionic/angular";

@Directive({
  selector: "[IsPro]",
  standalone: true
})
export class IsProDirective {
  protected _freemiumService = inject(FreemiumService);
  private _modalCtrl = inject(ModalController);

  @Input('IsProCallback') callback?: () => void = () => {};

  @HostListener('click', ['$event'])
  async handleClick(event: Event): Promise<void> {
    if (!this._freemiumService.isPremium()) {

      try {
        event.preventDefault();
        event.stopPropagation();
        await this._modalCtrl.dismiss();
      } catch (err) {
      }

      const modal = await this._modalCtrl.create({
        component: PopupPlanComponent,
        cssClass: 'freemium-popup'
      })

      await modal.present()

    } else {
      this.callback && this.callback();
    }
  }
}
