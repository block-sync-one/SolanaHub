import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IonicModule} from "@ionic/angular";

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
  @Input() stake;
  @Output() toggleItemEmitter = new EventEmitter<string>(undefined)

  toggleItem(address: string) {
    this.toggleItemEmitter.emit(address);
  }
}
