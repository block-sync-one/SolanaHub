import {Component, inject, Input} from '@angular/core';
import {NgClass} from "@angular/common";
import {FreemiumService} from "@app/shared/layouts/freemium";
import {FreemiumModule} from "@app/shared/layouts/freemium/freemium.module";

@Component({
  selector: 'app-platform-fee',
  templateUrl: './platform-fee.component.html',
  styleUrls: ['./platform-fee.component.scss'],
  imports: [
    NgClass,
    FreemiumModule
  ],
  standalone: true
})
export class PlatformFeeComponent {
  public isPremium = inject(FreemiumService).isPremium;
  @Input() feeInSOL: number | string;
}
