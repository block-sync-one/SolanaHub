import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit } from '@angular/core';
import lottie from "lottie-web";
// import { defineElement } from "@lordicon/element";
// defineElement(lottie.loadAnimation);
@Component({
  selector: 'animated-icon',
  templateUrl: './animated-icon.component.html',
  styleUrls: ['./animated-icon.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AnimatedIconComponent  implements OnInit {
  @Input() icon: string;
  @Input() color: string ='primary:#9b3678,secondary:#804FB3;'
  @Input() state: string;
  @Input() trigger: string = 'hover';
  constructor() { }

  ngOnInit() {
  }

}
