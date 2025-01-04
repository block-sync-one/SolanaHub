import { Component, OnInit } from '@angular/core';
import {
  IonImg,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonRippleEffect,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline } from 'ionicons/icons';
@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports:[
    IonImg,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonRippleEffect,
    IonIcon
  ]
})
export class MenuComponent  implements OnInit {

  constructor() { 
    addIcons({menuOutline})
  }

  ngOnInit() {}

}
