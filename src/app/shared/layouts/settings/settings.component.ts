import { Component, inject } from '@angular/core';
import {
  IonImg,
} from '@ionic/angular/standalone';
import { SelectGroupConfigComponent } from './select-group-config/select-group-config.component';
import { ModalController } from '@ionic/angular';
import { environment } from "../../../../environments/environment";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [
    IonImg,
    SelectGroupConfigComponent
  ]
})
export class SettingsComponent {
  private _modalCtrl = inject(ModalController)
  protected readonly environment = environment;

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

  }
  closeModal(){
    this._modalCtrl.dismiss()
  }
}
