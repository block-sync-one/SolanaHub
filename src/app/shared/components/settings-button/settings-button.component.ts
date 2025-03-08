import { Component, OnInit, inject } from '@angular/core';
import { SettingsComponent } from '../../layouts/settings/settings.component';
import { ModalController } from '@ionic/angular';
import {IonButton, IonIcon} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cogOutline } from 'ionicons/icons';
@Component({
  selector: 'settings-button',
  templateUrl: './settings-button.component.html',
  styleUrls: ['./settings-button.component.scss'],
  standalone:true,
  imports:[IonButton, IonIcon]
})
export class SettingsButtonComponent  implements OnInit {
  private _modalCtrl = inject(ModalController);
  constructor() {
    addIcons({cogOutline})
   }

  ngOnInit() {}
  async openSettingsModal() {
    const modal = await this._modalCtrl.create({
      component: SettingsComponent,
      cssClass: 'modal-style'
    });
    modal.present();
  }

}
