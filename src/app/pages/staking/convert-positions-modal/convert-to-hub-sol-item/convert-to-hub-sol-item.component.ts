import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {ConvertToHubSolToken} from "@app/models";
import {UtilService} from "@app/services";

@Component({
  selector: 'convert-to-hub-sol-item',
  templateUrl: './convert-to-hub-sol-item.component.html',
  styleUrls: ['./convert-to-hub-sol-item.component.scss'],
  imports: [
    IonicModule
  ],
  standalone: true
})
export class ConvertToHubSolItemComponent {
  public readonly utils= inject(UtilService);

  @Input() position: ConvertToHubSolToken;
  @Output() toggleItemEmitter = new EventEmitter<string>(undefined)

  toggleItem(address: string) {
    this.toggleItemEmitter.emit(address);
  }
}
