import { Component, OnInit } from '@angular/core';
import { IonLabel, IonSegmentButton, IonSegment, IonSkeletonText, IonText } from "@ionic/angular/standalone";
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
@Component({
  selector: 'pro-insights',
  templateUrl: './pro-insights.component.html',
  styleUrls: ['./pro-insights.component.scss'],
  standalone: true,
  imports: [IonText, IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, ChipComponent]
})
export class ProInsightsComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
